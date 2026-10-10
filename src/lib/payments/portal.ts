import { browserBindingMatches, readOnboardingCapability } from "@/lib/payments/capability";
import { PAYMENT_SUPPORT_EMAIL } from "@/lib/payments/constants";
import { paymentReturnUrl, type StripeConfig } from "@/lib/payments/config";
import type { PaymentLedger } from "@/lib/payments/ledger";
import type { StripeGateway } from "@/lib/payments/stripe-server";

export async function createAuthorizedPortalSession(input: {
  token: string | null;
  cookieNonce?: string | null;
  config: StripeConfig;
  ledger: PaymentLedger;
  gateway: Pick<StripeGateway, "createPortalSession">;
  now?: number;
}) {
  if (!input.config.portalConfigurationId) return { status: 503, body: { error: "portal_not_configured" } };
  if (!input.token) return { status: 401, body: { error: "capability_invalid" } };
  try {
    const capability = readOnboardingCapability(input.token, input.config.capabilitySecret, input.now);
    if (capability.mode !== input.config.mode || capability.accountId !== input.config.expectedAccountId) {
      return { status: 401, body: { error: "capability_invalid" } };
    }
    const fulfillment = await input.ledger.getBySession(input.config.expectedAccountId, input.config.mode, capability.sessionId);
    if (!browserBindingMatches(input.config.mode, input.config.expectedAccountId, input.cookieNonce ?? null, fulfillment?.browserBinding ?? null, input.config.capabilitySecret)) {
      return { status: 403, body: { error: "browser_binding_required", message: `Open the billing portal from the same browser used to pay, or email ${PAYMENT_SUPPORT_EMAIL}.` } };
    }
    if (!fulfillment?.customerId || !fulfillment.recognized || (fulfillment.status !== "paid" && fulfillment.status !== "partially_refunded") || fulfillment.fullRefund) {
      return { status: 409, body: { error: "portal_unavailable" } };
    }
    const returnUrl = paymentReturnUrl(input.config, capability.sessionId);
    const session = await input.gateway.createPortalSession({
      customer: fulfillment.customerId,
      configuration: input.config.portalConfigurationId,
      returnUrl,
    });
    return { status: 200, body: { url: session.url } };
  } catch (error) {
    const code = error instanceof Error ? error.message : "capability_invalid";
    if (code === "capability_expired") return { status: 401, body: { error: code } };
    return { status: 401, body: { error: "capability_invalid" } };
  }
}
