import { randomBytes } from "node:crypto";
import type Stripe from "stripe";
import { EXPECTED_STRIPE_ACCOUNT_ID } from "./constants";
import type { StripeConfig } from "./config";
import { recognizedBundle } from "./offers";
import type { VerifiedStripeEvent } from "./stripe-server";

export type BillingInvoice = {
  id: string;
  status: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  paymentIntentId: string | null;
  initial: boolean;
  billingReason: string | null;
  priceIds: string[];
};

export type BillingSnapshot = {
  account: string;
  mode: string;
  eventId: string;
  eventType: string;
  observedAt: string;
  subscriptionId: string;
  customerId: string;
  sessionId: string;
  initialInvoiceId: string | null;
  subscriptionStatus: string;
  cancelAtPeriodEnd: boolean;
  browserBinding: string;
  monthlyPriceId: string;
  setupPriceId: string | null;
  invoices: BillingInvoice[];
  /** Fencing token from the read lease. Required when applying. Not a timestamp. */
  fence?: number;
  holder?: string;
};

export type BillingApplyResult = {
  duplicate: boolean;
  status: string;
  fulfilledNow: boolean;
  paymentIntentId: string | null;
  subscriptionStatus: string;
  cancelAtPeriodEnd: boolean;
  serviceTerminated: false;
};

const PRICE = /^price_[A-Za-z0-9]+$/;
const INVOICE_STATUSES = new Set(["paid", "open", "draft", "uncollectible", "void"]);

const id = (v: unknown): string | null => typeof v === "string" ? v : v && typeof v === "object" && "id" in v ? String((v as { id: unknown }).id) : null;

function invoicePriceId(line: Stripe.InvoiceLineItem): string {
  const price = line.pricing?.price_details?.price;
  const priceId = typeof price === "string" ? price : price?.id ?? "";
  if (line.quantity !== 1 || !PRICE.test(priceId)) throw new Error("billing_line_invalid");
  return priceId;
}

/** Server-built snapshots only. Price composition is checked again before any fulfillment. */
export function validateBillingSnapshot(snapshot: BillingSnapshot): void {
  if (snapshot.account !== EXPECTED_STRIPE_ACCOUNT_ID) throw new Error("stripe_account_not_allowed");
  if (snapshot.mode !== "test" && snapshot.mode !== "live") throw new Error("billing_mode_invalid");
  if (Number.isNaN(Date.parse(snapshot.observedAt))) throw new Error("billing_observed_at_invalid");
  const prefix = snapshot.mode === "test" ? "cs_test_" : "cs_live_";
  if (!snapshot.sessionId.startsWith(prefix) || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(snapshot.sessionId)) throw new Error("billing_session_mode_mismatch");
  if (!/^sub_[A-Za-z0-9]+$/.test(snapshot.subscriptionId)) throw new Error("billing_subscription_invalid");
  if (!/^cus_[A-Za-z0-9]+$/.test(snapshot.customerId)) throw new Error("billing_customer_invalid");
  if (!/^[a-f0-9]{64}$/.test(snapshot.browserBinding)) throw new Error("billing_binding_missing");
  if (!PRICE.test(snapshot.monthlyPriceId)) throw new Error("billing_price_invalid");
  if (snapshot.setupPriceId !== null && (!PRICE.test(snapshot.setupPriceId) || snapshot.setupPriceId === snapshot.monthlyPriceId)) throw new Error("billing_price_invalid");
  if (!Array.isArray(snapshot.invoices) || snapshot.invoices.length > 10) throw new Error("billing_invoices_invalid");
  const expectedInitial = [snapshot.monthlyPriceId, ...(snapshot.setupPriceId ? [snapshot.setupPriceId] : [])].sort();
  const seen = new Set<string>();
  for (const inv of snapshot.invoices) {
    if (seen.has(inv.id)) throw new Error("billing_invoice_duplicate");
    seen.add(inv.id);
    if (!/^in_[A-Za-z0-9]+$/.test(inv.id)) throw new Error("billing_invoice_invalid");
    if (inv.initial !== (inv.id === snapshot.initialInvoiceId)) throw new Error("billing_initial_flag");
    if (inv.paymentIntentId !== null && !/^pi_[A-Za-z0-9]+$/.test(inv.paymentIntentId)) throw new Error("billing_payment_intent_invalid");
    if (!INVOICE_STATUSES.has(inv.status)) throw new Error("billing_invoice_status_unknown");
    if (!/^usd$/.test(inv.currency) || !Number.isInteger(inv.amountDue) || !Number.isInteger(inv.amountPaid) || inv.amountDue < 0 || inv.amountPaid < 0) throw new Error("billing_amount_invalid");
    const prices = [...inv.priceIds].sort();
    if (inv.initial) {
      if (prices.length !== expectedInitial.length || prices.some((price, index) => price !== expectedInitial[index])) throw new Error("billing_invoice_prices");
      if (inv.billingReason && inv.billingReason !== "subscription_create") throw new Error("billing_initial_reason");
      if (inv.status === "paid" && !inv.paymentIntentId) throw new Error("billing_payment_intent_missing");
    } else {
      if (snapshot.setupPriceId && prices.includes(snapshot.setupPriceId)) throw new Error("billing_setup_on_renewal");
      if (prices.length !== 1 || prices[0] !== snapshot.monthlyPriceId) throw new Error("billing_renewal_prices");
      if (inv.billingReason === "subscription_create") throw new Error("billing_renewal_reason");
    }
  }
  if (snapshot.initialInvoiceId && !seen.has(snapshot.initialInvoiceId)) throw new Error("billing_initial_missing");
}

const SUB_ID = /^sub_[A-Za-z0-9]+$/;

/** Subscription id from the event payload only. This is not a status read. */
export function subscriptionKeyFromEvent(event: VerifiedStripeEvent): string | null {
  const object = event.data.object;
  if (event.type.startsWith("customer.subscription.")) return typeof object.id === "string" && SUB_ID.test(object.id) ? object.id : null;
  if (event.type.startsWith("checkout.session.")) return typeof object.subscription === "string" && SUB_ID.test(object.subscription) ? object.subscription : null;
  if (event.type.startsWith("invoice.")) {
    const parent = object.parent;
    if (!parent || typeof parent !== "object") return null;
    const details = (parent as { subscription_details?: { subscription?: unknown } }).subscription_details;
    return typeof details?.subscription === "string" && SUB_ID.test(details.subscription) ? details.subscription : null;
  }
  return null;
}

/** One id lookup when the payload has no subscription id. The returned id is not applied as status. */
export async function discoverSubscriptionId(stripe: Stripe, event: VerifiedStripeEvent): Promise<string | null> {
  const known = subscriptionKeyFromEvent(event);
  if (known) return known;
  const object = event.data.object;
  if (event.type.startsWith("checkout.session.")) {
    const session = await stripe.checkout.sessions.retrieve(String(object.id));
    if (session.mode !== "subscription") return null;
    const subId = id(session.subscription);
    return subId && SUB_ID.test(subId) ? subId : null;
  }
  if (event.type.startsWith("invoice.")) {
    const invoice = await stripe.invoices.retrieve(String(object.id));
    const subId = id(invoice.parent?.subscription_details?.subscription);
    return subId && SUB_ID.test(subId) ? subId : null;
  }
  return null;
}

/**
 * Authoritative refetch. Call only after acquireBillingLease for subscriptionId.
 * observedAt records when this refetch finished. It is not the concurrency fence.
 */
export async function retrieveBillingSnapshot(stripe: Stripe, config: StripeConfig, event: VerifiedStripeEvent, subscriptionId: string): Promise<BillingSnapshot | null> {
  if (!SUB_ID.test(subscriptionId)) throw new Error("billing_subscription_invalid");
  const object = event.data.object;
  let invoiceId: string | null = null;
  if (event.type.startsWith("invoice.")) invoiceId = typeof object.id === "string" ? object.id : null;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const observedAt = new Date().toISOString();
  const subId = subscription.id;
  let session: Stripe.Checkout.Session | undefined;
  if (event.type.startsWith("checkout.session.")) {
    session = await stripe.checkout.sessions.retrieve(String(object.id), { expand: ["line_items"] });
    if (session.mode !== "subscription" || id(session.subscription) !== subId) return null;
  }
  if (!session) {
    const sessions = await stripe.checkout.sessions.list({ subscription: subId, limit: 2 });
    if (sessions.data.length !== 1) return null;
    session = await stripe.checkout.sessions.retrieve(sessions.data[0].id, { expand: ["line_items"] });
  }
  const live = config.mode === "live";
  if (session.livemode !== live || subscription.livemode !== live || id(session.customer) !== id(subscription.customer) || id(session.subscription) !== subscription.id) throw new Error("billing_identity_mismatch");
  const meta = session.metadata ?? {};
  const lines = session.line_items;
  if (!lines || lines.has_more || lines.data.some((line) => line.quantity !== 1) || !recognizedBundle(config, meta, lines.data.map((line) => line.price?.id ?? ""))) return null;
  if (!/^[a-f0-9]{64}$/.test(meta.browser_binding ?? "")) throw new Error("billing_binding_missing");
  const initialId = id(session.invoice);
  const setupPriceId = meta.setup_price_id ? meta.setup_price_id : null;
  const invoices: BillingInvoice[] = [];
  for (const invId of new Set([initialId, invoiceId].filter((value): value is string => !!value))) {
    const inv = await stripe.invoices.retrieve(invId);
    if (inv.livemode !== live || id(inv.customer) !== id(session.customer) || id(inv.parent?.subscription_details?.subscription) !== subId) throw new Error("billing_invoice_mismatch");
    if (inv.lines.has_more) throw new Error("billing_invoice_lines_review_required");
    const payments = await stripe.invoicePayments.list({ invoice: inv.id, limit: 100 });
    if (payments.has_more) throw new Error("billing_payments_review_required");
    const intents = [...new Set(payments.data.filter((payment) => payment.status === "paid" && payment.payment.type === "payment_intent").map((payment) => id(payment.payment.payment_intent)).filter((payment): payment is string => !!payment))];
    if (intents.length > 1) throw new Error("billing_split_payment_review_required");
    invoices.push({
      id: inv.id,
      status: inv.status ?? "draft",
      amountDue: inv.amount_due,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      paymentIntentId: intents[0] ?? null,
      initial: inv.id === initialId,
      billingReason: inv.billing_reason,
      priceIds: inv.lines.data.map(invoicePriceId),
    });
  }
  const snapshot: BillingSnapshot = {
    account: config.expectedAccountId,
    mode: config.mode,
    eventId: event.id,
    eventType: event.type,
    observedAt,
    subscriptionId: subId,
    customerId: id(session.customer)!,
    sessionId: session.id,
    initialInvoiceId: initialId,
    subscriptionStatus: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    browserBinding: meta.browser_binding,
    monthlyPriceId: meta.monthly_price_id ?? "",
    setupPriceId,
    invoices,
  };
  validateBillingSnapshot(snapshot);
  return snapshot;
}

type ReadLease = {
  acquireBillingLease(input: { accountId: string; mode: "test" | "live"; subscriptionId: string; holder: string; leaseSeconds: number }): Promise<{ fence: number } | null>;
  releaseBillingLease(input: { accountId: string; mode: "test" | "live"; subscriptionId: string; holder: string; fence: number }): Promise<boolean>;
  applyBilling(snapshot: BillingSnapshot): Promise<BillingApplyResult>;
};

/**
 * Discover the subscription key, acquire its fence, refetch under that lease, then apply.
 * The database transaction is not held during Stripe calls. A lost or expired fence cannot commit,
 * and the event row is written only inside the accepted apply.
 */
export async function ingestBillingEvent(input: {
  config: StripeConfig;
  event: VerifiedStripeEvent;
  ledger: ReadLease;
  discoverSubscriptionId: (event: VerifiedStripeEvent) => Promise<string | null>;
  readBilling: (event: VerifiedStripeEvent, subscriptionId: string) => Promise<BillingSnapshot | null>;
}): Promise<{ kind: "ignored" } | { kind: "applied"; result: BillingApplyResult }> {
  const subscriptionId = subscriptionKeyFromEvent(input.event) ?? await input.discoverSubscriptionId(input.event);
  if (!subscriptionId) return { kind: "ignored" };
  const holder = randomBytes(16).toString("hex");
  const mode = input.config.mode;
  const lease = await input.ledger.acquireBillingLease({ accountId: input.config.expectedAccountId, mode, subscriptionId, holder, leaseSeconds: 30 });
  if (!lease) throw new Error("billing_lease_busy");
  let held = true;
  const release = async () => {
    if (!held) return;
    held = false;
    await input.ledger.releaseBillingLease({ accountId: input.config.expectedAccountId, mode, subscriptionId, holder, fence: lease.fence });
  };
  try {
    const snapshot = await input.readBilling(input.event, subscriptionId);
    if (!snapshot || snapshot.subscriptionId !== subscriptionId) {
      await release();
      return { kind: "ignored" };
    }
    const result = await input.ledger.applyBilling({ ...snapshot, fence: lease.fence, holder });
    await release();
    return { kind: "applied", result };
  } catch (error) {
    await release();
    throw error;
  }
}
