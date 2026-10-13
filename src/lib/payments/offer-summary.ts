import type { StripeConfig } from "./config";
import type { StripeGateway } from "./stripe-server";

export async function offerSummary(token: unknown, config: StripeConfig, gateway: Pick<StripeGateway, "assertAccount" | "retrievePrice">) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{32,128}$/.test(token)) return null;
  const offer = config.recurringOffers?.[token];
  if (!offer) return null;
  await gateway.assertAccount();
  const monthly = await gateway.retrievePrice(offer.monthlyPriceId);
  if (monthly.id !== offer.monthlyPriceId || !monthly.active || monthly.livemode !== (config.mode === "live") || monthly.type !== "recurring" || monthly.currency !== "usd" || monthly.interval !== "month" || monthly.intervalCount !== 1 || !Number.isInteger(monthly.unitAmount) || !(Number(monthly.unitAmount) > 0)) return null;
  let setupAmount = 0;
  if (offer.setupPriceId) {
    const setup = await gateway.retrievePrice(offer.setupPriceId);
    if (setup.id !== offer.setupPriceId || !setup.active || setup.livemode !== monthly.livemode || setup.type !== "one_time" || setup.currency !== "usd" || !Number.isInteger(setup.unitAmount) || !(Number(setup.unitAmount) > 0)) return null;
    setupAmount = Number(setup.unitAmount);
  }
  return { monthlyAmount: Number(monthly.unitAmount), setupAmount, test: config.mode === "test" };
}
