import { browserBinding, browserCredentialForCheckout, checkoutCookieHeader, checkoutCookieValue, signCheckoutIntent } from "@/lib/payments/capability";
import type { StripeConfig } from "@/lib/payments/config";
import { CHECKOUT_PURPOSE, CHECKOUT_SESSION_TTL_SECONDS } from "@/lib/payments/constants";
import type { StripeGateway } from "@/lib/payments/stripe-server";

export async function startConfiguredCheckout(input: {
  config: StripeConfig;
  origin: string | null;
  priceId: string | null;
  cookieHeader?: string | null;
  now?: number;
  gateway: Pick<StripeGateway, "assertAccount" | "retrievePrice" | "createCheckoutSession">;
}) {
  if (input.config.allowedPriceIds.length === 0) return { status: 503, body: { error: "checkout_not_configured" } };
  if (!input.origin || input.origin !== input.config.appBaseUrl) return { status: 403, body: { error: "origin_rejected" } };
  const priceId = input.priceId ?? (input.config.allowedPriceIds.length === 1 ? input.config.allowedPriceIds[0] : null);
  if (!priceId || !input.config.allowedPriceIds.includes(priceId)) return { status: 400, body: { error: "price_not_allowed" } };
  await input.gateway.assertAccount();
  const price = await input.gateway.retrievePrice(priceId);
  if (price.id !== priceId || !price.active || price.type !== "one_time" || price.livemode !== (input.config.mode === "live")) {
    return { status: 403, body: { error: "price_not_verified" } };
  }
  const now = input.now ?? Math.floor(Date.now() / 1000);
  const credential = browserCredentialForCheckout(input.config.capabilitySecret, checkoutCookieValue(input.cookieHeader ?? null), now);
  const binding = browserBinding(input.config.mode, input.config.expectedAccountId, credential.nonce, input.config.capabilitySecret);
  const session = await input.gateway.createCheckoutSession({
    priceId,
    successUrl: `${input.config.appBaseUrl}/payment/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${input.config.appBaseUrl}/payment/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    expiresAt: now + CHECKOUT_SESSION_TTL_SECONDS,
    metadata: {
      purpose: CHECKOUT_PURPOSE,
      price_id: priceId,
      intent: signCheckoutIntent(input.config.mode, priceId, input.config.capabilitySecret),
      browser_binding: binding,
    },
  });
  return {
    status: 200,
    body: { url: session.url },
    cookie: checkoutCookieHeader(credential.token, input.config.appBaseUrl.startsWith("https://")),
  };
}
