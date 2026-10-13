import type { StripeConfig } from "@/lib/payments/config";
import type { PaymentLedger } from "@/lib/payments/ledger";
import { recognizeCheckout, type PriceLine } from "@/lib/payments/recognition";
import type { CheckoutAction } from "@/lib/payments/state";
import { ingestBillingEvent } from "@/lib/payments/recurring";
import type { StripeGateway, VerifiedStripeEvent } from "@/lib/payments/stripe-server";

export type WebhookResult = { status: number; body: Record<string, unknown> };

const CHECKOUT_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function stringField(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function idField(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  const record = asObject(value);
  return record && typeof record.id === "string" ? record.id : null;
}

function metadata(obj: Record<string, unknown>): Record<string, string> {
  const raw = asObject(obj.metadata);
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && key.length <= 40 && value.length <= 500) out[key] = value;
  }
  return out;
}

export function lineItemsFrom(obj: Record<string, unknown>): PriceLine[] | null {
  if (!Object.prototype.hasOwnProperty.call(obj, "line_items") || obj.line_items == null) return null;
  const data = Array.isArray(obj.line_items) ? obj.line_items : asObject(obj.line_items)?.data;
  if (!Array.isArray(data)) return null;
  return data.map((item) => {
    const row = asObject(item) ?? {};
    const price = row.price;
    return {
      priceId: typeof price === "string" ? price : idField(price),
      amountTotal: typeof row.amount_total === "number" ? row.amount_total : null,
    };
  });
}

function bindingField(meta: Record<string, string>): string | null {
  const value = meta.browser_binding ?? "";
  return /^[a-f0-9]{64}$/.test(value) ? value : null;
}

function safePayload(event: VerifiedStripeEvent, sessionId: string | null, paymentIntentId: string | null, amountTotal: number | null, browserBinding: string | null = null) {
  return { id: event.id, type: event.type, sessionId, paymentIntentId, amountTotal, browserBinding };
}

function publicBody(result: { duplicate: boolean; status: string }) {
  return { received: true, duplicate: result.duplicate, status: result.status };
}

export async function handleStripeWebhook(input: {
  rawBody: string;
  signature: string | null;
  config: StripeConfig;
  ledger: PaymentLedger;
  gateway: Pick<StripeGateway, "constructEvent" | "retrieveCheckoutSession" | "discoverSubscriptionId" | "readBilling">;
}): Promise<WebhookResult> {
  if (!input.signature) return { status: 400, body: { error: "signature_invalid" } };
  let event: VerifiedStripeEvent;
  try {
    event = input.gateway.constructEvent(input.rawBody, input.signature, input.config.webhookSecret);
  } catch {
    return { status: 400, body: { error: "signature_invalid" } };
  }
  if (event.livemode !== (input.config.mode === "live")) {
    return { status: 400, body: { error: "stripe_mode_mismatch" } };
  }
  if (event.account && event.account !== input.config.expectedAccountId) {
    return { status: 400, body: { error: "stripe_account_mismatch" } };
  }

  try {
    const object = asObject(event.data?.object);
    if (!event.id || !object) return { status: 400, body: { error: "event_invalid" } };

    const billingEvent = ["invoice.paid", "invoice.payment_failed", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type);
    const recurringCheckout = CHECKOUT_EVENTS.has(event.type) && object.mode === "subscription";
    if (billingEvent || recurringCheckout) {
      if (!input.gateway.discoverSubscriptionId || !input.gateway.readBilling || !input.ledger.acquireBillingLease || !input.ledger.applyBilling || !input.ledger.releaseBillingLease) throw new Error("billing_unconfigured");
      const ingested = await ingestBillingEvent({
        config: input.config,
        event,
        ledger: input.ledger as Required<Pick<PaymentLedger, "acquireBillingLease" | "releaseBillingLease" | "applyBilling">>,
        discoverSubscriptionId: (item) => input.gateway.discoverSubscriptionId!(item),
        readBilling: (item, subscriptionId) => input.gateway.readBilling!(item, subscriptionId),
      });
      if (ingested.kind === "applied") return { status: 200, body: publicBody(ingested.result) };
      // Unrecognized subscriptions and separate invoices cannot grant initial fulfillment.
      const result = await input.ledger.apply({ kind: "ignore", eventId: event.id, eventType: event.type, accountId: input.config.expectedAccountId, mode: input.config.mode, payload: safePayload(event, null, null, null) });
      return { status: 200, body: publicBody(result) };
    }

    if (event.type === "charge.refunded") {
      const paymentIntentId = idField(object.payment_intent);
      if (!paymentIntentId) {
        const ignored = await input.ledger.apply({
          kind: "ignore",
          eventId: event.id,
          eventType: event.type,
          accountId: input.config.expectedAccountId,
          mode: input.config.mode,
          payload: safePayload(event, null, null, null),
        });
        return { status: 200, body: publicBody(ignored) };
      }
      const amount = typeof object.amount === "number" ? object.amount : null;
      const refundedAmount = typeof object.amount_refunded === "number" ? object.amount_refunded : null;
      const fullRefund = object.refunded === true || (amount !== null && refundedAmount !== null && amount > 0 && refundedAmount >= amount);
      const applied = await input.ledger.apply({
        kind: "refund",
        eventId: event.id,
        eventType: event.type,
        accountId: input.config.expectedAccountId,
        mode: input.config.mode,
        paymentIntentId,
        chargeId: stringField(object, "id"),
        fullRefund,
        payload: safePayload(event, null, paymentIntentId, amount),
      });
      return { status: 200, body: publicBody(applied) };
    }

    if (!CHECKOUT_EVENTS.has(event.type)) {
      const ignored = await input.ledger.apply({
        kind: "ignore",
        eventId: event.id,
        eventType: event.type,
        accountId: input.config.expectedAccountId,
        mode: input.config.mode,
        payload: safePayload(event, stringField(object, "id"), null, null),
      });
      return { status: 200, body: publicBody(ignored) };
    }

    let session = object;
    if (!lineItemsFrom(session)) {
      const sessionId = stringField(session, "id");
      if (!sessionId) return { status: 400, body: { error: "event_invalid" } };
      session = await input.gateway.retrieveCheckoutSession(sessionId);
    }
    const sessionId = stringField(session, "id");
    if (!sessionId) return { status: 400, body: { error: "event_invalid" } };
    const meta = metadata(session);
    const lines = lineItemsFrom(session) ?? [];
    const amountTotal = typeof session.amount_total === "number" ? session.amount_total : null;
    const recognition = recognizeCheckout(
      {
        mode: stringField(session, "mode"),
        amountTotal,
        paymentStatus: stringField(session, "payment_status"),
        currency: stringField(session, "currency"),
        lineItems: lines,
        metadata: meta,
      },
      input.config,
    );
    const paymentStatus = stringField(session, "payment_status");
    let outcome: CheckoutAction["outcome"] = "unpaid";
    if (event.type === "checkout.session.expired") outcome = "expired";
    else if (event.type === "checkout.session.async_payment_failed") outcome = "failed";
    else if (event.type === "checkout.session.async_payment_succeeded" || paymentStatus === "paid") {
      outcome = recognition.recognized ? "paid" : "unrecognized";
    } else if (paymentStatus === "unpaid" && stringField(session, "status") === "complete") outcome = "processing";
    else if (paymentStatus === "no_payment_required") outcome = "unrecognized";

    const customerId = idField(session.customer);
    const applied = await input.ledger.apply({
      kind: "checkout",
      eventId: event.id,
      eventType: event.type,
      accountId: input.config.expectedAccountId,
      mode: input.config.mode,
      sessionId,
      paymentIntentId: idField(session.payment_intent),
      chargeId: null,
      customerId: customerId?.startsWith("cus_") ? customerId : null,
      amountTotal,
      currency: stringField(session, "currency"),
      recognized: recognition.recognized,
      outcome,
      browserBinding: bindingField(meta),
      payload: safePayload(event, sessionId, idField(session.payment_intent), amountTotal, bindingField(meta)),
    });
    return { status: 200, body: publicBody(applied) };
  } catch (error) {
    if (error instanceof Error && error.message === "payment_persist_failed") {
      return { status: 500, body: { error: "payment_persist_failed" } };
    }
    return { status: 500, body: { error: "payment_persist_failed" } };
  }
}
