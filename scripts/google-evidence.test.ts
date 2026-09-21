import assert from "node:assert/strict";
import { loadAIOverview, localRows, probeGoogleSearch } from "../src/lib/audit/probes/google-search";
import { requestSerp, redactSerp } from "../src/lib/audit/probes/serpapi-transport";
async function main() {
  process.env.SERPAPI_KEY = "synthetic-test-key";
  const original = global.fetch;
  let calls = 0;
  try {
    assert.equal(localRows({ local_results: [{ title: "A" }] }).length, 1);
    assert.equal(localRows({ local_results: { places: [{ title: "B" }] } }).length, 1);
    global.fetch = (async (url: URL) => {
      calls++;
      assert.equal(url.searchParams.get("engine"), "google_ai_overview");
      assert.equal(url.searchParams.get("page_token"), "fixture-token");
      return Response.json({ search_metadata: { status: "Success", id: "fixture" }, ai_overview: { text_blocks: [{ snippet: "Captured fixture answer" }], references: [{ link: "https://example.com", title: "Citation" }] } });
    }) as typeof fetch;
    const loaded = await loadAIOverview({ ai_overview: { page_token: "fixture-token" } }, "query", "location");
    assert.equal(loaded.evidence.state, "observed"); assert.equal(loaded.evidence.citations.length, 1); assert.equal(calls, 1);
    await loadAIOverview({ ai_overview: { text_blocks: [{ snippet: "Already loaded" }] } }, "q", "l");
    assert.equal(calls, 1);
    global.fetch = (async () => Response.json({ error: "Your account has run out of searches." }, { status: 429 })) as typeof fetch;
    const failed = await loadAIOverview({ ai_overview: { page_token: "fixture-token" } }, "q", "l");
    assert.equal(failed.evidence.state, "unavailable"); assert.equal(failed.capture?.httpStatus, 429); assert.match(failed.capture?.error ?? "", /run out/); assert.ok(failed.capture?.raw);
    global.fetch = (async () => Response.json({ search_metadata: { status: "Success" } })) as typeof fetch;
    assert.equal((await loadAIOverview({ ai_overview: { page_token: "fixture-token" } }, "q", "l")).evidence.state, "unavailable");
    global.fetch = (async (_url, options) => new Response(new ReadableStream({ start(c) { options?.signal?.addEventListener("abort", () => c.error(new Error("aborted"))); } }))) as typeof fetch;
    assert.equal((await requestSerp({ engine: "google_local" }, 20)).status, "timeout");
    global.fetch = (async () => new Response("x".repeat(2_000_001))) as typeof fetch;
    assert.equal((await requestSerp({ engine: "google" })).status, "body_limit");
    assert.ok(!JSON.stringify(redactSerp({ api_key: "synthetic-test-key", page_token: "token", link: "https://x/?api_key=synthetic-test-key" })).includes("synthetic-test-key"));
    global.fetch = (async (input) => {
      const url = new URL(String(input));
      if (url.pathname === "/locations.json") return Response.json([{ name: "19008", canonical_name: "19008,Pennsylvania,United States", country_code: "US" }]);
      assert.equal(url.searchParams.get("location"), "19008,Pennsylvania,United States");
      if (url.searchParams.get("q")?.includes(" near ")) return Response.json({ error: "local upstream failed" }, { status: 503 });
      return Response.json({ search_metadata: { status: "Success" }, organic_results: [{ title: "247ROI", link: "https://get247roi.com", position: 1 }] });
    }) as typeof fetch;
    const result = await probeGoogleSearch({ businessName: "247ROI", zipCode: "19008", websiteUrl: "https://get247roi.com", servicePhrase: "automation" });
    assert.equal(result.blocks.length, 2); assert.equal(result.captures?.length, 3); assert.match(result.rawError ?? "", /google: HTTP 503/); assert.equal(result.aiOverviews?.[0].state, "not_returned");
    console.log("PASS: local array/nested schema, token load+citation, no duplicate load, quota error/raw, empty token unavailable, body deadline, byte cap, redaction, partial-lane survival/canonical location (10 cases)");
  } finally { global.fetch = original; }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
