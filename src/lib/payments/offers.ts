import { createHmac, timingSafeEqual } from "node:crypto";
import type { StripeConfig } from "./config";

export type RecurringOffer = { monthlyPriceId: string; setupPriceId?: string };
/** Keys are private unguessable client offer capabilities, never public catalog IDs. */
export function readRecurringOffers(raw?: string): Record<string, RecurringOffer> {
  if (!raw) return {};
  const value = JSON.parse(raw);
  if (!value || Array.isArray(value) || typeof value !== "object" || Object.keys(value).length > 50) throw new Error("offers_invalid");
  for (const [key, offer] of Object.entries(value) as [string, RecurringOffer][]) {
    if (!/^[A-Za-z0-9_-]{32,128}$/.test(key) || !offer || Object.keys(offer).some(k => !["monthlyPriceId", "setupPriceId"].includes(k)) || !/^price_[A-Za-z0-9]+$/.test(offer.monthlyPriceId) || (offer.setupPriceId !== undefined && !/^price_[A-Za-z0-9]+$/.test(offer.setupPriceId)) || offer.monthlyPriceId === offer.setupPriceId) throw new Error("offers_invalid");
  }
  return value;
}
export function bundleSignature(config: Pick<StripeConfig, "mode" | "expectedAccountId" | "capabilitySecret">, monthly: string, setup = "") {
  return createHmac("sha256", config.capabilitySecret).update(JSON.stringify(["recurring-v1", config.expectedAccountId, config.mode, monthly, setup])).digest("hex");
}
export function recognizedBundle(config: StripeConfig, meta: Record<string, string>, prices: string[]) {
  const monthly = meta.monthly_price_id ?? "", setup = meta.setup_price_id ?? "";
  const expected = [monthly, ...(setup ? [setup] : [])].sort();
  const signature = bundleSignature(config, monthly, setup);
  return meta.billing === "recurring-v1" && /^price_[A-Za-z0-9]+$/.test(monthly) && prices.length === expected.length && [...prices].sort().every((p, i) => p === expected[i]) && /^[a-f0-9]{64}$/.test(meta.bundle_signature ?? "") && timingSafeEqual(Buffer.from(signature), Buffer.from(meta.bundle_signature));
}
