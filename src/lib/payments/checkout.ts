import { browserBinding, browserCredentialForCheckout, checkoutCookieHeader, checkoutCookieValue, signCheckoutIntent } from "@/lib/payments/capability";
import type { StripeConfig } from "./config";
import { CHECKOUT_PURPOSE, CHECKOUT_SESSION_TTL_SECONDS } from "./constants";
import type { StripeGateway } from "./stripe-server";
import { bundleSignature } from "./offers";

export async function startConfiguredCheckout(input: {
  config: StripeConfig; origin: string | null; priceId: string | null; offerToken?: string | null;
  cookieHeader?: string | null; now?: number;
  gateway: Pick<StripeGateway, "assertAccount" | "retrievePrice" | "createCheckoutSession">;
}) {
  const offer = input.offerToken ? input.config.recurringOffers?.[input.offerToken] : undefined;
  if (input.offerToken && (!offer || input.priceId)) return { status: 400, body: { error: "offer_not_allowed" } };
  if (!offer && input.config.allowedPriceIds.length === 0) return { status: 503, body: { error: "checkout_not_configured" } };
  if (!input.origin || input.origin !== input.config.appBaseUrl) return { status: 403, body: { error: "origin_rejected" } };
  const priceId = offer?.monthlyPriceId ?? input.priceId ?? (input.config.allowedPriceIds.length === 1 ? input.config.allowedPriceIds[0] : null);
  if (!priceId || (!offer && !input.config.allowedPriceIds.includes(priceId))) return { status: 400, body: { error: "price_not_allowed" } };
  await input.gateway.assertAccount();
  const price = await input.gateway.retrievePrice(priceId);
  if (price.id !== priceId || !price.active || price.type !== (offer ? "recurring" : "one_time") || price.livemode !== (input.config.mode === "live") || (offer && (price.currency !== "usd" || price.interval !== "month" || price.intervalCount !== 1 || !(Number(price.unitAmount) > 0)))) return { status: 403, body: { error: "price_not_verified" } };
  if (offer?.setupPriceId) {
    const setup = await input.gateway.retrievePrice(offer.setupPriceId);
    if (setup.id !== offer.setupPriceId || !setup.active || setup.type !== "one_time" || setup.livemode !== price.livemode || setup.currency !== "usd" || setup.currency !== price.currency || !(Number(setup.unitAmount) > 0)) return { status: 403, body: { error: "setup_price_not_verified" } };
  }
  const now = input.now ?? Math.floor(Date.now() / 1000);
  const credential = browserCredentialForCheckout(input.config.capabilitySecret, checkoutCookieValue(input.cookieHeader ?? null), now);
  const binding = browserBinding(input.config.mode, input.config.expectedAccountId, credential.nonce, input.config.capabilitySecret);
  const session = await input.gateway.createCheckoutSession({
    priceId, recurring: !!offer, setupPriceId: offer?.setupPriceId,
    successUrl: `${input.config.appBaseUrl}/payment/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${input.config.appBaseUrl}/payment/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    expiresAt: now + CHECKOUT_SESSION_TTL_SECONDS,
    metadata: {
      purpose: CHECKOUT_PURPOSE, price_id: priceId,
      intent: signCheckoutIntent(input.config.mode, priceId, input.config.capabilitySecret), browser_binding: binding,
      ...(offer ? { billing: "recurring-v1", monthly_price_id: priceId, setup_price_id: offer.setupPriceId ?? "", bundle_signature: bundleSignature(input.config, priceId, offer.setupPriceId) } : {}),
    },
  });
  return { status: 200, body: { url: session.url }, cookie: checkoutCookieHeader(credential.token, input.config.appBaseUrl.startsWith("https://")) };
}
