import assert from "node:assert/strict";
import { buildDomainResearchRequest, DOMAIN_RESEARCH_ACCOUNT_PRICING_URL, parseDomainResearchResponse, probeDomainResearch, type DomainResearchKind, type DomainResearchOptions } from "../src/lib/audit/probes/domain-research";

// Entirely SYNTHETIC offline fixtures. Never makes a real provider call.
const input = { target: "example.test" };
const credentials = { authBase64: Buffer.from("offline-user:offline-secret").toString("base64") };
const quote = {
  ranked_keywords: { upperCostMicros: 14400, pricingUrl: DOMAIN_RESEARCH_ACCOUNT_PRICING_URL, verifiedAt: new Date().toISOString(), source: "account_user_data" as const },
  competitors_domain: { upperCostMicros: 12360, pricingUrl: DOMAIN_RESEARCH_ACCOUNT_PRICING_URL, verifiedAt: new Date().toISOString(), source: "account_user_data" as const },
};
const keyword = { keyword_data: { keyword: "Exact & keyword + query", keyword_info: { search_volume: 0, last_updated_time: "2026-09-01 00:00:00 +00:00" }, serp_info: { last_updated_time: "2026-09-15 00:00:00 +00:00" } }, ranked_serp_element: { serp_item: { type: "organic", rank_group: 3, rank_absolute: 6, url: "https://example.test/page?q=exact", etv: 0 } } };
function fixture(kind: DomainResearchKind, change?: (r: Record<string, unknown>) => void) {
  const r: Record<string, unknown> = { target: input.target, se_type: "google", location_code: 2840, language_code: "en", total_count: 1, items_count: 1, metrics: { organic: { count: 1, etv: 0 } }, items: kind === "ranked_keywords" ? [structuredClone(keyword)] : [{ domain: "competitor.test", intersections: 8, avg_position: 4.5 }] };
  change?.(r);
  return JSON.stringify({ status_code: 20000, tasks_count: 1, tasks_error: 0, cost: 0.01212, tasks: [{ id: "offline-task", status_code: 20000, cost: 0.01212, data: { secret: "not public" }, result: [r] }] });
}
async function main() {
  const ranked = parseDomainResearchResponse(input, "ranked_keywords", fixture("ranked_keywords"));
  assert.equal(ranked.state, "observed"); assert.equal(ranked.keywords[0].keyword, keyword.keyword_data.keyword);
  assert.equal(ranked.keywords[0].url, keyword.ranked_serp_element.serp_item.url);
  assert.equal(ranked.keywords[0].monthlySearchVolumeEstimate, 0); assert.equal(ranked.estimatedMonthlyTraffic, 0);
  assert.equal(ranked.keywords[0].serpUpdatedAt, keyword.keyword_data.serp_info.last_updated_time);
  assert.equal(ranked.keywords[0].rankGroup, 3); assert.equal(ranked.keywords[0].rankAbsolute, 6);
  assert.equal(parseDomainResearchResponse(input, "competitors_domain", fixture("competitors_domain")).competitors[0].intersectingKeywords, 8);
  assert.ok(!JSON.stringify(ranked).includes("not public"));
  const noData = fixture("ranked_keywords", r => { r.total_count = 0; r.items_count = 0; r.items = null; r.metrics = null; r.location_code = null; r.language_code = null; });
  const nullable = parseDomainResearchResponse(input, "ranked_keywords", fixture("ranked_keywords", r=>{r.total_count=null;r.items_count=0;r.items=null;r.metrics=null;}));
  assert.equal(nullable.state,"no_data"); assert.equal(nullable.totalDatabaseItems,null);
  assert.equal(parseDomainResearchResponse(input,"ranked_keywords",fixture("ranked_keywords",r=>{r.total_count=null;})).state,"unavailable");
  const empty = parseDomainResearchResponse(input, "ranked_keywords", noData);
  assert.equal(empty.state, "no_data"); assert.equal(empty.estimatedMonthlyTraffic, null);
  assert.equal(parseDomainResearchResponse(input, "ranked_keywords", fixture("ranked_keywords", r => { r.location_code = 2826; })).error, "dimensions_mismatch");
  assert.equal(parseDomainResearchResponse(input, "competitors_domain", fixture("competitors_domain", r => { r.items = [{ domain: "guess.test", intersections: 0 }]; })).error, "invalid_overlap_row");
  assert.equal(parseDomainResearchResponse(input, "ranked_keywords", "not-json").state, "unavailable");
  assert.equal(parseDomainResearchResponse(input, "ranked_keywords", fixture("ranked_keywords", r => { r.items = []; })).state, "unavailable");
  assert.equal(parseDomainResearchResponse(input, "ranked_keywords", fixture("ranked_keywords", r => { r.items = [{ ...keyword, ranked_serp_element: { serp_item: { ...keyword.ranked_serp_element.serp_item, url: "https://example.test.evil.test/" } } }]; })).error, "invalid_keyword_row");
  const a = buildDomainResearchRequest(input, "ranked_keywords"); const b = buildDomainResearchRequest(input, "competitors_domain");
  assert.equal(a.requestKey, buildDomainResearchRequest(input, "ranked_keywords").requestKey); assert.notEqual(a.requestKey, b.requestKey);
  assert.equal(a.maxCostMicros + b.maxCostMicros, 26760);
  let sends = 0; const reserved: string[] = [];
  const options: DomainResearchOptions = { credentials, quote, authorize: async r => { reserved.push(r.kind); assert.equal(r.maxCostMicros, r.upperCostMicros); return true; }, fetcher: async (url, init) => {
    const kind: DomainResearchKind = String(url).includes("ranked_keywords") ? "ranked_keywords" : "competitors_domain";
    assert.equal(reserved[sends], kind); sends++;
    const body = JSON.parse(String(init?.body)); assert.equal(body.length, 1); assert.equal(body[0].include_clickstream_data, false);
    assert.deepEqual(body[0].item_types, ["organic"]); assert.equal(body[0].limit, kind === "ranked_keywords" ? 20 : 3);
    assert.equal(init?.redirect, "error"); return new Response(fixture(kind));
  } };
  for (const bad of [{ authorize: undefined }, { quote: undefined }, { authorize: async () => false }, { authorize: async () => { throw Error("private"); } }, { quote: { ...quote, ranked_keywords: { ...quote.ranked_keywords, upperCostMicros: 1 } } }, { quote: { ...quote, ranked_keywords: { ...quote.ranked_keywords, verifiedAt: "2020-01-01" } } }]) {
    assert.equal((await probeDomainResearch(input, { ...options, ...bad })).rankedKeywords.state, "not_authorized");
  }
  assert.equal(sends, 0);
  const success = await probeDomainResearch(input, options); assert.equal(sends, 2); assert.equal(success.relatedCompetitors.state, "observed");
  assert.equal(success.rankedKeywords.receipt?.pricing?.source, "account_user_data"); assert.equal(success.databaseUpdatedAt, null);
  assert.match(success.methodology, /never actual/);
  const accountQuotes = { source: DOMAIN_RESEARCH_ACCOUNT_PRICING_URL, verifiedAt: quote.ranked_keywords.verifiedAt, ranked_keywords: { upperCostMicros: 14400, verifiedAt: quote.ranked_keywords.verifiedAt, limit: 20 as const }, competitors_domain: { upperCostMicros: 12360, verifiedAt: quote.competitors_domain.verifiedAt, limit: 3 as const } } as const;
  const accountResult = await probeDomainResearch(input, { ...options, quote: accountQuotes, authorize: async () => true, fetcher: async url => new Response(fixture(String(url).includes("ranked_keywords") ? "ranked_keywords" : "competitors_domain")) });
  assert.equal(accountResult.relatedCompetitors.state, "observed");
  assert.equal(accountResult.relatedCompetitors.receipt?.pricing?.source, "account_user_data");
  let failSends = 0;
  const failureOptions = { ...options, authorize: async () => true };
  const failure = await probeDomainResearch(input, { ...failureOptions, fetcher: async () => { failSends++; throw Error("offline-secret"); } });
  assert.equal(failSends, 1); assert.ok(!JSON.stringify(failure).includes("offline-secret")); assert.ok(failure.rankedKeywords.receipt);
  const secondDenied = await probeDomainResearch(input, { ...failureOptions, authorize: async r => r.kind === "ranked_keywords", fetcher: async () => new Response(fixture("ranked_keywords")) });
  assert.equal(secondDenied.rankedKeywords.state, "observed"); assert.equal(secondDenied.relatedCompetitors.state, "not_authorized");
  for (const [raw, status, error] of [["bad JSON private account", 403, "http_error"], [fixture("ranked_keywords").replaceAll('"cost":0.01212', '"cost":1'), 200, "cost_reconciliation_required"], ["x".repeat(1048577), 200, "body_limit"]] as const) {
    const result = await probeDomainResearch(input, { ...failureOptions, fetcher: async () => new Response(raw, { status }) });
    assert.equal(result.rankedKeywords.error, error); assert.ok(!JSON.stringify(result).includes("private account"));
  }
  let noDataSends = 0;
  const noCoverage = await probeDomainResearch(input, { ...failureOptions, fetcher: async () => { noDataSends++; return new Response(noData); } });
  assert.equal(noCoverage.rankedKeywords.state, "no_data"); assert.equal(noDataSends, 2);
  let cancelled = false;
  const bodyStall = await probeDomainResearch(input, { ...failureOptions, timeoutMs: 20, fetcher: async () => new Response(new ReadableStream({ cancel() { cancelled = true; } })) });
  assert.equal(bodyStall.rankedKeywords.error, "deadline_reservation_retained"); assert.ok(cancelled);
  const headerStall = await probeDomainResearch(input, { ...failureOptions, timeoutMs: 20, fetcher: async () => new Promise(() => {}) });
  assert.equal(headerStall.rankedKeywords.error, "deadline_reservation_retained");
  let lateSends = 0;
  const slowAuth = await probeDomainResearch(input, { ...failureOptions, timeoutMs: 5, authorize: async () => { await new Promise(resolve => setTimeout(resolve, 30)); return true; }, fetcher: async () => { lateSends++; return new Response(noData); } });
  await new Promise(resolve => setTimeout(resolve, 50)); assert.equal(lateSends, 0); assert.equal(slowAuth.rankedKeywords.error, "deadline_reservation_retained");
  const redacted = await probeDomainResearch(input, { ...failureOptions, fetcher: async () => new Response(fixture("ranked_keywords").replace("Exact & keyword + query", "offline-secret")) });
  assert.ok(!JSON.stringify(redacted).includes("offline-secret"));
  console.log("PASS offline synthetic Labs parsers; exact keyword/rank/URL/zero vs unknown; empirical overlaps; fixed payloads/quotes; 2-send cap; per-request authorization; receipts/redaction; no-data short circuit; HTTP/cost/body failures; header/body/authorization deadlines; no retries or late sends. No paid calls.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
