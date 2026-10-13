import Stripe from "stripe";
import { readStripeConfig } from "@/lib/payments/config";
import { assertExpectedStripeAccount } from "@/lib/payments/stripe-server";

export async function testCheckoutPrice(env: NodeJS.ProcessEnv = process.env) {
  if (env.STRIPE_MODE !== "test") return null;
  try {
    const config = readStripeConfig(env);
    if (!config.allowedPriceIds.length) return null;
    const stripe = new Stripe(config.secretKey, { timeout: 10000, maxNetworkRetries: 0 });
    await assertExpectedStripeAccount(() => stripe.accounts.retrieve(null), config.expectedAccountId);
    for (const id of config.allowedPriceIds) {
      const price = await stripe.prices.retrieve(id);
      if (price.id === id && price.active && !price.livemode && price.type === "one_time" && price.currency === "usd" && price.unit_amount === 100) return id;
    }
  } catch { /* Fail closed without exposing configuration or provider errors. */ }
  return null;
}

export async function testRecurringOffer(env: NodeJS.ProcessEnv = process.env) {
  if (env.STRIPE_MODE !== "test") return null;
  try {
    const config = readStripeConfig(env);
    const token = env.STRIPE_TEST_RECURRING_OFFER_TOKEN;
    const offer = token ? config.recurringOffers?.[token] : undefined;
    if (!offer?.setupPriceId) return null;
    const stripe = new Stripe(config.secretKey, { timeout: 10000, maxNetworkRetries: 0 });
    await assertExpectedStripeAccount(() => stripe.accounts.retrieve(null), config.expectedAccountId);
    const [monthly, setup] = await Promise.all([stripe.prices.retrieve(offer.monthlyPriceId), stripe.prices.retrieve(offer.setupPriceId)]);
    if ([monthly, setup].every(p => p.active && !p.livemode && p.currency === "usd" && p.unit_amount === 100) && monthly.type === "recurring" && monthly.recurring?.interval === "month" && monthly.recurring.interval_count === 1 && setup.type === "one_time") return token!;
  } catch { /* Test-only entry fails closed. */ }
  return null;
}
