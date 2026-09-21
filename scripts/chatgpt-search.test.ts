import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { CHATGPT_ENDPOINT, CHATGPT_PRICING_URL, parseChatGPTResponse, probeChatGPT, type ChatGPTOptions } from "../src/lib/audit/probes/chatgpt-search";

// Offline only. A real immutable, retained paid response is replayed locally if present.
// Synthetic variants below test failure/matching boundaries; they are NOT live results.
const retained = process.env.CHATGPT_RETAINED_RESPONSE ?? "/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/website-ops/live-acceptance-national-once/continuation-capture-3.raw.json";
const input = { businessName: "TandemOps", websiteUrl: "https://tandemops.io", servicePhrase: "custom AI employees and workflow automation", zipCode: "27401" };
const credentials = { authBase64: Buffer.from("offline-login:offline-password").toString("base64") };
const quote = { upperCostMicros: 4000, pricingUrl: CHATGPT_PRICING_URL, verifiedAt: new Date().toISOString() };
const synthetic = { status_code: 20000, tasks_error: 0, tasks_count: 1, cost: 0.004, tasks: [{ id: "offline-synthetic", status_code: 20000, cost: 0.004, result: [{ datetime: "2026-09-17 01:38:07 +00:00", location_code: 2840, model: null, markdown: "Explicit offline fixture: TandemOps offers automation.", items: [{ type: "chat_gpt_text", markdown: "Explicit offline fixture" }], sources: [{ title: "Provider", url: "https://www.tandemops.io/?utm_source=chatgpt.com" }], search_results: [{ url: "https://unrelated.test/" }] }] }] };
async function main() {
  let raw = JSON.stringify(synthetic);
  if (fs.existsSync(retained)) {
    raw = fs.readFileSync(retained, "utf8");
    assert.equal(createHash("sha256").update(raw).digest("hex"), "b565a477ca1bf55aa8d0cf74ee5a7699b8b2ba784e82573d86a2895e5c1924a1");
    const real = parseChatGPTResponse(input, raw);
    assert.equal(real.state, "observed"); assert.equal(real.modelObserved, null);
    assert.equal(real.receipt?.cost, 0.004); assert.equal(real.receipt?.taskId, "09170137-2543-0629-0000-e3104cebc87a");
    assert.equal(real.cited, true); assert.equal(real.mentioned, true); assert.ok(real.answer!.length > 1000);
    assert.equal(real.locationObserved, "vendor-location-code:2840");
    console.log("PASS actual retained ChatGPT capture SHA256, null model, answer, source citations and receipt (offline replay)");
  } else console.log("SKIP retained response unavailable; only explicitly synthetic offline cases run");
  let sends = 0; let reservations = 0; let allowed = false;
  const fetcher: typeof fetch = async (url, init) => {
    sends++; assert.ok(allowed, "reservation must precede send");
    assert.equal(url, CHATGPT_ENDPOINT); assert.equal(init?.redirect, "error");
    const [body] = JSON.parse(String(init?.body));
    assert.equal(body.force_web_search, true); assert.equal(body.language_code, "en");
    assert.equal(body.location_name, "United States"); assert.ok(!body.keyword.includes("TandemOps"));
    return new Response(raw);
  };
  const options: ChatGPTOptions = { credentials, quote, fetcher, authorize: async r => {
    reservations++; assert.equal(r.upperCostMicros, 4000); assert.equal(JSON.parse(r.requestBody)[0].keyword, r.query);
    allowed = true; return true;
  } };
  assert.equal((await probeChatGPT(input, { ...options, credentials: { authBase64: "" } })).state, "not_configured");
  assert.equal((await probeChatGPT(input, { ...options, authorize: undefined })).state, "not_authorized");
  assert.equal((await probeChatGPT(input, { ...options, authorize: async () => false })).state, "not_authorized");
  assert.equal((await probeChatGPT(input, { ...options, authorize: async () => { throw Error("private account detail"); } })).state, "not_authorized");
  assert.equal((await probeChatGPT(input, { ...options, quote: undefined })).state, "not_authorized");
  assert.equal((await probeChatGPT(input, { ...options, quote: { ...quote, verifiedAt: "2020-01-01" } })).state, "not_authorized");
  assert.equal(sends, 0); assert.equal(reservations, 0);
  assert.equal((await probeChatGPT(input, options)).state, "observed"); assert.equal(sends, 1); assert.equal(reservations, 1);
  const branded = await probeChatGPT({ ...input, servicePhrase: "TandemOps https://tandemops.io custom automation" }, options);
  assert.ok(!branded.query.includes("TandemOps") && !branded.query.includes("tandemops.io"));
  const variant = (change: (d: typeof synthetic) => void) => { const d = structuredClone(synthetic); change(d); return parseChatGPTResponse(input, JSON.stringify(d)); };
  assert.equal(variant(d => { d.tasks[0].result[0].sources[0].url = "https://tandemops.io.evil.test/"; }).cited, false);
  assert.equal(variant(d => { d.tasks[0].result[0].sources[0].url = "https://sub.tandemops.io/"; }).cited, false);
  assert.equal(variant(d => { d.tasks[0].result[0].sources = []; d.tasks[0].result[0].search_results = [{ url: "https://tandemops.io" }]; }).cited, false);
  assert.equal(variant(d => { d.tasks[0].result[0].markdown = "TandemOpsExtra"; }).mentioned, false);
  assert.equal(variant(d => { d.tasks[0].result[0].markdown = ""; d.tasks[0].result[0].items = []; }).mentioned, null);
  assert.equal(variant(d => { d.tasks[0].status_code = 40104; }).state, "unavailable");
  assert.equal(parseChatGPTResponse(input, "invalid").mentioned, null);
  assert.equal(variant(d => { d.tasks_error = 1; }).cited, null);
  const reflected = structuredClone(synthetic);
  reflected.tasks[0].result[0].markdown = `Explicit offline fixture: offline-password ${credentials.authBase64}`;
  const redacted = await probeChatGPT(input, { ...options, fetcher: async () => new Response(JSON.stringify(reflected)) });
  assert.equal(redacted.state, "observed"); assert.ok(!JSON.stringify(redacted).includes("offline-password")); assert.ok(!JSON.stringify(redacted).includes(credentials.authBase64));
  assert.ok(!JSON.stringify(redacted.raw).includes("search_results"));
  let failedSends = 0;
  const failure = await probeChatGPT(input, { ...options, fetcher: async () => { failedSends++; throw Error("offline-password secret account error"); } });
  assert.equal(failedSends, 1); assert.equal(failure.state, "unavailable"); assert.ok(!JSON.stringify(failure).includes("offline-password"));
  const http = await probeChatGPT(input, { ...options, fetcher: async () => new Response(JSON.stringify({ ...synthetic, status_message: "private account body" }), { status: 403 }) });
  assert.equal(http.state, "unavailable"); assert.equal(http.receipt?.cost, 0.004); assert.equal(http.answer, undefined); assert.ok(!JSON.stringify(http).includes("private account body"));
  const expensive = structuredClone(synthetic); expensive.cost = 0.005;
  assert.match((await probeChatGPT(input, { ...options, fetcher: async () => new Response(JSON.stringify(expensive)) })).error!, /reconciliation/);
  const oversized = await probeChatGPT(input, { ...options, fetcher: async () => new Response("x".repeat(4194305)) });
  assert.match(oversized.error!, /body limit/);
  // Full-body timeout: headers arrive, body never completes. Real timer keeps the event loop live.
  let cancelled = false;
  const started = Date.now();
  const stalled = await probeChatGPT(input, { ...options, timeoutMs: 20, fetcher: async () => new Response(new ReadableStream({ cancel() { cancelled = true; } })) });
  assert.match(stalled.error!, /timed out/); assert.ok(Date.now() - started < 1000); assert.ok(cancelled);
  const headerStall = await probeChatGPT(input, { ...options, timeoutMs: 20, fetcher: async () => new Promise(() => {}) });
  assert.match(headerStall.error!, /timed out/);
  console.log("PASS offline budget fail-closed, exact-host citations, unbranded query, one-send/no-retry, provider errors, cost/body caps, header/body deadline tests");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
