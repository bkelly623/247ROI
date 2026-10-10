import { createHash, randomBytes } from "node:crypto";
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

export type PaymentLedger = {
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

/** In-memory ledger for deterministic tests. Production routes must not call this or fall back to it. */
export function createMemoryLedger(): PaymentLedger {
  const events = new Map<string, ApplyResult>();
  const bySession = new Map<string, FulfillmentState>();
  const byIntent = new Map<string, FulfillmentState>();
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
    if (error) throw new Error("payment_persist_failed");
    return data;
  }

  return {
    async apply(action) {
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
