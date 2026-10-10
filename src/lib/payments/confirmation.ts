import { browserBindingMatches, issueOnboardingCapability } from "@/lib/payments/capability";
import type { StripeConfig } from "@/lib/payments/config";
import { PAYMENT_SUPPORT_EMAIL } from "@/lib/payments/constants";
import type { PaymentLedger } from "@/lib/payments/ledger";
import { lineItemsFrom } from "@/lib/payments/webhook";
import { recognizeCheckout, type PriceLine } from "@/lib/payments/recognition";
import type { FulfillmentState } from "@/lib/payments/state";

export type PublicConfirmation = {
  status: "invalid" | "expired" | "unpaid" | "pending" | "processing" | "paid" | "failed" | "refunded" | "partially_refunded" | "unrecognized";
  mode: "test" | "live";
  testPayment: boolean;
  message: string;
  onboardingPath: string | null;
  poll: boolean;
};

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export type RemoteCheckout = {
  livemode: boolean;
  status: string | null;
  paymentStatus: string | null;
  mode: string | null;
  amountTotal: number | null;
  currency: string | null;
  lineItems: PriceLine[];
  metadata: Record<string, string>;
};

/** Drops email, receipt URLs, customer ids, and every other Stripe field. */
export function remoteFromStripeObject(value: unknown): RemoteCheckout | null {
  const obj = asObject(value);
  if (!obj) return null;
  const metadata: Record<string, string> = {};
  const rawMeta = asObject(obj.metadata);
  if (rawMeta) {
    for (const key of ["purpose", "price_id", "intent"] as const) {
      if (typeof rawMeta[key] === "string") metadata[key] = rawMeta[key];
    }
  }
  return {
    livemode: obj.livemode === true,
    status: typeof obj.status === "string" ? obj.status : null,
    paymentStatus: typeof obj.payment_status === "string" ? obj.payment_status : null,
    mode: typeof obj.mode === "string" ? obj.mode : null,
    amountTotal: typeof obj.amount_total === "number" ? obj.amount_total : null,
    currency: typeof obj.currency === "string" ? obj.currency : null,
    lineItems: lineItemsFrom(obj) ?? [],
    metadata,
  };
}

function view(config: StripeConfig, status: PublicConfirmation["status"], message: string, poll: boolean, onboardingPath: string | null = null): PublicConfirmation {
  const testPayment = config.mode === "test";
  const prefix = testPayment ? "Test payment. " : "";
  return { status, mode: config.mode, testPayment, message: `${prefix}${message}`, onboardingPath, poll };
}

function onboardingPath(config: StripeConfig, sessionId: string, now?: number) {
  const token = issueOnboardingCapability({
    secret: config.capabilitySecret,
    mode: config.mode,
    accountId: config.expectedAccountId,
    sessionId,
    now,
  });
  return `/payment/onboarding?token=${encodeURIComponent(token)}`;
}

export async function buildConfirmation(input: {
  sessionId: string | null | undefined;
  config: StripeConfig;
  ledger: PaymentLedger;
  retrieve: (sessionId: string) => Promise<unknown>;
  cookieNonce?: string | null;
  now?: number;
}): Promise<PublicConfirmation> {
  const sessionId = input.sessionId ?? "";
  const prefix = input.config.mode === "test" ? "cs_test_" : "cs_live_";
  if (!SESSION_ID.test(sessionId) || !sessionId.startsWith(prefix)) {
    return view(input.config, "invalid", "We couldn't verify this payment link.", false);
  }

  const ledger = await input.ledger.getBySession(input.config.expectedAccountId, input.config.mode, sessionId);
  let remote: RemoteCheckout | null = null;
  let remoteError = false;
  try {
    const retrieved = await input.retrieve(sessionId);
    if (retrieved == null) {
      if (!ledger) return view(input.config, "invalid", "We couldn't verify this payment link.", false);
    } else {
      remote = remoteFromStripeObject(retrieved);
      if (!remote || remote.livemode !== (input.config.mode === "live")) {
        return view(input.config, "invalid", "We couldn't verify this payment link.", false);
      }
    }
  } catch {
    remoteError = true;
  }

  const fromLedger = ledgerView(input.config, sessionId, ledger, input.cookieNonce ?? null, input.now);
  if (fromLedger) return fromLedger;
  if (!remote) {
    return view(input.config, "processing", remoteError ? "We couldn't reach the payment processor. Refresh shortly." : "Your payment is processing. This page will update automatically.", true);
  }
  if (remote.status === "expired") return view(input.config, "expired", "This checkout session has expired.", false);
  if (remote.paymentStatus === "paid") {
    const recognition = recognizeCheckout(
      { mode: remote.mode, amountTotal: remote.amountTotal, paymentStatus: remote.paymentStatus, currency: remote.currency, lineItems: remote.lineItems, metadata: remote.metadata },
      input.config,
    );
    if (!recognition.recognized) {
      return view(input.config, "unrecognized", `This payment isn't linked to a 247ROI implementation checkout. Contact ${PAYMENT_SUPPORT_EMAIL}.`, false);
    }
    return view(input.config, "processing", "Your payment was received and is being recorded. This page will update automatically.", true);
  }
  if (remote.status === "complete" && remote.paymentStatus === "unpaid") {
    return view(input.config, "processing", "Your payment is processing. This page will update automatically.", true);
  }
  if (remote.status === "open" || remote.paymentStatus === "unpaid") {
    return view(input.config, "unpaid", "This checkout has not been paid.", false);
  }
  return view(input.config, "pending", "This payment is not complete yet.", true);
}

function ledgerView(config: StripeConfig, sessionId: string, ledger: FulfillmentState | null, cookieNonce: string | null, now?: number): PublicConfirmation | null {
  if (!ledger) return null;
  if (ledger.fullRefund || ledger.status === "refunded") {
    return view(config, "refunded", "This payment was refunded. Onboarding is not available for a refunded charge.", false);
  }
  if (ledger.status === "failed") return view(config, "failed", "The payment failed and nothing was activated.", false);
  if (ledger.status === "expired") return view(config, "expired", "This checkout session has expired.", false);
  if (ledger.status === "unrecognized") {
    return view(config, "unrecognized", `This payment isn't linked to a 247ROI implementation checkout. Contact ${PAYMENT_SUPPORT_EMAIL}.`, false);
  }
  if ((ledger.status === "paid" || ledger.status === "partially_refunded") && ledger.recognized && ledger.fulfilledAt) {
    const owned = browserBindingMatches(config.mode, config.expectedAccountId, cookieNonce, ledger.browserBinding, config.capabilitySecret);
    const message = owned
      ? (ledger.status === "partially_refunded"
        ? "A partial refund was recorded. You can continue to implementation onboarding."
        : "Payment received. Continue to implementation onboarding.")
      : `Payment received. Continue in the same browser you used to pay. Another device cannot open onboarding from this link. Email ${PAYMENT_SUPPORT_EMAIL} for help. This page does not send an email sign-in code.`;
    return view(config, ledger.status, message, false, owned ? onboardingPath(config, sessionId, now) : null);
  }
  if (ledger.status === "processing" || ledger.status === "pending") return null;
  return null;
}
