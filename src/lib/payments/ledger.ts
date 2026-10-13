import { createHash, randomBytes } from "node:crypto";
import { validateBillingSnapshot, type BillingApplyResult, type BillingInvoice, type BillingSnapshot } from "./recurring";
import { createServiceClient } from "@/lib/audit/supabase/server";
import type { StripeMode } from "@/lib/payments/config";
import { assertIncomingIdentity, combineFulfillments, reduceFulfillment, type CheckoutAction, type FulfillmentState, type FulfillmentStatus, type RefundAction } from "@/lib/payments/state";
export type OnboardingRecord = {
  accountId: string;
  sessionId: string;
  mode: StripeMode;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  serviceNotes: string;
  updatedAt: string;
};

export type OutboxRecord = {
  dedupeKey: string;
  mode: StripeMode;
  kind: string;
  payload: Record<string, unknown>;
  sentAt: string | null;
  attemptCount: number;
  lastError: string | null;
  leaseUntil?: number | null;
  nextAttemptAt?: number | null;
  abandoned?: boolean;
  claimToken?: string | null;
};

export type ApplyResult = {
  duplicate: boolean;
  ignored: boolean;
  status: FulfillmentStatus | "ignored";
  fulfilledNow: boolean;
  sessionId: string | null;
  paymentIntentId: string | null;
  recognized: boolean;
};

export type LedgerAction =
  | ({ eventId: string; eventType: string; payload: Record<string, unknown> } & (CheckoutAction | RefundAction))
  | {
      kind: "ignore";
      eventId: string;
      eventType: string;
      accountId: string;
      mode: StripeMode;
      payload: Record<string, unknown>;
    };

export type BillingLeaseInput = { accountId: string; mode: StripeMode; subscriptionId: string; holder: string; leaseSeconds: number };
export type BillingLeaseToken = { accountId: string; mode: StripeMode; subscriptionId: string; holder: string; fence: number };

export type PaymentLedger = {
  acquireBillingLease?: (input: BillingLeaseInput) => Promise<{ fence: number } | null>;
  releaseBillingLease?: (input: BillingLeaseToken) => Promise<boolean>;
  applyBilling?: (snapshot: BillingSnapshot) => Promise<BillingApplyResult>;
  apply(action: LedgerAction, nowIso?: string): Promise<ApplyResult>;
  getBySession(accountId: string, mode: StripeMode, sessionId: string): Promise<FulfillmentState | null>;
  saveOnboarding(record: OnboardingRecord): Promise<OnboardingRecord>;
  getOnboarding(accountId: string, mode: StripeMode, sessionId: string): Promise<OnboardingRecord | null>;
  enqueue(record: OutboxRecord): Promise<OutboxRecord>;
  listOutbox(): Promise<OutboxRecord[]>;
  markOutboxSent(dedupeKey: string, sentAt: string, claimToken: string): Promise<boolean>;
  markOutboxFailed(dedupeKey: string, error: string, claimToken: string): Promise<boolean>;
  claimNotifications(worker: string, limit: number, leaseSeconds: number): Promise<OutboxRecord[]>;
};

function eventKey(accountId: string, mode: string, eventId: string) {
  return `${accountId}|${mode}|${eventId}`;
}

/** Shared by the test ledger and the Supabase save RPC so retries hit one outbox row. */
export function onboardingDedupeKey(record: Pick<OnboardingRecord, "mode" | "sessionId" | "businessName" | "contactName" | "email" | "phone" | "website" | "serviceNotes">) {
  const hash = createHash("sha256")
    .update(JSON.stringify([record.businessName, record.contactName, record.email, record.phone, record.website, record.serviceNotes]))
    .digest("hex")
    .slice(0, 16);
  return `onboarding:${record.mode}:${record.sessionId}:${hash}`;
}

function invoiceRank(status: string): number {
  if (status === "paid") return 40;
  if (status === "uncollectible" || status === "void") return 30;
  return 10;
}

function mergeInvoice(stored: BillingInvoice | undefined, incoming: BillingInvoice): BillingInvoice {
  if (!stored) return incoming;
  const storedPrices = [...stored.priceIds].sort().join("\0");
  const incomingPrices = [...incoming.priceIds].sort().join("\0");
  if (storedPrices !== incomingPrices || stored.initial !== incoming.initial || stored.currency !== incoming.currency) throw new Error("payment_identity_conflict");
  if (stored.paymentIntentId && incoming.paymentIntentId && stored.paymentIntentId !== incoming.paymentIntentId) throw new Error("payment_identity_conflict");
  const incomingRank = invoiceRank(incoming.status);
  const storedRank = invoiceRank(stored.status);
  const keepStored = incomingRank < storedRank || (incomingRank === storedRank && incoming.status !== stored.status);
  return {
    ...incoming,
    status: keepStored ? stored.status : incoming.status,
    paymentIntentId: stored.paymentIntentId ?? incoming.paymentIntentId,
    amountPaid: keepStored ? stored.amountPaid : incoming.amountPaid,
    amountDue: keepStored ? stored.amountDue : incoming.amountDue,
  };
}

/** In-memory ledger for deterministic tests. Production routes must not call this or fall back to it. */
export function createMemoryLedger(): PaymentLedger {
  const events = new Map<string, ApplyResult>();
  const billingEvents = new Map<string, BillingApplyResult>();
  const bySession = new Map<string, FulfillmentState>();
  const byIntent = new Map<string, FulfillmentState>();
  const subscriptions = new Map<string, { customerId: string; sessionId: string; browserBinding: string; monthlyPriceId: string; setupPriceId: string | null; subscriptionStatus: string; cancelAtPeriodEnd: boolean; observedAt: string }>();
  const readLeases = new Map<string, { fence: number; holder: string; until: number }>();
  const billingInvoices = new Map<string, BillingInvoice>();
  const profiles = new Map<string, OnboardingRecord>();
  const outbox = new Map<string, OutboxRecord>();
  let tail: Promise<unknown> = Promise.resolve();

  function exclusive<T>(fn: () => T): Promise<T> {
    const run = tail.then(() => fn());
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  function remember(state: FulfillmentState) {
    if (state.sessionId) bySession.set(`${state.accountId}|${state.mode}|${state.sessionId}`, state);
    if (state.paymentIntentId) byIntent.set(`${state.accountId}|${state.mode}|${state.paymentIntentId}`, state);
  }

  return {
    acquireBillingLease(input) {
      return exclusive(() => {
        if (!/^sub_[A-Za-z0-9]+$/.test(input.subscriptionId) || !/^[A-Za-z0-9]{16,80}$/.test(input.holder) || input.leaseSeconds < 5 || input.leaseSeconds > 60) throw new Error("billing_lease_invalid");
        const key = `${input.accountId}|${input.mode}|${input.subscriptionId}`;
        const current = readLeases.get(key);
        const now = Date.now();
        if (current && current.until > now) return null;
        const fence = (current?.fence ?? 0) + 1;
        readLeases.set(key, { fence, holder: input.holder, until: now + input.leaseSeconds * 1000 });
        return { fence };
      });
    },
    releaseBillingLease(input) {
      return exclusive(() => {
        const key = `${input.accountId}|${input.mode}|${input.subscriptionId}`;
        const current = readLeases.get(key);
        if (!current || current.fence !== input.fence || current.holder !== input.holder || current.until <= Date.now()) return false;
        current.until = Date.now();
        return true;
      });
    },
    applyBilling(snapshot) {
      return exclusive(() => {
        validateBillingSnapshot(snapshot);
        const key = eventKey(snapshot.account, snapshot.mode, snapshot.eventId);
        const prior = billingEvents.get(key);
        if (prior) return { ...prior, duplicate: true, fulfilledNow: false, serviceTerminated: false };
        const leaseKey = `${snapshot.account}|${snapshot.mode}|${snapshot.subscriptionId}`;
        const lease = readLeases.get(leaseKey);
        if (!lease || lease.fence !== snapshot.fence || lease.holder !== snapshot.holder || lease.until <= Date.now()) throw new Error("billing_lease_lost");
        const subKey = leaseKey;
        const storedSub = subscriptions.get(subKey);
        if (storedSub && (storedSub.customerId !== snapshot.customerId || storedSub.sessionId !== snapshot.sessionId || storedSub.browserBinding !== snapshot.browserBinding || storedSub.monthlyPriceId !== snapshot.monthlyPriceId || storedSub.setupPriceId !== snapshot.setupPriceId)) {
          throw new Error("payment_identity_conflict");
        }
        const subscriptionStatus = snapshot.subscriptionStatus;
        const cancelAtPeriodEnd = snapshot.cancelAtPeriodEnd;
        subscriptions.set(subKey, {
          customerId: snapshot.customerId,
          sessionId: snapshot.sessionId,
          browserBinding: snapshot.browserBinding,
          monthlyPriceId: snapshot.monthlyPriceId,
          setupPriceId: snapshot.setupPriceId,
          subscriptionStatus,
          cancelAtPeriodEnd,
          observedAt: snapshot.observedAt,
        });
        for (const invoice of snapshot.invoices) {
          const invoiceKey = `${snapshot.account}|${snapshot.mode}|${invoice.id}`;
          billingInvoices.set(invoiceKey, mergeInvoice(billingInvoices.get(invoiceKey), invoice));
        }
        let status = "recorded";
        let fulfilledNow = false;
        let paymentIntentId: string | null = null;
        const initial = snapshot.initialInvoiceId ? billingInvoices.get(`${snapshot.account}|${snapshot.mode}|${snapshot.initialInvoiceId}`) : undefined;
        if (initial) {
          const outcome = initial.status === "paid" ? "paid" : initial.status === "uncollectible" || initial.status === "void" ? "failed" : "unpaid";
          const sessionState = bySession.get(`${snapshot.account}|${snapshot.mode}|${snapshot.sessionId}`) ?? null;
          const intentState = initial.paymentIntentId ? byIntent.get(`${snapshot.account}|${snapshot.mode}|${initial.paymentIntentId}`) ?? null : null;
          let current = sessionState ?? intentState;
          const action: CheckoutAction = {
            kind: "checkout",
            accountId: snapshot.account,
            mode: snapshot.mode as StripeMode,
            sessionId: snapshot.sessionId,
            paymentIntentId: initial.paymentIntentId,
            chargeId: null,
            customerId: snapshot.customerId,
            amountTotal: initial.status === "paid" ? initial.amountPaid : initial.amountDue,
            currency: initial.currency,
            recognized: initial.status === "paid",
            outcome,
            browserBinding: snapshot.browserBinding,
          };
          if (sessionState && intentState && sessionState !== intentState) {
            assertIncomingIdentity(sessionState, action);
            assertIncomingIdentity(intentState, action);
            current = combineFulfillments(sessionState, intentState);
          } else if (current) assertIncomingIdentity(current, action);
          const reduced = reduceFulfillment(current, action, snapshot.observedAt);
          remember(reduced.state);
          fulfilledNow = reduced.fulfilledNow;
          status = reduced.state.status;
          paymentIntentId = reduced.state.paymentIntentId;
          if (reduced.fulfilledNow && reduced.state.sessionId) {
            const dedupeKey = `fulfillment:${snapshot.account}:${snapshot.mode}:${reduced.state.sessionId}`;
            if (!outbox.has(dedupeKey)) {
              outbox.set(dedupeKey, {
                dedupeKey,
                mode: snapshot.mode as StripeMode,
                kind: "fulfillment_recorded",
                payload: { sessionId: reduced.state.sessionId, mode: snapshot.mode, amountTotal: reduced.state.amountTotal, currency: reduced.state.currency },
                sentAt: null,
                attemptCount: 0,
                lastError: null,
              });
            }
          }
        }
        const result: BillingApplyResult = { duplicate: false, status, fulfilledNow, paymentIntentId, subscriptionStatus, cancelAtPeriodEnd, serviceTerminated: false };
        billingEvents.set(key, result);
        return result;
      });
    },
    apply(action, nowIso = new Date().toISOString()) {
      return exclusive(() => {
        const key = eventKey(action.accountId, action.mode, action.eventId);
        const prior = events.get(key);
        if (prior) return { ...prior, duplicate: true, fulfilledNow: false };
        if (action.kind === "ignore") {
          const result: ApplyResult = {
            duplicate: false,
            ignored: true,
            status: "ignored",
            fulfilledNow: false,
            sessionId: null,
            paymentIntentId: null,
            recognized: false,
          };
          events.set(key, result);
          return result;
        }
        const sessionState = action.kind === "checkout" ? bySession.get(`${action.accountId}|${action.mode}|${action.sessionId}`) ?? null : null;
        const intentState = action.paymentIntentId ? byIntent.get(`${action.accountId}|${action.mode}|${action.paymentIntentId}`) ?? null : null;
        let current = sessionState ?? intentState;
        if (sessionState && intentState && sessionState !== intentState) {
          assertIncomingIdentity(sessionState, action);
          assertIncomingIdentity(intentState, action);
          current = combineFulfillments(sessionState, intentState);
        } else if (current) {
          assertIncomingIdentity(current, action);
        }
        const reduced = reduceFulfillment(current, action, nowIso);
        remember(reduced.state);
        if (reduced.fulfilledNow && reduced.state.sessionId) {
          const dedupeKey = `fulfillment:${action.accountId}:${action.mode}:${reduced.state.sessionId}`;
          if (!outbox.has(dedupeKey)) {
            outbox.set(dedupeKey, {
              dedupeKey,
              mode: action.mode,
              kind: "fulfillment_recorded",
              payload: {
                sessionId: reduced.state.sessionId,
                mode: action.mode,
                amountTotal: reduced.state.amountTotal,
                currency: reduced.state.currency,
              },
              sentAt: null,
              attemptCount: 0,
              lastError: null,
            });
          }
        }
        const result: ApplyResult = {
          duplicate: false,
          ignored: false,
          status: reduced.state.status,
          fulfilledNow: reduced.fulfilledNow,
          sessionId: reduced.state.sessionId,
          paymentIntentId: reduced.state.paymentIntentId,
          recognized: reduced.state.recognized,
        };
        events.set(key, result);
        return result;
      });
    },
    getBySession(accountId, mode, sessionId) {
      return exclusive(() => bySession.get(`${accountId}|${mode}|${sessionId}`) ?? null);
    },
    saveOnboarding(record) {
      return exclusive(() => {
        const state = bySession.get(`${record.accountId}|${record.mode}|${record.sessionId}`);
        if (!state?.recognized || (state.status !== "paid" && state.status !== "partially_refunded")) {
          throw new Error("onboarding_not_available");
        }
        const key = `${record.accountId}|${record.mode}|${record.sessionId}`;
        const existing = profiles.get(key);
        const saved = { ...record, updatedAt: record.updatedAt || new Date().toISOString() };
        profiles.set(key, saved);
        if (!existing || onboardingDedupeKey(existing) !== onboardingDedupeKey(saved)) {
          const dedupeKey = onboardingDedupeKey(saved);
          if (!outbox.has(dedupeKey)) {
            outbox.set(dedupeKey, {
              dedupeKey,
              mode: record.mode,
              kind: "onboarding_saved",
              payload: {
                sessionId: record.sessionId,
                mode: record.mode,
                businessName: record.businessName,
                contactName: record.contactName,
                email: record.email,
                phone: record.phone,
                website: record.website,
                serviceNotes: record.serviceNotes,
              },
              sentAt: null,
              attemptCount: 0,
              lastError: null,
            });
          }
        }
        return saved;
      });
    },
    getOnboarding(accountId, mode, sessionId) {
      return exclusive(() => profiles.get(`${accountId}|${mode}|${sessionId}`) ?? null);
    },
    enqueue(record) {
      return exclusive(() => {
        const existing = outbox.get(record.dedupeKey);
        if (existing) return existing;
        outbox.set(record.dedupeKey, record);
        return record;
      });
    },
    listOutbox() {
      return exclusive(() => [...outbox.values()]);
    },
    markOutboxSent(dedupeKey, sentAt, claimToken) {
      return exclusive(() => {
        const row = outbox.get(dedupeKey);
        if (!row || !claimToken || claimToken.length < 32 || row.claimToken !== claimToken) return false;
        row.sentAt = sentAt;
        row.lastError = null;
        row.leaseUntil = null;
        row.claimToken = null;
        return true;
      });
    },
    markOutboxFailed(dedupeKey, error, claimToken) {
      return exclusive(() => {
        const row = outbox.get(dedupeKey);
        if (!row || !claimToken || claimToken.length < 32 || row.claimToken !== claimToken) return false;
        row.lastError = error.slice(0, 300);
        row.leaseUntil = null;
        row.claimToken = null;
        row.nextAttemptAt = Date.now() + Math.min(3600, 2 ** row.attemptCount) * 1000;
        return true;
      });
    },
    claimNotifications(worker, limit, leaseSeconds) {
      return exclusive(() => {
        const now = Date.now();
        const ready = [...outbox.values()].filter((row) => !row.sentAt && !row.abandoned && (row.leaseUntil == null || row.leaseUntil <= now) && (row.nextAttemptAt == null || row.nextAttemptAt <= now));
        return ready.slice(0, Math.min(Math.max(limit, 0), 25)).map((row) => {
          row.attemptCount += 1;
          row.claimToken = randomBytes(32).toString("hex");
          row.leaseUntil = now + leaseSeconds * 1000;
          if (row.attemptCount >= 8) row.abandoned = true;
          void worker;
          return { ...row, payload: { ...row.payload } };
        });
      });
    },
  };
}

type RpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function createSupabasePaymentLedger(client?: RpcClient | null): PaymentLedger {
  const resolved = client === undefined ? (createServiceClient() as RpcClient | null) : client;
  if (!resolved) throw new Error("payment_ledger_unconfigured");
  return supabaseLedger(resolved);
}

function supabaseLedger(client: RpcClient): PaymentLedger {

  async function rpc(fn: string, args: Record<string, unknown>) {
    const { data, error } = await client.rpc(fn, args);
    if (error) {
      if (error.message.includes("billing_lease_lost")) throw new Error("billing_lease_lost");
      if (error.message.includes("billing_lease_busy")) throw new Error("billing_lease_busy");
      throw new Error("payment_persist_failed");
    }
    return data;
  }

  return {
    async apply(action) {
      // One-time transitions retain the immutable 018 implementation.
      const data = asRecord(
        await rpc("apply_payment_transition", {
          p_account: action.accountId,
          p_mode: action.mode,
          p_event_id: action.eventId,
          p_event_type: action.eventType,
          p_kind: action.kind,
          p_session_id: action.kind === "checkout" ? action.sessionId : null,
          p_payment_intent_id: action.kind === "ignore" ? null : action.paymentIntentId,
          p_charge_id: action.kind === "refund" ? action.chargeId : action.kind === "checkout" ? action.chargeId : null,
          p_customer_id: action.kind === "checkout" ? action.customerId : null,
          p_amount: action.kind === "checkout" ? action.amountTotal : null,
          p_currency: action.kind === "checkout" ? action.currency : null,
          p_recognized: action.kind === "checkout" ? action.recognized : false,
          p_outcome: action.kind === "checkout" ? action.outcome : null,
          p_full_refund: action.kind === "refund" ? action.fullRefund : false,
          p_payload: action.payload,
        }),
      );
      return {
        duplicate: data.duplicate === true,
        ignored: data.ignored === true,
        status: (data.status as ApplyResult["status"]) ?? "ignored",
        fulfilledNow: data.fulfilledNow === true || data.fulfilled_now === true,
        sessionId: typeof data.sessionId === "string" ? data.sessionId : typeof data.session_id === "string" ? data.session_id : null,
        paymentIntentId:
          typeof data.paymentIntentId === "string"
            ? data.paymentIntentId
            : typeof data.payment_intent_id === "string"
              ? data.payment_intent_id
              : null,
        recognized: data.recognized === true,
      };
    },
    async acquireBillingLease(input) {
      const result = asRecord(await rpc("acquire_billing_lease", { p_account: input.accountId, p_mode: input.mode, p_subscription_id: input.subscriptionId, p_holder: input.holder, p_lease_seconds: input.leaseSeconds }));
      if (result.acquired !== true) return null;
      return { fence: Number(result.fence) };
    },
    async releaseBillingLease(input) {
      const result = asRecord(await rpc("release_billing_lease", { p_account: input.accountId, p_mode: input.mode, p_subscription_id: input.subscriptionId, p_holder: input.holder, p_fence: input.fence }));
      return result.released === true;
    },
    async applyBilling(snapshot) {
      const result = asRecord(await rpc("apply_billing_snapshot", { p: snapshot }));
      if (result.serviceTerminated === true || result.service_terminated === true) throw new Error("service_termination_rejected");
      return {
        duplicate: result.duplicate === true,
        status: String(result.status),
        fulfilledNow: result.fulfilledNow === true || result.fulfilled_now === true,
        paymentIntentId: typeof result.paymentIntentId === "string" ? result.paymentIntentId : typeof result.payment_intent_id === "string" ? result.payment_intent_id : null,
        subscriptionStatus: String(result.subscriptionStatus ?? result.subscription_status ?? ""),
        cancelAtPeriodEnd: result.cancelAtPeriodEnd === true || result.cancel_at_period_end === true,
        serviceTerminated: false,
      };
    },
    async getBySession(accountId, mode, sessionId) {
      const data = await rpc("get_payment_fulfillment", { p_account: accountId, p_mode: mode, p_session_id: sessionId });
      if (!data) return null;
      const row = asRecord(data);
      if (!row.status) return null;
      return {
        accountId,
        mode,
        sessionId: typeof row.session_id === "string" ? row.session_id : sessionId,
        paymentIntentId: typeof row.payment_intent_id === "string" ? row.payment_intent_id : null,
        chargeId: typeof row.charge_id === "string" ? row.charge_id : null,
        customerId: typeof row.customer_id === "string" ? row.customer_id : null,
        status: row.status as FulfillmentStatus,
        recognized: row.recognized === true,
        amountTotal: typeof row.amount_total === "number" ? row.amount_total : null,
        currency: typeof row.currency === "string" ? row.currency : null,
        refundSeen: row.refund_seen === true,
        fullRefund: row.full_refund === true,
        fulfilledAt: typeof row.fulfilled_at === "string" ? row.fulfilled_at : null,
        browserBinding: typeof row.browser_binding === "string" ? row.browser_binding : null,
      };
    },
    async saveOnboarding(record) {
      const data = asRecord(
        await rpc("save_payment_onboarding", {
          p_account: record.accountId,
          p_mode: record.mode,
          p_session_id: record.sessionId,
          p_business_name: record.businessName,
          p_contact_name: record.contactName,
          p_email: record.email,
          p_phone: record.phone,
          p_website: record.website,
          p_service_notes: record.serviceNotes,
          p_dedupe_key: onboardingDedupeKey(record),
        }),
      );
      return {
        ...record,
        updatedAt: typeof data.updated_at === "string" ? data.updated_at : new Date().toISOString(),
      };
    },
    async getOnboarding(accountId, mode, sessionId) {
      const data = await rpc("get_payment_onboarding", { p_account: accountId, p_mode: mode, p_session_id: sessionId });
      if (!data) return null;
      const row = asRecord(data);
      if (typeof row.business_name !== "string") return null;
      return {
        accountId,
        sessionId,
        mode,
        businessName: String(row.business_name),
        contactName: String(row.contact_name),
        email: String(row.email),
        phone: String(row.phone),
        website: String(row.website ?? ""),
        serviceNotes: String(row.service_notes),
        updatedAt: String(row.updated_at ?? ""),
      };
    },
    async enqueue(record) {
      await rpc("enqueue_payment_notification", {
        p_dedupe_key: record.dedupeKey,
        p_mode: record.mode,
        p_kind: record.kind,
        p_payload: record.payload,
      });
      return record;
    },
    async listOutbox() {
      const data = await rpc("list_payment_notifications", {});
      if (!Array.isArray(data)) return [];
      return data.map((item) => {
        const row = asRecord(item);
        return {
          dedupeKey: String(row.dedupe_key),
          mode: row.mode as StripeMode,
          kind: String(row.kind),
          payload: asRecord(row.payload),
          sentAt: typeof row.sent_at === "string" ? row.sent_at : null,
          attemptCount: Number(row.attempt_count ?? 0),
          lastError: typeof row.last_error === "string" ? row.last_error : null,
        };
      });
    },
    async markOutboxSent(dedupeKey, sentAt, claimToken) {
      const data = asRecord(await rpc("mark_payment_notification", { p_dedupe_key: dedupeKey, p_claim_token: claimToken, p_sent_at: sentAt, p_error: null }));
      return data.applied === true;
    },
    async markOutboxFailed(dedupeKey, error, claimToken) {
      const data = asRecord(await rpc("mark_payment_notification", { p_dedupe_key: dedupeKey, p_claim_token: claimToken, p_sent_at: null, p_error: error.slice(0, 300) }));
      return data.applied === true;
    },
    async claimNotifications(worker, limit, leaseSeconds) {
      const data = await rpc("claim_payment_notifications", { p_worker: worker, p_limit: limit, p_lease_seconds: leaseSeconds });
      if (!Array.isArray(data)) return [];
      return data.map((item) => {
        const row = asRecord(item);
        return {
          dedupeKey: String(row.dedupe_key),
          mode: row.mode as StripeMode,
          kind: String(row.kind),
          payload: asRecord(row.payload),
          sentAt: null,
          attemptCount: Number(row.attempt_count ?? 0),
          lastError: null,
          claimToken: typeof row.claim_token === "string" ? row.claim_token : null,
        };
      });
    },
  };
}

export function newOnboardingTimestamp() {
  return new Date().toISOString();
}
