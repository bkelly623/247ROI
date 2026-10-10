import { checkoutIntentMatches } from "@/lib/payments/capability";
import type { StripeMode } from "@/lib/payments/config";
import { CHECKOUT_PURPOSE } from "@/lib/payments/constants";

export type PriceLine = { priceId: string | null; amountTotal: number | null };

export type RecognizableSession = {
  mode: string | null;
  amountTotal: number | null;
  paymentStatus: string | null;
  currency: string | null;
  lineItems: PriceLine[];
  metadata: Record<string, string>;
};

export function recognizeCheckout(
  session: RecognizableSession,
  input: { mode: StripeMode; allowedPriceIds: readonly string[]; capabilitySecret: string },
): { recognized: boolean; reason: string } {
  if (session.mode !== "payment") {
    return { recognized: false, reason: session.mode === "subscription" ? "subscription_not_enabled" : "unsupported_checkout_mode" };
  }
  if (session.paymentStatus === "no_payment_required") {
    return { recognized: false, reason: "no_payment_required" };
  }
  if (!(typeof session.amountTotal === "number" && session.amountTotal > 0)) {
    return { recognized: false, reason: "no_charge" };
  }

  const linePriceIds = session.lineItems.map((item) => item.priceId).filter((id): id is string => Boolean(id));
  if (linePriceIds.length === 0 || linePriceIds.length !== session.lineItems.length) {
    return { recognized: false, reason: "price_not_on_session" };
  }

  const allow = new Set(input.allowedPriceIds);
  if (allow.size > 0 && linePriceIds.every((id) => allow.has(id))) {
    return { recognized: true, reason: "allowlisted_price" };
  }

  const priceId = session.metadata.price_id ?? "";
  const intent = session.metadata.intent ?? "";
  if (
    session.metadata.purpose === CHECKOUT_PURPOSE &&
    priceId &&
    linePriceIds.every((id) => id === priceId) &&
    checkoutIntentMatches(input.mode, priceId, intent, input.capabilitySecret)
  ) {
    return { recognized: true, reason: "signed_intent" };
  }

  return { recognized: false, reason: "unrecognized_purchase" };
}
