import { createHash } from "node:crypto";

/** Official docs reviewed 2026-09-21. Labs Live means synchronous database lookup,
 * NOT a freshly collected SERP. No private GSC/analytics data is used.
 * https://docs.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live/
 * https://docs.dataforseo.com/v3/dataforseo_labs/google/competitors_domain/live/
 * Pricing: ALL OTHER ENDPOINTS $0.012/task + $0.00012/returned item.
 * Explicit clickstream=false avoids the documented 2x multiplier.
 * 20 keywords <= $0.01440; 3 domains <= $0.01236; combined <= $0.02676.
 * Ranked Keywords returns the target's SERP element, not competitor SERPs; only
 * competitors_domain supplies empirical overlap. No inferred competitors.
 */
export const DOMAIN_RESEARCH_PRICING_URL = "https://dataforseo.com/pricing/dataforseo-labs/dataforseo-google-api";
export const DOMAIN_RESEARCH_LIMITS = Object.freeze({ ranked_keywords: 20, competitors_domain: 3 });
export const DOMAIN_RESEARCH_COST_MICROS = Object.freeze({ ranked_keywords: 14400, competitors_domain: 12360 });
export type DomainResearchKind = keyof typeof DOMAIN_RESEARCH_LIMITS;
export interface DomainResearchInput {
  /** Exact ASCII domain without scheme, www., path or whitespace. */
  target: string;
  /** Deliberately bounded to US/English national Labs database, not ZIP rankings. */
  locationCode?: 2840;
  languageCode?: "en";
}
export interface DomainResearchQuote {
  pricingUrl: string;
  verifiedAt: string;
  rankedKeywordsMaxCostMicros: number;
  competitorsMaxCostMicros: number;
}
export interface DomainResearchReservation {
  kind: DomainResearchKind; requestKey: string; endpoint: string; requestBody: string;
  maxCostMicros: number; upperCostMicros: number;
}
export interface DomainResearchKindQuote {
  upperCostMicros: number;
  pricingUrl: string;
  verifiedAt: string;
  source?: "account_user_data" | "official_public_pricing";
}
export const DOMAIN_RESEARCH_ACCOUNT_PRICING_URL = "https://api.dataforseo.com/v3/appendix/user_data";
export interface DomainResearchAccountQuotes {
  source: "https://api.dataforseo.com/v3/appendix/user_data";
  verifiedAt: string;
  ranked_keywords: { upperCostMicros: number; verifiedAt: string; limit: 20 };
  competitors_domain: { upperCostMicros: number; verifiedAt: string; limit: 3 };
}
export interface DomainResearchOptions {
  /** Durable SQL MUST atomically reserve per session + requestKey before true.
   * Never release on errors/timeouts; a timeout during authorization may reserve
   * without sending. No retry/refund/reconciliation is performed here. */
  authorize?: (request: Readonly<DomainResearchReservation>) => Promise<boolean>;
  quote?: DomainResearchQuote | DomainResearchAccountQuotes | Record<DomainResearchKind, DomainResearchKindQuote>;
  credentials?: { authBase64: string };
  fetcher?: typeof fetch;
  /** Tests can shorten, never extend the 40s overall authorization+body deadline. */
  timeoutMs?: number;
}
export type ResearchState = "observed" | "no_data" | "unavailable" | "not_authorized" | "not_configured";
export interface RankedKeyword {
  keyword: string; rankGroup: number; rankAbsolute: number | null; url: string;
  monthlySearchVolumeEstimate: number | null; estimatedMonthlyTraffic: number | null;
  keywordDataUpdatedAt: string | null; serpUpdatedAt: string | null;
}
export interface RelatedCompetitor {
  domain: string; intersectingKeywords: number; averagePositionOnIntersectingKeywords: number | null;
}
export interface DomainResearchReceipt {
  requestKey: string; kind: DomainResearchKind; endpoint: string; requestBody: string;
  maxCostMicros: number; fetchedAt: string; httpStatus: number | null;
  pricing?: DomainResearchKindQuote;
  cost: number | null; taskCost: number | null; taskId: string | null;
  rawSha256: string | null; bytes: number; statusCode: number | null; taskStatusCode: number | null;
}
export interface DomainResearchLane {
  state: ResearchState; error?: string; totalDatabaseItems: number | null;
  keywords: RankedKeyword[]; competitors: RelatedCompetitor[];
  organicKeywordCount: number | null; estimatedMonthlyTraffic: number | null;
  receipt?: DomainResearchReceipt;
  /** Sanitized allowlist projection, NOT a complete raw provider response. */
  raw?: { total_count: number | null; keywords: RankedKeyword[]; competitors: RelatedCompetitor[] };
}
export interface DomainResearchEvidence {
  source: "dataforseo"; product: "google_labs_domain_research"; target: string;
  locationCode: 2840; locationName: "United States"; languageCode: "en";
  collectedAt: string; databaseUpdatedAt: null; methodology: string;
  rankedKeywords: DomainResearchLane; relatedCompetitors: DomainResearchLane;
}
const METHODOLOGY = "Public third-party Google Labs US/English national database; updated weekly per vendor, not a live SERP or ZIP-local measurement. Database-wide update timestamp is unknown (Status endpoint not requested); keyword/SERP update times are retained per row. Organic-only, up to 20 current ranking keywords sorted by organic rank and 3 domains sorted by shared-keyword organic count, top-100 overlap, large domains excluded. Overlap is search competition, not proof of a business competitor. Search volume and CTR-based ETV are estimates, never actual visits, clicks or leads. No-data means no usable database coverage, not zero traffic or zero visibility.";
const rec = (v: unknown): Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const num = (v: unknown): number | null => typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
const integer = (v: unknown): number | null => Number.isSafeInteger(v) && (v as number) >= 0 ? v as number : null;
const str = (v: unknown, max: number): string | null => typeof v === "string" && v.length > 0 && v.length <= max && !/[\u0000-\u001f]/.test(v) ? v : null;
const stamp = (v: unknown): string | null => str(v, 64) && Number.isFinite(Date.parse(v as string)) ? v as string : null;
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
const blank = (state: ResearchState = "unavailable", error?: string): DomainResearchLane => ({ state, error, totalDatabaseItems: null, keywords: [], competitors: [], organicKeywordCount: null, estimatedMonthlyTraffic: null });
function domain(v: unknown): v is string {
  return typeof v === "string" && v.length <= 253 && !v.startsWith("www.") && /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(v);
}
function exactPublicUrl(v: unknown, target: string): string | null {
  const s = str(v, 4096); if (!s) return null;
  try {
    const u = new URL(s);
    if (!/^https?:$/.test(u.protocol) || u.username || u.password || !(u.hostname === target || u.hostname.endsWith(`.${target}`))) return null;
    // Keep the exact ranked URL, including ordinary query params; omit rows with
    // credential-bearing URLs rather than silently misrepresenting their URL.
    if ([...u.searchParams.keys()].some(k => /token|password|secret|auth|api.?key|signature/i.test(k))) return null;
    return s;
  } catch { return null; }
}
export function buildDomainResearchRequest(input: DomainResearchInput, kind: DomainResearchKind): Readonly<DomainResearchReservation> {
  if (!domain(input.target) || (input.locationCode !== undefined && input.locationCode !== 2840) || (input.languageCode !== undefined && input.languageCode !== "en")) throw new Error("Invalid national domain research input");
  const endpoint = `https://api.dataforseo.com/v3/dataforseo_labs/google/${kind}/live`;
  const common = { target: input.target, location_code: 2840, language_code: "en", item_types: ["organic"], include_clickstream_data: false, ignore_synonyms: false, limit: DOMAIN_RESEARCH_LIMITS[kind], offset: 0 };
  const requestBody = JSON.stringify([{ ...common, ...(kind === "ranked_keywords" ? { historical_serp_mode: "live", load_rank_absolute: false, order_by: ["ranked_serp_element.serp_item.rank_group,asc"] } : { max_rank_group: 100, exclude_top_domains: true, exclude_domains: [input.target], order_by: ["metrics.organic.count,desc"] }) }]);
  return Object.freeze({ kind, endpoint, requestBody, requestKey: `domain-research-v1:${kind}:${hash(`${endpoint}\n${requestBody}`)}`, maxCostMicros: DOMAIN_RESEARCH_COST_MICROS[kind], upperCostMicros: DOMAIN_RESEARCH_COST_MICROS[kind] });
}
/** Offline parser. No provider errors/task.data/check_url/headers are reflected. */
export function parseDomainResearchResponse(input: DomainResearchInput, kind: DomainResearchKind, raw: string): DomainResearchLane {
  const request = buildDomainResearchRequest(input, kind);
  if (Buffer.byteLength(raw) > 1024 * 1024) return blank("unavailable", "body_limit");
  let e: Record<string, unknown>;
  try { e = rec(JSON.parse(raw)); } catch { return blank("unavailable", "invalid_json"); }
  const tasks = Array.isArray(e.tasks) ? e.tasks : []; const t = rec(tasks[0]);
  const receipt: DomainResearchReceipt = { ...request, fetchedAt: new Date().toISOString(), httpStatus: null, cost: num(e.cost), taskCost: num(t.cost), taskId: typeof t.id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(t.id) ? t.id : null, rawSha256: hash(raw), bytes: Buffer.byteLength(raw), statusCode: integer(e.status_code), taskStatusCode: integer(t.status_code) };
  const fail = (error: string): DomainResearchLane => ({ ...blank("unavailable", error), receipt });
  if (e.status_code !== 20000 || e.tasks_error !== 0 || e.tasks_count !== 1 || tasks.length !== 1 || t.status_code !== 20000) return fail("provider_status");
  if (!Array.isArray(t.result) || t.result.length !== 1) return fail("invalid_result");
  const r = rec(t.result[0]); const total = integer(r.total_count);
  const items = Array.isArray(r.items) ? r.items : r.items === null && total === 0 ? [] : null;
  if (!items || total === null || total < items.length || integer(r.items_count) !== items.length || items.length > DOMAIN_RESEARCH_LIMITS[kind]) return fail("invalid_items");
  if (r.target !== input.target || r.se_type !== "google" || (r.location_code !== 2840 && !(total === 0 && r.location_code === null)) || (r.language_code !== "en" && !(total === 0 && r.language_code === null))) return fail("dimensions_mismatch");
  const lane: DomainResearchLane = { ...blank(items.length ? "observed" : "no_data"), totalDatabaseItems: total, receipt };
  if (!items.length && total !== 0) return fail("missing_items");
  if (kind === "ranked_keywords") {
    const organic = rec(rec(r.metrics).organic);
    lane.organicKeywordCount = integer(organic.count); lane.estimatedMonthlyTraffic = num(organic.etv);
    for (const item of items) {
      const row = rec(item); const kd = rec(row.keyword_data); const ki = rec(kd.keyword_info);
      const ranked = rec(row.ranked_serp_element); const si = rec(ranked.serp_item);
      const keyword = str(kd.keyword, 2000); const rankGroup = integer(si.rank_group); const url = exactPublicUrl(si.url, input.target);
      if (!keyword || !rankGroup || !url || si.type !== "organic") return fail("invalid_keyword_row");
      lane.keywords.push({ keyword, rankGroup, rankAbsolute: integer(si.rank_absolute), url, monthlySearchVolumeEstimate: num(ki.search_volume), estimatedMonthlyTraffic: num(si.etv), keywordDataUpdatedAt: stamp(ki.last_updated_time), serpUpdatedAt: stamp(ranked.last_updated_time) ?? stamp(rec(kd.serp_info).last_updated_time) });
    }
  } else {
    for (const item of items) {
      const row = rec(item); const intersections = integer(row.intersections);
      if (!domain(row.domain) || row.domain === input.target || !intersections) return fail("invalid_overlap_row");
      lane.competitors.push({ domain: row.domain, intersectingKeywords: intersections, averagePositionOnIntersectingKeywords: num(row.avg_position) });
    }
  }
  lane.raw = { total_count: total, keywords: lane.keywords, competitors: lane.competitors };
  return lane;
}

/** Two fixed requests maximum. Default is fail-closed, including absent quote. */
export async function probeDomainResearch(input: DomainResearchInput, options: DomainResearchOptions = {}): Promise<DomainResearchEvidence> {
  const base: DomainResearchEvidence = { source: "dataforseo", product: "google_labs_domain_research", target: input.target, locationCode: 2840, locationName: "United States", languageCode: "en", collectedAt: new Date().toISOString(), databaseUpdatedAt: null, methodology: METHODOLOGY, rankedKeywords: blank(), relatedCompetitors: blank("unavailable", "not_requested_after_first_lane") };
  const both = (state: ResearchState, error: string) => ({ ...base, rankedKeywords: blank(state, error), relatedCompetitors: blank(state, error) });
  let requests: Readonly<DomainResearchReservation>[];
  try { requests = [buildDomainResearchRequest(input, "ranked_keywords"), buildDomainResearchRequest(input, "competitors_domain")]; } catch { return both("unavailable", "invalid_input"); }
  const q = options.quote;
  const quotes: Record<DomainResearchKind, DomainResearchKindQuote> | undefined = q && "source" in q ? (q.source === DOMAIN_RESEARCH_ACCOUNT_PRICING_URL && q.ranked_keywords.limit === 20 && q.competitors_domain.limit === 3 ? {
    ranked_keywords: { ...q.ranked_keywords, pricingUrl: q.source, source: "account_user_data" },
    competitors_domain: { ...q.competitors_domain, pricingUrl: q.source, source: "account_user_data" },
  } : undefined) : q && "ranked_keywords" in q ? { ranked_keywords: { ...q.ranked_keywords }, competitors_domain: { ...q.competitors_domain } } : q ? {
    ranked_keywords: { pricingUrl: q.pricingUrl, verifiedAt: q.verifiedAt, upperCostMicros: q.rankedKeywordsMaxCostMicros, source: "official_public_pricing" as const },
    competitors_domain: { pricingUrl: q.pricingUrl, verifiedAt: q.verifiedAt, upperCostMicros: q.competitorsMaxCostMicros, source: "official_public_pricing" as const },
  } : undefined;
  if (!options.authorize || !quotes || requests.some(r => {
    const quote = quotes[r.kind]; const age = Date.now() - Date.parse(quote.verifiedAt);
    return quote.upperCostMicros !== r.maxCostMicros || ![DOMAIN_RESEARCH_PRICING_URL, DOMAIN_RESEARCH_ACCOUNT_PRICING_URL].includes(quote.pricingUrl) || (quote.pricingUrl === DOMAIN_RESEARCH_ACCOUNT_PRICING_URL && quote.source !== "account_user_data") || !Number.isFinite(age) || age < 0 || age > 86400000;
  })) return both("not_authorized", "fresh_fixed_quote_and_budget_required");
  const auth = options.credentials?.authBase64 ?? process.env.DATAFORSEO_AUTH_BASE64 ?? "";
  const decoded = Buffer.from(auth, "base64").toString("utf8"); const colon = decoded.indexOf(":");
  if (typeof window !== "undefined" || !/^[A-Za-z0-9+/]+=*$/.test(auth) || colon <= 0 || colon === decoded.length - 1) return both("not_configured", "server_credentials_required");
  const timeoutMs = Math.min(40000, options.timeoutMs ?? 40000);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return both("not_authorized", "invalid_deadline");
  const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error("deadline")); }, timeoutMs); });
  const secrets = [auth, decoded, decoded.slice(0, colon), decoded.slice(colon + 1)];
  const sanitize = (v: unknown): unknown => typeof v === "string" ? secrets.reduce((s, secret) => s.split(secret).join("[REDACTED]"), v) : Array.isArray(v) ? v.map(sanitize) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, value]) => [k, sanitize(value)])) : v;
  let active: "rankedKeywords" | "relatedCompetitors" = "rankedKeywords";
  const run = async () => {
    for (const request of requests) {
      active = request.kind === "ranked_keywords" ? "rankedKeywords" : "relatedCompetitors";
      controller.signal.throwIfAborted();
      let authorized = false;
      try { authorized = await options.authorize!(request) === true; } catch { /* Fail closed; never reflect callback errors. */ }
      controller.signal.throwIfAborted();
      if (!authorized) { base[active] = blank("not_authorized", "budget_denied"); break; }
      base[active].receipt = { ...request, pricing: quotes[request.kind], fetchedAt: new Date().toISOString(), httpStatus: null, cost: null, taskCost: null, taskId: null, rawSha256: null, bytes: 0, statusCode: null, taskStatusCode: null };
      const response = await (options.fetcher ?? fetch)(request.endpoint, { method: "POST", body: request.requestBody, redirect: "error", cache: "no-store", signal: controller.signal, headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" } });
      controller.signal.throwIfAborted();
      const reader = response.body?.getReader(); if (!reader) throw new Error("body_missing");
      const cancel = () => { void reader.cancel().catch(() => undefined); };
      controller.signal.addEventListener("abort", cancel, { once: true });
      const chunks: Uint8Array[] = []; let bytes = 0;
      try {
        while (true) {
          controller.signal.throwIfAborted(); const chunk = await reader.read(); controller.signal.throwIfAborted();
          if (chunk.done) break;
          bytes += chunk.value.byteLength;
          if (bytes > 1024 * 1024) throw new Error("body_limit");
          chunks.push(chunk.value);
        }
      } finally { controller.signal.removeEventListener("abort", cancel); cancel(); }
      const raw = Buffer.concat(chunks).toString("utf8");
      let lane = parseDomainResearchResponse(input, request.kind, raw);
      // Always retain a hash receipt even for invalid JSON/non-2xx bodies.
      lane.receipt ??= { ...request, fetchedAt: new Date().toISOString(), httpStatus: response.status, cost: null, taskCost: null, taskId: null, rawSha256: hash(raw), bytes, statusCode: null, taskStatusCode: null };
      lane.receipt.httpStatus = response.status;
      lane.receipt.pricing = quotes[request.kind];
      const receipt = lane.receipt;
      if (!response.ok) lane = { ...blank("unavailable", "http_error"), receipt };
      else if (receipt.cost === null || receipt.taskCost === null || Math.max(receipt.cost, receipt.taskCost) * 1e6 > request.maxCostMicros + 0.000001) lane = { ...blank("unavailable", "cost_reconciliation_required"), receipt };
      base[active] = sanitize(lane) as DomainResearchLane;
      // Do not spend again following an uncertain first result or absent coverage.
      if (lane.state !== "observed") break;
    }
  };
  try { await Promise.race([run(), deadline]); }
  catch (e) { base[active] = { ...blank("unavailable", controller.signal.aborted ? "deadline_reservation_retained" : e instanceof Error && ["body_limit", "body_missing"].includes(e.message) ? e.message : "transport_failure_reservation_retained"), receipt: base[active].receipt }; }
  finally { if (timer) clearTimeout(timer); }
  // Clone prevents late authorization/fetch completion mutating returned evidence.
  return structuredClone(base);
}
