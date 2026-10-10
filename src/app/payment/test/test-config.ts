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
