import { CHATGPT_PRICING_URL, type ChatGPTPriceQuote } from "./chatgpt-search";
export interface ProviderPricing {
  verifiedAt: string;
  source: "https://api.dataforseo.com/v3/appendix/user_data";
  chatGPT: ChatGPTPriceQuote;
  ranked_keywords: {upperCostMicros: number; verifiedAt: string; limit: 20};
  competitors_domain: {upperCostMicros: number; verifiedAt: string; limit: 3};
}
type PricePart = { cost_type?: string; cost?: number };
function quote(parts: unknown, limit: number): number {
  if (!Array.isArray(parts) || !parts.length) throw new Error("Missing price");
  let total = 0;
  for (const part of parts as PricePart[]) {
    if (typeof part.cost !== "number" || !Number.isFinite(part.cost) || part.cost < 0) throw new Error("Invalid price");
    if (part.cost_type === "per_request") total += part.cost;
    else if (part.cost_type === "per_result") total += part.cost * limit;
    else throw new Error("Unrecognized pricing dimension");
  }
  return Math.ceil(Number(total.toFixed(9)) * 1e6);
}
export function parseProviderPricing(data: unknown, verifiedAt: string): ProviderPricing {
  // Only selected price fields leave this function. Account identity, balance and
  // account usage are never exposed in a prospect report or application logs.
  const d = data as { status_code?: number; cost?: number; tasks?: {status_code?: number; result?: {price?: Record<string, unknown>}[]}[] };
  const task = d?.tasks?.[0];
  if (d?.status_code !== 20000 || d.cost !== 0 || task?.status_code !== 20000) throw new Error("Price verification failed");
  const prices = task.result?.[0]?.price as {
    ai_optimization?: {llm_scraper?: {live?: {advanced?: {priority_normal?: unknown}}}};
    dataforseo_labs?: Record<string, {live?: {priority_normal?: unknown}}>;
  } | undefined;
  const chat = quote(prices?.ai_optimization?.llm_scraper?.live?.advanced?.priority_normal, 1);
  const ranked = quote(prices?.dataforseo_labs?.ranked_keywords?.live?.priority_normal, 20);
  const competitors = quote(prices?.dataforseo_labs?.competitors_domain?.live?.priority_normal, 3);
  if (chat <= 0 || chat > 4000 || ranked <= 0 || ranked > 14400 || competitors <= 0 || competitors > 12360) throw new Error("Price exceeds reviewed per-request ceilings");
  return { verifiedAt, source: "https://api.dataforseo.com/v3/appendix/user_data",
    chatGPT: {upperCostMicros: chat, verifiedAt, pricingUrl: CHATGPT_PRICING_URL},
    ranked_keywords: {upperCostMicros: ranked, verifiedAt, limit: 20},
    competitors_domain: {upperCostMicros: competitors, verifiedAt, limit: 3},
  };
}
let cache: {at: number; value: ProviderPricing} | undefined;
export async function getProviderPricing(): Promise<ProviderPricing | null> {
  if (typeof window !== "undefined" || !process.env.DATAFORSEO_AUTH_BASE64) return null;
  if (cache && Date.now() - cache.at < 3600000) return cache.value;
  try {
    const response = await fetch("https://api.dataforseo.com/v3/appendix/user_data", {
      headers: {Authorization: `Basic ${process.env.DATAFORSEO_AUTH_BASE64}`},
      signal: AbortSignal.timeout(7000), cache: "no-store", redirect: "error",
    });
    if (!response.ok || !response.body) return null;
    const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let bytes = 0;
    try { while (true) { const next = await reader.read(); if (next.done) break; bytes += next.value.byteLength; if (bytes > 2097152) throw new Error("Price body cap"); chunks.push(next.value); } }
    finally { await reader.cancel().catch(() => undefined); }
    const value = parseProviderPricing(JSON.parse(Buffer.concat(chunks).toString("utf8")), new Date().toISOString());
    cache = {at: Date.now(), value}; return value;
  } catch { return null; }
}
