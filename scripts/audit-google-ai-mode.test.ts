import assert from "node:assert/strict";
import { probeGoogleAIMode } from "../src/lib/audit/probes/google-ai-mode";

// All provider bytes are synthetic; no live network calls or quota consumption.
const input = { businessName: "Acme AI", servicePhrase: "AI business automation consultant", zipCode: "27401", websiteUrl: "https://www.acme.example/" };
const originalFetch = globalThis.fetch;
const originalTimer = globalThis.setTimeout;
const labels = ["SERPAPI_KEY", "SERP_API_KEY", "SERPAPI_API_KEY"];
const saved = labels.map(label => process.env[label]);
let calls = 0;
function fixture(data: unknown, status = 200) {
  globalThis.fetch = async (url, init) => {
    calls++;
    const parsed = new URL(String(url));
    assert.equal(parsed.origin + parsed.pathname, "https://serpapi.com/search.json");
    assert.equal(parsed.searchParams.get("engine"), "google_ai_mode");
    assert.equal(parsed.searchParams.get("hl"), "en");
    assert.equal(parsed.searchParams.get("gl"), "us");
    assert.equal(parsed.searchParams.get("location"), "27401, United States");
    assert.ok(parsed.searchParams.get("q")?.includes(input.servicePhrase));
    assert.ok(!parsed.searchParams.get("q")?.includes(input.businessName));
    assert.equal(parsed.searchParams.has("async"), false);
    assert.equal(parsed.searchParams.has("no_cache"), false);
    assert.equal(init?.cache, "no-store");
    return new Response(JSON.stringify(data), { status });
  };
}
async function main() {
  try {
    labels.forEach(label => delete process.env[label]);
    fixture({});
    let result = await probeGoogleAIMode(input);
    assert.equal(result.state, "not_configured");
    assert.equal(result.mentioned, null);
    assert.equal(calls, 0);
    process.env.SERP_API_KEY = "offline-secret";
    fixture({ search_metadata: { id: "search_123", status: "Success" }, reconstructed_markdown: "Consider **ACME AI** for automation.", references: [{ title: "Acme", link: "https://acme.example/services" }] });
    result = await probeGoogleAIMode(input);
    assert.equal(calls, 1);
    assert.equal(result.state, "observed");
    assert.equal(result.mentioned, true);
    assert.equal(result.cited, true);
    assert.equal(result.providerSearchId, "search_123");
    assert.equal(result.source, "serpapi");
    assert.ok(!Number.isNaN(Date.parse(result.observedAt)));
    assert.deepEqual(result.citations, [{ title: "Acme", url: "https://acme.example/services" }]);

    fixture({ text_blocks: [{ type: "list", list: [{ snippet: "Acme AIs and SuperAcme AI are other brands." }] }], references: [
      { link: "https://acme.example.evil.test" }, { link: "https://evil.test/acme.example" },
      { link: "https://other.acme.example" }, { link: "https://acme.example@evil.test" }, { link: "javascript:alert(1)" },
    ] });
    result = await probeGoogleAIMode(input);
    assert.equal(result.state, "observed");
    assert.equal(result.mentioned, false);
    assert.equal(result.cited, false);
    assert.equal(result.citations.length, 3);

    fixture({ reconstructed_markdown: "[Another company](https://example.com/Acme AI)", references: [] });
    assert.equal((await probeGoogleAIMode(input)).mentioned, false);
    fixture({ references: [{ title: "Acme AI", link: "https://acme.example" }], text_blocks: [] });
    result = await probeGoogleAIMode(input);
    assert.equal(result.state, "unavailable");
    assert.equal(result.cited, null);
    assert.equal(result.mentioned, null);
    assert.equal(result.citations.length, 1);
    for (const data of [null, {}, { error: "secret offline-secret" }, { search_metadata: { status: "Processing" }, reconstructed_markdown: "Acme AI" }]) {
      fixture(data);
      result = await probeGoogleAIMode(input);
      assert.equal(result.state, "unavailable");
      assert.equal(result.mentioned, null);
      assert.ok(!JSON.stringify(result).includes("offline-secret"));
    }
    fixture({ error: "offline-secret" }, 429);
    result = await probeGoogleAIMode(input);
    assert.equal(result.error, "Google AI Mode provider HTTP 429");
    globalThis.fetch = async () => { calls++; throw new Error("URL contains offline-secret"); };
    result = await probeGoogleAIMode(input);
    assert.equal(result.error, "Google AI Mode collection failed");

    // Accelerate the exact production deadline, keeping a real event-loop timer.
    globalThis.setTimeout = ((handler: (...args: unknown[]) => void, ms?: number, ...args: unknown[]) => {
      assert.equal(ms, 50_000);
      return originalTimer(handler, 15, ...args);
    }) as typeof setTimeout;
    let signal: AbortSignal | null | undefined;
    globalThis.fetch = async (_url, init) => {
      calls++; signal = init?.signal;
      return { ok: true, json: () => new Promise(() => {}) } as unknown as Response;
    };
    const before = calls;
    result = await probeGoogleAIMode(input);
    assert.equal(result.state, "unavailable");
    assert.equal(result.error, "Google AI Mode collection timed out");
    assert.equal(signal?.aborted, true);
    assert.equal(calls, before + 1);
    assert.equal(result.cited, null);
    globalThis.setTimeout = originalTimer;
    fixture({ reconstructed_markdown: "A+B (AI) can help." });
    assert.equal((await probeGoogleAIMode({ ...input, businessName: "A+B (AI)" })).mentioned, true);
    const beforeInvalid = calls;
    assert.equal((await probeGoogleAIMode({ ...input, servicePhrase: input.businessName })).state, "unavailable");
    assert.equal(calls, beforeInvalid);
    console.log("PASS: Google AI Mode offline request, evidence, exact identity, failures, and full-body deadline tests");
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalTimer;
    labels.forEach((label, i) => { if (saved[i] === undefined) delete process.env[label]; else process.env[label] = saved[i]; });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
