import { createHash } from "node:crypto";
import { z } from "zod";

export const CHATGPT_ENDPOINT = "https://api.dataforseo.com/v3/ai_optimization/chat_gpt/llm_scraper/live/advanced";
export const CHATGPT_PRICING_URL = "https://dataforseo.com/pricing/ai-optimization/llm-scraper";
export interface ChatGPTInput {
  businessName: string;
  websiteUrl: string;
  servicePhrase: string;
  query?: string;
  zipCode: string;
  /** Product-catalog-verified location; US is the retained successful sample. */
  locationName?: string;
  /** Stage-3 provider location (propagated with query/cache). Defaults from locationName. */
  providerLocation?: string;
  /** When national, ZIP is not required for query/location validation. */
  geographyMode?: "local" | "regional" | "national" | "mixed";
}
export interface ChatGPTPriceQuote {
  upperCostMicros: number;
  pricingUrl: string;
  verifiedAt: string;
}
export interface ChatGPTRequest {
  url: string; method: "POST"; body: string; timeoutMs: number; maxRetries: 0; maxBytes: number;
}
export interface ChatGPTOptions {
  /** Must atomically reserve the exact request and quote in durable storage before returning true.
   * Retain the reservation on all uncertain sends; this probe never retries or releases it. */
  authorize?: (reservation: Readonly<{ query: string; requestBody: string; upperCostMicros: number }>) => Promise<boolean>;
  quote?: ChatGPTPriceQuote;
  /** Server-only. Defaults to DATAFORSEO_AUTH_BASE64, then DATAFORSEO_LOGIN/PASSWORD. */
  credentials?: { authBase64: string } | { login: string; password: string };
  fetcher?: typeof fetch;
  timeoutMs?: number;
}
export interface ChatGPTEvidence {
  state: "observed" | "unavailable" | "not_configured" | "not_authorized";
  query: string; location: string; observedAt: string;
  source: "dataforseo"; product: "consumer_chatgpt_scraper"; mode: "search" | "default";
  providerObservedAt?: string; locationObserved?: string; modelObserved?: string | null;
  answer?: string;
  citations: { title: string; url: string; hostname: string; relation: "cited_or_relied_on" }[];
  mentioned: boolean | null; cited: boolean | null; error?: string;
  receipt?: { cost: number | null; taskCost: number | null; taskId: string | null; rawSha256: string };
  /** Allowlisted evidence projection only, never provider task.data, check_url, or account bodies. */
  raw?: { status_code: number; task_status_code: number; markdown: string; sources: { title: string; url: string }[] };
}

// Adapted narrowly from production/providers.ts (successful retained consumer scraper).
// A null model is valid. Sources, NOT search_results, are cited/relied-on references.
const resultSchema = z.object({
  datetime: z.string(), location_code: z.number(), model: z.string().nullable().optional(),
  items: z.array(z.record(z.unknown())).nullable(), markdown: z.string().optional(),
  sources: z.array(z.record(z.unknown())).nullable().optional(),
});
const envelopeSchema = z.object({
  status_code: z.number(), tasks_error: z.number(), tasks_count: z.number(),
  tasks: z.array(z.object({ id: z.string(), status_code: z.number(), result: z.array(resultSchema).nullable() })),
});
const text = (v: unknown): string => typeof v === "string" ? v : "";
const record = (v: unknown): Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const money = (v: unknown): number | null => typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
function hostname(value: string): string | null {
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch { return null; }
}
function brandPattern(name: string, flags = "iu"): RegExp | null {
  const escaped = name.trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
  return escaped ? new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, flags) : null;
}
function makeBase(input: ChatGPTInput): { base: ChatGPTEvidence; service: string } {
  const pattern = brandPattern(input.businessName, "giu");
  let service = (pattern ? input.servicePhrase.replace(pattern, "") : input.servicePhrase).trim();
  // Do not insert the audited website into the buyer query either.
  const domain = hostname(input.websiteUrl);
  if (domain) service = service.replace(new RegExp(`(?:https?:\\/\\/)?(?:www\\.)?${domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^\\s]*`, "giu"), "").trim();
  const national = input.geographyMode === "national";
  const location = (input.providerLocation ?? input.locationName)?.trim() || (national ? "United States" : "United States");
  const defaultQuery = national
    ? `Which providers offer ${service || "business services"} in the United States, and why should I consider them?`
    : `Which providers offer ${service || "business services"} serving ZIP code ${input.zipCode.trim()} in the United States, and why should I consider them?`;
  return { service, base: {
    state: "unavailable", query: input.query ?? defaultQuery,
    location, observedAt: new Date().toISOString(),
    source: "dataforseo", product: "consumer_chatgpt_scraper", mode: "search", citations: [], mentioned: null, cited: null,
  } };
}

/** Offline parser for the actual DataForSEO response envelope, not a model completion. */
export function parseChatGPTResponse(input: ChatGPTInput, raw: string, base = makeBase(input).base): ChatGPTEvidence {
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return { ...base, error: "ChatGPT provider returned invalid JSON" }; }
  const envelope = record(data); const task = record(Array.isArray(envelope.tasks) ? envelope.tasks[0] : null);
  const taskId = /^[a-zA-Z0-9_-]{1,128}$/.test(text(task.id)) ? text(task.id) : null;
  const evidence = { ...base, receipt: { cost: money(envelope.cost), taskCost: money(task.cost), taskId, rawSha256: createHash("sha256").update(raw).digest("hex") } };
  const parsed = envelopeSchema.safeParse(data);
  if (!parsed.success || parsed.data.status_code !== 20000 || parsed.data.tasks_error !== 0 || parsed.data.tasks_count !== 1 || parsed.data.tasks.length !== 1) return { ...evidence, error: "ChatGPT provider returned an unsuccessful or invalid envelope" };
  const t = parsed.data.tasks[0];
  if (t.status_code !== 20000 || t.result?.length !== 1) return { ...evidence, error: "ChatGPT provider task did not return a successful sample" };
  const r = t.result[0];
  const observed = { ...evidence, providerObservedAt: r.datetime, locationObserved: `vendor-location-code:${r.location_code}`, modelObserved: r.model ?? null };
  if (!Array.isArray(r.items)) return { ...observed, error: "ChatGPT provider returned no usable answer" };
  const answer = (r.markdown || r.items.filter(i => i.type === "chat_gpt_text").map(i => text(i.markdown) || text(i.text)).join("\n")).trim();
  if (!answer || answer.length > 60000 || (r.sources?.length ?? 0) > 100) return { ...observed, error: "ChatGPT answer missing or exceeds evidence bounds" };
  const citations: ChatGPTEvidence["citations"] = [];
  for (const ref of r.sources ?? []) {
    const url = text(ref.url); const host = hostname(url);
    if (!/^https?:\/\//i.test(url) || !host || url.length > 4096 || citations.some(c => c.url === url)) continue;
    // Strip tracking/auth query values from public evidence while retaining exact hostname.
    const safeUrl = new URL(url); safeUrl.search = ""; safeUrl.hash = "";
    citations.push({ title: text(ref.title).slice(0, 300), url: safeUrl.toString(), hostname: host, relation: "cited_or_relied_on" });
  }
  const name = brandPattern(input.businessName);
  const visible = answer.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/https?:\/\/\S+/gi, "");
  const target = hostname(input.websiteUrl);
  return { ...observed, state: "observed", answer, citations, mentioned: name ? name.test(visible) : null,
    cited: target && Array.isArray(r.sources) ? citations.some(c => c.hostname === target) : null,
    raw: { status_code: parsed.data.status_code, task_status_code: t.status_code, markdown: answer, sources: citations.map(c => ({ title: c.title, url: c.url })) },
  };
}

/** One bounded real consumer-scraper request. No retries, continuations or model-API fallback. */
export async function probeChatGPT(input: ChatGPTInput, options: ChatGPTOptions = {}): Promise<ChatGPTEvidence> {
  const { base, service } = makeBase(input);
  if (typeof window !== "undefined") return { ...base, state: "not_configured", error: "ChatGPT collection requires server credentials" };
  const credentials = options.credentials ?? (process.env.DATAFORSEO_AUTH_BASE64 ? { authBase64: process.env.DATAFORSEO_AUTH_BASE64 } : { login: process.env.DATAFORSEO_LOGIN ?? "", password: process.env.DATAFORSEO_PASSWORD ?? "" });
  const auth = "authBase64" in credentials ? credentials.authBase64 : credentials.login && credentials.password ? Buffer.from(`${credentials.login}:${credentials.password}`).toString("base64") : "";
  if (!auth || !/^[A-Za-z0-9+/]+=*$/.test(auth)) return { ...base, state: "not_configured", error: "ChatGPT consumer collection is not configured" };
  const decoded = Buffer.from(auth, "base64").toString("utf8");
  const colon = decoded.indexOf(":");
  if (colon <= 0 || colon === decoded.length - 1) return { ...base, state: "not_configured", error: "ChatGPT consumer credentials are invalid" };
  const national = input.geographyMode === "national";
  const zipOk = national || /^\d{5}(?:-\d{4})?$/.test(input.zipCode.trim());
  if (!service || service.length > 200 || !zipOk || base.location.length > 200) return { ...base, error: "An unbranded service phrase and valid US ZIP/location are required" };
  if (national && (/\bZIP\b/i.test(base.query) || (base.location !== "United States" && /^\d{5}/.test(base.location)))) {
    return { ...base, error: "National ChatGPT samples must use United States location without forced ZIP query text" };
  }
  const quote = options.quote ? Object.freeze({ ...options.quote }) : undefined;
  const age = quote ? Date.now() - Date.parse(quote.verifiedAt) : NaN;
  if (!quote || !Number.isSafeInteger(quote.upperCostMicros) || quote.upperCostMicros <= 0 || quote.pricingUrl !== CHATGPT_PRICING_URL || !Number.isFinite(age) || age < 0 || age > 86400000) return { ...base, state: "not_authorized", error: "A fresh verified ChatGPT price quote is required" };
  const timeoutMs = Math.min(95000, Math.max(1, options.timeoutMs ?? 95000));
  if (!Number.isFinite(timeoutMs)) return { ...base, state: "not_authorized", error: "Invalid request deadline" };
  // Same request dimensions/keyword escaping as production/providers.ts.
  const request: ChatGPTRequest = Object.freeze({ url: CHATGPT_ENDPOINT, method: "POST", timeoutMs, maxRetries: 0, maxBytes: 4 * 1024 * 1024,
    body: JSON.stringify([{ keyword: base.query.replace(/%/g, "%25").replace(/\+/g, "%2B"), location_name: base.location, language_code: "en", force_web_search: true }]),
  });
  try { if (!options.authorize || await options.authorize(Object.freeze({ query: base.query, requestBody: request.body, upperCostMicros: quote.upperCostMicros })) !== true) return { ...base, state: "not_authorized", error: "ChatGPT budget reservation denied" }; }
  catch { return { ...base, state: "not_authorized", error: "ChatGPT budget reservation failed" }; }
  const secrets = [auth, decoded, decoded.slice(0, colon), decoded.slice(colon + 1)].filter(Boolean);
  const redact = (s: string) => secrets.reduce((out, secret) => out.split(secret).join("[REDACTED]"), s);
  const sanitize = (value: unknown): unknown => typeof value === "string" ? redact(value) : Array.isArray(value) ? value.map(sanitize) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, v]) => [key, sanitize(v)])) : value;
  const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
  let bodyLimit = false;
  const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error("deadline")); }, timeoutMs); });
  try {
    const capture = async (): Promise<ChatGPTEvidence> => {
      const response = await (options.fetcher ?? fetch)(request.url, { method: request.method, body: request.body, signal: controller.signal, redirect: "error", cache: "no-store", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" } });
      const reader = response.body?.getReader();
      if (!reader) return { ...base, error: "ChatGPT provider body missing" };
      const abort = () => { void reader.cancel().catch(() => undefined); };
      controller.signal.addEventListener("abort", abort, { once: true });
      const chunks: Uint8Array[] = []; let size = 0;
      try {
        while (true) {
          controller.signal.throwIfAborted(); const next = await reader.read(); controller.signal.throwIfAborted();
          if (next.done) break;
          size += next.value.byteLength;
          if (size > request.maxBytes) { bodyLimit = true; throw new Error("body_limit"); }
          chunks.push(next.value);
        }
      } finally { controller.signal.removeEventListener("abort", abort); void reader.cancel().catch(() => undefined); }
      const raw = Buffer.concat(chunks).toString("utf8");
      const parsed = parseChatGPTResponse(input, raw, { ...base, observedAt: new Date().toISOString() });
      // Redact the final projection, never mutate raw JSON before parsing it.
      const safe = sanitize(parsed) as ChatGPTEvidence;
      if (!response.ok) return { ...base, receipt: safe.receipt, error: `ChatGPT provider HTTP ${response.status}` };
      const cost = safe.receipt?.cost; const taskCost = safe.receipt?.taskCost;
      if (cost === null || cost === undefined || taskCost === null || taskCost === undefined || Math.round(Math.max(cost, taskCost) * 1e6) > quote.upperCostMicros) return { ...base, receipt: safe.receipt, error: "ChatGPT cost reconciliation required; reservation retained" };
      return safe;
    };
    return await Promise.race([capture(), deadline]);
  } catch {
    return { ...base, error: bodyLimit ? "ChatGPT response body limit exceeded; reservation retained" : controller.signal.aborted ? "ChatGPT collection timed out; reservation retained" : "ChatGPT collection failed; reservation retained" };
  } finally { if (timer !== undefined) clearTimeout(timer); }
}
