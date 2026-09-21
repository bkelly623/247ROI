import assert from "node:assert/strict";
import { reservePublicChatGPT, recordPublicChatGPTOutcome } from "../src/lib/audit/probes/chatgpt-budget";

async function main() {
  const old = { ...process.env }; const originalFetch = globalThis.fetch;
  let calls = 0;
  const input = { sessionId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa", query: "offline", requestBody: JSON.stringify([{ keyword: "offline", language_code: "en", location_name: "United States", force_web_search: true }]), upperCostMicros: 4000 };
  try {
    delete process.env.PUBLIC_CHATGPT_BUDGET_ENABLED;
    assert.equal(await reservePublicChatGPT(input), false);
    process.env.PUBLIC_CHATGPT_BUDGET_ENABLED = "true";
    for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_KEY"]) delete process.env[key];
    assert.equal(await reservePublicChatGPT(input), false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://offline.invalid";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "offline-synthetic-not-a-credential";
    globalThis.fetch = async (url, init) => {
      calls++;
      assert.match(String(url), /^https:\/\/offline\.invalid\/rest\/v1\/rpc\/audit_/);
      const payload = JSON.parse(String(init?.body));
      if (String(url).endsWith("audit_reserve_public_chatgpt")) {
        assert.deepEqual(payload.p_request, JSON.parse(input.requestBody));
        assert.equal(payload.p_upper_cost, 4000);
      }
      return new Response("true", { headers: { "Content-Type": "application/json" } });
    };
    assert.equal(await reservePublicChatGPT({ ...input, upperCostMicros: 4001 }), false);
    assert.equal(await reservePublicChatGPT({ ...input, requestBody: "invalid JSON" }), false);
    assert.equal(calls, 0);
    assert.equal(await reservePublicChatGPT(input), true);
    assert.equal(await recordPublicChatGPTOutcome(input.sessionId, { status: "error", reason: "offline timeout" }), true);
    globalThis.fetch = async () => new Response('{"message":"offline database failure"}', { status: 500 });
    assert.equal(await reservePublicChatGPT(input), false);
    globalThis.fetch = async () => { throw new Error("offline network failure"); };
    assert.equal(await reservePublicChatGPT(input), false);
    console.log("PASS: native service-client RPC adapter; disabled/missing config/invalid quote/invalid JSON/DB and network errors fail closed; JSON request parsed; outcome contract.");
  } finally { globalThis.fetch = originalFetch; process.env = old; }
}
void main();
