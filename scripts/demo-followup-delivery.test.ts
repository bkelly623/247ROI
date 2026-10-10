import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { type InquiryStore } from "../src/lib/inquiries";
import { DEMO_ASSISTANT_ID, DEMO_FOLLOWUP_TEXT, MAIN_ASSISTANT_ID, processDemoFollowupJob, receiveDemoEndReport, receiveDemoFollowupRequest } from "../src/lib/demo-followup-delivery";
import { MISSED_CALL_TEXT } from "../src/lib/missed-calls";
import { retryVoiceJobs } from "../src/lib/voice-jobs";

const parent = "CA" + "a".repeat(32);
const child = "CA" + "b".repeat(32);
const decoy = "CA" + "c".repeat(32);
const caller = "+12025550123";
const business = "+16103003001";
const attack = "+19995550199";
const sip = "sip:receptionist@sip.vapi.ai";
const phoneId = "phone_real_247";
const callId = "call_demo_123";
const secret = "offline-voice-secret";
const vapiKey = "offline-vapi-key";
const quotes = {
  smsPermissionQuote: "Yes",
  notBookedQuote: "No, not yet.",
  prospectQuote: "I want a demo of the AI receptionist for my plumbing business.",
};
let passed = 0;

function memoryStore(fault?: { match: string; op: "put" | "get"; mode: "throw" | "false"; when?: "present"; times: number }) {
  const objects = new Map<string, unknown>();
  let left = fault?.times ?? 0;
  const hit = (key: string) => {
    if (!fault || left <= 0 || !key.includes(fault.match)) return false;
    if (fault.when === "present" && !objects.has(key)) return false;
    left--;
    return true;
  };
  const store: InquiryStore = {
    ensure: async () => undefined,
    get: async <T>(key: string) => { if (fault?.op === "get" && hit(key)) throw new Error("injected_get"); return (objects.get(key) as T | undefined) ?? null; },
    put: async (key, value, upsert = false) => {
      if (fault?.op === "put" && hit(key)) { if (fault.mode === "throw") throw new Error("injected_put"); return false; }
      if (objects.has(key) && !upsert) return false;
      objects.set(key, structuredClone(value));
      return true;
    },
    remove: async key => { objects.delete(key); },
    list: async (prefix: string) => [...objects.keys()].filter(key => key.startsWith(`${prefix}/`)).map(key => ({ name: key.slice(prefix.length + 1) })),
  };
  return { objects, store };
}
function toolRequest(args: unknown, header = secret) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (header) headers["x-voice-agent-secret"] = header;
  const body = { message: { type: "tool-calls", call: { id: callId }, toolCallList: [{ id: "tool_demo_123", function: { name: "request_demo_followup", arguments: args } }] } };
  return new NextRequest("http://localhost:3647/api/voice/receptionist/demo-followup", { method: "POST", headers, body: JSON.stringify(body) });
}
function endReport(extra = "ok") {
  const body = { message: { type: "end-of-call-report", call: { id: callId }, artifact: { transcript: extra } } };
  return new NextRequest("http://localhost:3647/api/voice/receptionist/end-report", { method: "POST", headers: { "content-type": "application/json", "x-voice-agent-secret": secret }, body: JSON.stringify(body) });
}
function positiveMessages() {
  return [
    { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Thanks for calling 247ROI. What can I help you with?" },
    { role: "user", message: quotes.prospectQuote },
    { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "start_isolated_demo", arguments: "{}" } }] },
    { role: "assistant", assistantId: DEMO_ASSISTANT_ID, message: "Pretend you are the caller." },
    { role: "user", message: "You can text me." },
    { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "return_to_real_reception", arguments: "{}" } }] },
    { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Have you already booked an appointment?" },
    { role: "user", message: "No, not yet." },
    { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Would you like one follow-up text after this call?" },
    { role: "user", message: "Yes" },
  ];
}
function vapiCall(messages: unknown[], patch: Record<string, unknown> = {}) {
  return {
    id: callId, type: "inboundPhoneCall", status: "ended", phoneNumberId: phoneId, phoneCallProviderId: decoy,
    startedAt: "2026-10-09T18:00:06.000Z", endedAt: "2026-10-09T18:02:01.000Z",
    customer: { number: caller },
    assistantOverrides: { variableValues: { "twilio-callsid": child } },
    messages,
    artifact: {
      messages,
      assistantActivations: [
        { assistantId: MAIN_ASSISTANT_ID, assistantName: "Receptionist", version: 1 },
        { assistantId: DEMO_ASSISTANT_ID, assistantName: "Demo", version: 1 },
      ],
    },
    ...patch,
  };
}
function leg(sid: string, fields: Record<string, unknown>) {
  return { sid, parent_call_sid: fields.parent_call_sid ?? "", to: fields.to, from: fields.from, direction: fields.direction, status: fields.status, start_time: fields.start_time ?? null, end_time: fields.end_time ?? null };
}
function childLeg() {
  return leg(child, { parent_call_sid: parent, to: sip, from: business, direction: "outbound-dial", status: "completed", start_time: "2026-10-09T18:00:05.000Z", end_time: "2026-10-09T18:02:00.000Z" });
}
function parentLeg(patch: Record<string, unknown> = {}) {
  return leg(parent, { to: business, from: caller, direction: "inbound", status: "completed", start_time: "2026-10-09T18:00:00.000Z", end_time: "2026-10-09T18:02:05.000Z", ...patch });
}
function formBody(body: unknown) {
  const text = typeof body === "string" ? body : body instanceof URLSearchParams ? body.toString() : "";
  return new URLSearchParams(text);
}
async function check(name: string, fn: () => Promise<void>) { await fn(); passed++; console.log("PASS", name); }

async function main() {
  const prior = { ...process.env };
  process.env.VOICE_VAPI_ACTION_SECRET = secret;
  process.env.VOICE_DEMO_FOLLOWUP_ENABLED = "true";
  process.env.VAPI_PRIVATE_KEY = vapiKey;
  process.env.VOICE_VAPI_PHONE_NUMBER_ID = phoneId;
  process.env.VOICE_VAPI_SIP_URI = sip;
  process.env.TWILIO_ACCOUNT_SID = "ACoffline";
  process.env.TWILIO_AUTH_TOKEN = "offline-token";
  process.env.TWILIO_PHONE_NUMBER = business;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  function network(call: Record<string, unknown>, send: (body: URLSearchParams) => Response | Promise<Response>) {
    const looked = new Set<string>();
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      assert.equal(url.includes(vapiKey), false);
      if (url.includes("api.vapi.ai/call/")) {
        assert.equal((init?.headers as { Authorization?: string })?.Authorization, `Bearer ${vapiKey}`);
        return Response.json(call);
      }
      const sid = url.split("/Calls/")[1]?.split(".json")[0];
      if (sid) {
        looked.add(decodeURIComponent(sid));
        if (sid === child) return Response.json(childLeg());
        if (sid === parent) return Response.json(parentLeg());
        return new Response("missing", { status: 404 });
      }
      if (url.includes("/Messages.json")) return send(formBody(init?.body));
      throw new Error(`unexpected ${url}`);
    };
    return { fetchImpl, looked };
  }

  async function prepare(bucket: ReturnType<typeof memoryStore>, args = quotes) {
    bucket.objects.set(`voice-route/${parent}.json`, { route: "receptionist", at: 1, receptionStart: 1 });
    const response = await receiveDemoFollowupRequest(toolRequest(args), bucket.store);
    assert.equal(response.status, 200);
    const body = await response.json() as { results: { result: string }[] };
    const parsed = JSON.parse(body.results[0].result) as { status: string; sent: boolean };
    assert.equal(parsed.status, "pending_verification");
    assert.equal(parsed.sent, false);
    assert.equal((await receiveDemoEndReport(endReport("CONTEXT".repeat(4000)), bucket.store)).status, 200);
    assert.equal(JSON.stringify([...bucket.objects.values()]).includes("CONTEXTCONTEXT"), false);
  }

  await check("eligible completed demo sends one fixed text to the parent caller", async () => {
    const bucket = memoryStore();
    await prepare(bucket);
    let sends = 0;
    const { fetchImpl, looked } = network(vapiCall(positiveMessages()), body => {
      sends++;
      assert.equal(body.get("To"), caller);
      assert.equal(body.get("From"), business);
      assert.equal(body.get("Body"), DEMO_FOLLOWUP_TEXT);
      assert.notEqual(body.get("Body"), MISSED_CALL_TEXT);
      return Response.json({ sid: "SMfixture" });
    });
    assert.equal(await processDemoFollowupJob(bucket.store, callId, { fetchImpl }), "done");
    assert.equal(sends, 1);
    assert.equal(looked.has(decoy), false);
    assert.equal((bucket.objects.get(`voice-demo-results/${callId}.json`) as { status: string; sid: string }).status, "sent");
    assert.equal((bucket.objects.get(`voice-demo-request/${callId}.json`) as { status: string }).status, "sent");
    assert.equal([...bucket.objects.keys()].some(key => key.startsWith("sms-permissions/") || key.startsWith("submissions/")), false);
    assert.equal(await processDemoFollowupJob(bucket.store, callId, { fetchImpl }), "done");
    assert.equal(sends, 1);
  });

  await check("concurrent stale-ready recovery sends at most once", async () => {
    const bucket = memoryStore();
    await prepare(bucket);
    bucket.objects.set(`voice-demo-claims/${callId}.json`, { at: new Date(Date.now() - 20000).toISOString(), state: "ready", phone: caller });
    let sends = 0;
    const { fetchImpl } = network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SMrecovery" }); });
    await Promise.all([processDemoFollowupJob(bucket.store, callId, { fetchImpl }), processDemoFollowupJob(bucket.store, callId, { fetchImpl })]);
    assert.equal(sends, 1);
    assert.equal((bucket.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "sent");
  });

  await check("direct text permission is accepted and an unrelated yes is not", async () => {
    const direct = memoryStore();
    const messages = [
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Thanks for calling 247ROI." },
      { role: "user", message: "I want a demo of the AI receptionist for my plumbing business." },
      { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "start_isolated_demo", arguments: "{}" } }] },
      { role: "assistant", assistantId: DEMO_ASSISTANT_ID, message: "Pretend you are the caller." },
      { role: "user", message: "You can text me." },
      { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "return_to_real_reception", arguments: "{}" } }] },
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "What should we do next?" },
      { role: "user", message: "I haven't booked an appointment." },
      { role: "user", message: "You can text me." },
    ];
    await prepare(direct, { ...quotes, smsPermissionQuote: "You can text me.", notBookedQuote: "I haven't booked an appointment." });
    let sends = 0;
    const ok = network(vapiCall(messages), () => { sends++; return Response.json({ sid: "SMfixture" }); });
    assert.equal(await processDemoFollowupJob(direct.store, callId, { fetchImpl: ok.fetchImpl }), "done");
    assert.equal(sends, 1);
    const ambiguous = memoryStore();
    const wrongYes = [
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Thanks for calling 247ROI." },
      { role: "user", message: quotes.prospectQuote },
      { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "start_isolated_demo", arguments: "{}" } }] },
      { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "return_to_real_reception", arguments: "{}" } }] },
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Have you already booked an appointment?" },
      { role: "user", message: "No, not yet." },
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Does Tuesday at 3 work?" },
      { role: "user", message: "Yes" },
    ];
    await prepare(ambiguous);
    let badSends = 0;
    const bad = network(vapiCall(wrongYes), () => { badSends++; return Response.json({ sid: "SMfixture" }); });
    await processDemoFollowupJob(ambiguous.store, callId, { fetchImpl: bad.fetchImpl });
    assert.equal(badSends, 0);
    assert.equal((ambiguous.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "permission_rejected");
  });

  await check("opt-out, existing customer, and other excluded callers do not send", async () => {
    const cases: Array<[string, unknown[], string]> = [
      ["opt_out", [...positiveMessages(), { role: "user", message: "STOP" }], "opt_out"],
      ["existing_customer", [...positiveMessages(), { role: "user", message: "I'm an existing customer" }], "existing_customer"],
      ["support", [...positiveMessages(), { role: "user", message: "I need support" }], "support"],
      ["vendor", [...positiveMessages(), { role: "user", message: "I'm a vendor" }], "vendor"],
      ["wrong_number", [...positiveMessages(), { role: "user", message: "Sorry, wrong number" }], "wrong_number"],
      ["spam", [...positiveMessages(), { role: "user", message: "This is spam" }], "spam"],
      ["declined", [...positiveMessages(), { role: "user", message: "I am not interested" }], "declined"],
      ["urgent_transfer", [...positiveMessages(), { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "transferCall", arguments: "{}" } }] }], "urgent_transfer"],
    ];
    for (const [, messages, status] of cases) {
      const bucket = memoryStore();
      await prepare(bucket);
      let sends = 0;
      const { fetchImpl } = network(vapiCall(messages), () => { sends++; return Response.json({ sid: "SMfixture" }); });
      await processDemoFollowupJob(bucket.store, callId, { fetchImpl });
      assert.equal(sends, 0, status);
      assert.equal((bucket.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, status);
      assert.equal([...bucket.objects.keys()].some(key => key.startsWith("sms-permissions/")), false);
    }
  });

  await check("event creation and uncertain booking suppress the phone without a follow-up request", async () => {
    const created = memoryStore();
    created.objects.set(`voice-route/${parent}.json`, { route: "receptionist", at: 1, receptionStart: 1 });
    await receiveDemoEndReport(endReport(), created.store);
    const createdMessages = [{ role: "tool_call_result", name: "google.calendar.event.create", result: { kind: "calendar#event", status: "confirmed", id: "evt_real_123" } }, { role: "user", message: "Thanks" }];
    let sends = 0;
    const createdNet = network(vapiCall(createdMessages), () => { sends++; return Response.json({ sid: "SMfixture" }); });
    await processDemoFollowupJob(created.store, callId, { fetchImpl: createdNet.fetchImpl });
    assert.equal(sends, 0);
    assert.equal((created.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "suppressed");
    assert.equal([...created.objects.keys()].some(key => key.startsWith("voice-demo-booking/")), true);
    const uncertain = memoryStore();
    uncertain.objects.set(`voice-route/${parent}.json`, { route: "receptionist", at: 1, receptionStart: 1 });
    await receiveDemoFollowupRequest(toolRequest(quotes), uncertain.store);
    await receiveDemoEndReport(endReport(), uncertain.store);
    const uncertainMessages = [...positiveMessages(), { role: "tool_call_result", name: "google.calendar.event.create", result: { status: "failed" } }];
    const uncertainNet = network(vapiCall(uncertainMessages), () => { sends++; return Response.json({ sid: "SMfixture" }); });
    await processDemoFollowupJob(uncertain.store, callId, { fetchImpl: uncertainNet.fetchImpl });
    assert.equal(sends, 0);
    assert.equal((uncertain.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "suppressed");
    assert.equal((uncertain.objects.get(`voice-demo-request/${callId}.json`) as { status: string }).status, "suppressed");
    assert.equal([...uncertain.objects.keys()].some(key => key.startsWith("voice-demo-booking/")), true);
  });

  await check("missing demo, incomplete call, bad quotes, and ambiguous booking do not send", async () => {
    const noDemo = memoryStore();
    await prepare(noDemo);
    const withoutDemo = positiveMessages().filter(message => !("toolCalls" in message));
    let sends = 0;
    await processDemoFollowupJob(noDemo.store, callId, { fetchImpl: network(vapiCall(withoutDemo), () => { sends++; return Response.json({ sid: "SM" }); }).fetchImpl });
    assert.equal((noDemo.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "no_demo");
    const pending = memoryStore();
    await prepare(pending);
    const progress = network(vapiCall(positiveMessages(), { status: "in-progress", endedAt: undefined }), () => { sends++; return Response.json({ sid: "SM" }); });
    assert.equal(await processDemoFollowupJob(pending.store, callId, { fetchImpl: progress.fetchImpl }), "pending");
    assert.equal(pending.objects.has(`voice-demo-results/${callId}.json`), false);
    const ready = network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SMready" }); });
    await processDemoFollowupJob(pending.store, callId, { fetchImpl: ready.fetchImpl });
    assert.equal((pending.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "sent");
    const mismatch = memoryStore();
    await prepare(mismatch, { ...quotes, prospectQuote: "A quote the caller never said." });
    await processDemoFollowupJob(mismatch.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SM" }); }).fetchImpl });
    assert.equal((mismatch.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "quote_mismatch");
    const maybe = memoryStore();
    const maybeMessages = [
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Thanks for calling 247ROI." },
      { role: "user", message: quotes.prospectQuote },
      { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "start_isolated_demo", arguments: "{}" } }] },
      { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "return_to_real_reception", arguments: "{}" } }] },
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Have you already booked an appointment?" },
      { role: "user", message: "Maybe" },
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Would you like one follow-up text after this call?" },
      { role: "user", message: "Yes" },
    ];
    await prepare(maybe, { ...quotes, notBookedQuote: "Maybe" });
    await processDemoFollowupJob(maybe.store, callId, { fetchImpl: network(vapiCall(maybeMessages), () => { sends++; return Response.json({ sid: "SM" }); }).fetchImpl });
    assert.equal((maybe.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "not_booked_unclear");
    assert.equal(sends, 1);
  });

  await check("foreign parent, stale binding, wrong recipient, web call, and provider id are not texted", async () => {
    const bucket = memoryStore();
    await prepare(bucket);
    let sends = 0;
    const send = () => { sends++; return Response.json({ sid: "SMfixture" }); };
    const foreign = network(vapiCall(positiveMessages()), send);
    foreign.fetchImpl = async (input, init) => {
      const url = String(input);
      if (url.includes("/Calls/") && url.includes(parent)) return Response.json(parentLeg({ to: attack, from: attack }));
      return network(vapiCall(positiveMessages()), send).fetchImpl(input, init);
    };
    await processDemoFollowupJob(bucket.store, callId, { fetchImpl: foreign.fetchImpl });
    assert.equal((bucket.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "unbound");
    const stale = memoryStore();
    await prepare(stale);
    await processDemoFollowupJob(stale.store, callId, { fetchImpl: network(vapiCall(positiveMessages(), { endedAt: "2026-10-09T18:20:00.000Z" }), send).fetchImpl });
    assert.equal((stale.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "stale");
    const wrong = memoryStore();
    await prepare(wrong);
    await processDemoFollowupJob(wrong.store, callId, { fetchImpl: network(vapiCall(positiveMessages(), { customer: { number: attack } }), send).fetchImpl });
    assert.equal((wrong.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "wrong_recipient");
    const web = memoryStore();
    await prepare(web);
    const webNet = network(vapiCall(positiveMessages(), { type: "webCall" }), send);
    await processDemoFollowupJob(web.store, callId, { fetchImpl: webNet.fetchImpl });
    assert.equal((web.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "web_call");
    assert.equal(webNet.looked.size, 0);
    const unbound = memoryStore();
    await prepare(unbound);
    const unboundNet = network(vapiCall(positiveMessages(), { assistantOverrides: { variableValues: {} }, phoneCallProviderId: decoy }), send);
    await processDemoFollowupJob(unbound.store, callId, { fetchImpl: unboundNet.fetchImpl });
    assert.equal(unboundNet.looked.has(decoy), false);
    assert.equal((unbound.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "unbound");
    assert.equal(sends, 0);
  });

  await check("duplicate callbacks and a raced send claim send once", async () => {
    const bucket = memoryStore();
    await prepare(bucket);
    assert.equal((await receiveDemoEndReport(endReport(), bucket.store)).status, 200);
    assert.equal([...bucket.objects.keys()].filter(key => key.startsWith("voice-demo-jobs/")).length, 1);
    let sends = 0;
    let nested: Promise<string> | null = null;
    const { fetchImpl } = network(vapiCall(positiveMessages()), async () => {
      sends++;
      if (sends === 1) {
        nested = processDemoFollowupJob(bucket.store, callId, { fetchImpl });
        assert.equal(await nested, "pending");
      }
      return Response.json({ sid: "SMfixture" });
    });
    await processDemoFollowupJob(bucket.store, callId, { fetchImpl });
    assert.equal(sends, 1);
    assert.equal((bucket.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "sent");
  });

  await check("a prior phone claim and a later booking suppress delivery", async () => {
    const claimed = memoryStore();
    await prepare(claimed);
    claimed.objects.set("voice-demo-phone/seed.json", { vapiCallId: "call_older", at: "2026-10-01T00:00:00.000Z" });
    const phone = await import("node:crypto").then(crypto => crypto.createHash("sha256").update(caller).digest("hex"));
    claimed.objects.delete("voice-demo-phone/seed.json");
    claimed.objects.set(`voice-demo-phone/${phone}.json`, { vapiCallId: "call_older", at: "2026-10-01T00:00:00.000Z" });
    let sends = 0;
    await processDemoFollowupJob(claimed.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SM" }); }).fetchImpl });
    assert.equal(sends, 0);
    assert.equal((claimed.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "prior_phone");
    const later = memoryStore();
    await prepare(later);
    const progress = network(vapiCall(positiveMessages(), { status: "in-progress", endedAt: undefined }), () => { sends++; return Response.json({ sid: "SM" }); });
    assert.equal(await processDemoFollowupJob(later.store, callId, { fetchImpl: progress.fetchImpl }), "pending");
    const bookedMessages = [...positiveMessages(), { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "google.calendar.event.create", arguments: "{}" } }] }];
    await processDemoFollowupJob(later.store, callId, { fetchImpl: network(vapiCall(bookedMessages), () => { sends++; return Response.json({ sid: "SM" }); }).fetchImpl });
    assert.equal((later.objects.get(`voice-demo-request/${callId}.json`) as { status: string }).status, "suppressed");
    assert.equal(sends, 0);
  });

  await check("provider acceptance, uncertainty, and definite rejection keep the send claim honest", async () => {
    const accepted = memoryStore();
    await prepare(accepted);
    let sends = 0;
    await processDemoFollowupJob(accepted.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SMaccepted" }); }).fetchImpl });
    await receiveDemoEndReport(endReport(), accepted.store);
    await processDemoFollowupJob(accepted.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SMsecond" }); }).fetchImpl });
    assert.equal(sends, 1);
    const uncertain = memoryStore();
    await prepare(uncertain);
    await processDemoFollowupJob(uncertain.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ ok: false }, { status: 500 }); }).fetchImpl });
    const uncertainResult = uncertain.objects.get(`voice-demo-results/${callId}.json`) as { status: string; uncertain?: boolean };
    assert.equal(uncertainResult.status, "uncertain");
    assert.equal(uncertainResult.uncertain, true);
    await receiveDemoEndReport(endReport(), uncertain.store);
    await processDemoFollowupJob(uncertain.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SMlater" }); }).fetchImpl });
    assert.equal(sends, 2);
    const rejected = memoryStore();
    await prepare(rejected);
    await assert.rejects(() => processDemoFollowupJob(rejected.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ code: 21211 }, { status: 400 }); }).fetchImpl }));
    assert.equal(rejected.objects.has(`voice-demo-claims/${callId}.json`), false);
    await processDemoFollowupJob(rejected.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SMretry" }); }).fetchImpl });
    assert.equal((rejected.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "sent");
    const opted = memoryStore();
    await prepare(opted);
    await processDemoFollowupJob(opted.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ code: 21610 }, { status: 400 }); }).fetchImpl });
    assert.equal((opted.objects.get(`voice-demo-results/${callId}.json`) as { status: string; code: number }).code, 21610);
    const before = sends;
    await receiveDemoEndReport(endReport(), opted.store);
    await processDemoFollowupJob(opted.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SMno" }); }).fetchImpl });
    assert.equal(sends, before);
  });

  await check("partial request writes recover without acknowledging a missing record", async () => {
    const missing = memoryStore({ match: "voice-demo-request/", op: "put", mode: "false", times: 1 });
    assert.equal((await receiveDemoFollowupRequest(toolRequest(quotes), missing.store)).status, 503);
    assert.equal([...missing.objects.keys()].length, 0);
    const saved = await receiveDemoFollowupRequest(toolRequest(quotes), missing.store);
    assert.equal(JSON.parse(((await saved.json()) as { results: { result: string }[] }).results[0].result).status, "pending_verification");
    assert.equal([...missing.objects.keys()].filter(key => key.startsWith("voice-demo-request/")).length, 1);
    const readback = memoryStore({ match: "voice-demo-request/", op: "get", mode: "throw", when: "present", times: 1 });
    assert.equal((await receiveDemoFollowupRequest(toolRequest(quotes), readback.store)).status, 503);
    const again = await receiveDemoFollowupRequest(toolRequest(quotes), readback.store);
    assert.equal(JSON.parse(((await again.json()) as { results: { result: string }[] }).results[0].result).sent, false);
    assert.equal([...readback.objects.keys()].filter(key => key.startsWith("voice-demo-request/")).length, 1);
    const changed = await receiveDemoFollowupRequest(toolRequest({ ...quotes, prospectQuote: "A different prospect quote." }), readback.store);
    assert.equal(changed.status, 409);
    assert.equal((readback.objects.get(`voice-demo-request/${callId}.json`) as { prospectQuote: string }).prospectQuote, quotes.prospectQuote);
  });

  await check("default off, bad envelopes, and ops retry stay fail-closed", async () => {
    const bucket = memoryStore();
    await prepare(bucket);
    delete process.env.VOICE_DEMO_FOLLOWUP_ENABLED;
    let sends = 0;
    await processDemoFollowupJob(bucket.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SM" }); }).fetchImpl });
    assert.equal(sends, 0);
    assert.equal((bucket.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "disabled");
    process.env.VOICE_DEMO_FOLLOWUP_ENABLED = "true";
    delete process.env.VOICE_VAPI_ACTION_SECRET;
    assert.equal((await receiveDemoFollowupRequest(toolRequest(quotes, secret), bucket.store)).status, 403);
    process.env.VOICE_VAPI_ACTION_SECRET = secret;
    assert.equal((await receiveDemoFollowupRequest(toolRequest(quotes, ""), bucket.store)).status, 403);
    const malformed = new NextRequest("http://localhost:3647/api/voice/receptionist/demo-followup", { method: "POST", headers: { "content-type": "application/json", "x-voice-agent-secret": secret }, body: JSON.stringify({ message: { type: "tool-calls", call: { id: 15 }, toolCallList: [null] } }) });
    assert.equal((await receiveDemoFollowupRequest(malformed, bucket.store)).status, 400);
    const extra = await receiveDemoFollowupRequest(toolRequest({ ...quotes, smsPermission: true }), bucket.store);
    assert.equal(JSON.parse(((await extra.json()) as { results: { result: string }[] }).results[0].result).ok, false);
    const declared = new NextRequest("http://localhost:3647/api/voice/receptionist/end-report", { method: "POST", headers: { "content-type": "application/json", "x-voice-agent-secret": secret, "content-length": String((1024 * 1024) + 1) }, body: "{}" });
    assert.equal((await receiveDemoEndReport(declared, bucket.store)).status, 413);
    const queued = memoryStore();
    queued.objects.set(`voice-route/${parent}.json`, { route: "receptionist", at: 1, receptionStart: 1 });
    await receiveDemoFollowupRequest(toolRequest(quotes), queued.store);
    await receiveDemoEndReport(endReport(), queued.store);
    const ops = await retryVoiceJobs(queued.store, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SMops" }); }).fetchImpl });
    assert.equal(ops.processed, 0);
    assert.equal(ops.demoFollowup.processed, 1);
    assert.equal(sends, 1);
    assert.equal((queued.objects.get(`voice-demo-results/${callId}.json`) as { sid: string }).sid, "SMops");
  });

  await check("real reception evidence ignores demo roleplay and weak consent", async () => {
    const fictional = memoryStore();
    await prepare(fictional, { ...quotes, smsPermissionQuote: "You can text me.", notBookedQuote: "No, not yet." });
    const roleplay = [
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Thanks for calling 247ROI." },
      { role: "user", message: quotes.prospectQuote },
      { role: "user", message: "start_isolated_demo" },
      { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "start_isolated_demo", arguments: "{}" } }] },
      { role: "assistant", assistantId: DEMO_ASSISTANT_ID, message: "Have you already booked an appointment?" },
      { role: "user", message: "No, not yet." },
      { role: "assistant", assistantId: DEMO_ASSISTANT_ID, message: "Would you like one follow-up text after this call?" },
      { role: "user", message: "You can text me." },
      { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "return_to_real_reception", arguments: "{}" } }] },
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Welcome back." },
    ];
    let sends = 0;
    await processDemoFollowupJob(fictional.store, callId, { fetchImpl: network(vapiCall(roleplay), () => { sends++; return Response.json({ sid: "SM" }); }).fetchImpl });
    assert.equal(sends, 0);
    assert.equal((fictional.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "permission_rejected");
    const received = memoryStore();
    await prepare(received);
    const already = [
      ...positiveMessages().slice(0, 8),
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Have you already received one follow-up text?" },
      { role: "user", message: "Yes" },
    ];
    await processDemoFollowupJob(received.store, callId, { fetchImpl: network(vapiCall(already), () => { sends++; return Response.json({ sid: "SM" }); }).fetchImpl });
    assert.equal((received.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "permission_rejected");
    for (const utterance of ["Maybe text me", "What if you text me?"]) {
      const weak = memoryStore();
      await prepare(weak, { ...quotes, smsPermissionQuote: utterance });
      const weakMessages = [
        { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Thanks for calling 247ROI." },
        { role: "user", message: quotes.prospectQuote },
        { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "start_isolated_demo", arguments: "{}" } }] },
        { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "return_to_real_reception", arguments: "{}" } }] },
        { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Have you already booked an appointment?" },
        { role: "user", message: "No, not yet." },
        { role: "user", message: utterance },
      ];
      await processDemoFollowupJob(weak.store, callId, { fetchImpl: network(vapiCall(weakMessages), () => { sends++; return Response.json({ sid: "SM" }); }).fetchImpl });
      assert.equal((weak.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "permission_rejected", utterance);
    }
    const partial = memoryStore();
    await prepare(partial);
    const partialMessages = positiveMessages().map(message => message.message === "Yes" ? { ...message, message: "Yes, but only the phrase yes" } : message);
    await processDemoFollowupJob(partial.store, callId, { fetchImpl: network(vapiCall(partialMessages), () => { sends++; return Response.json({ sid: "SM" }); }).fetchImpl });
    assert.equal((partial.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "quote_mismatch");
    const repeated = memoryStore();
    await prepare(repeated);
    const repeatedMessages = [
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Does Tuesday at 3 work?" },
      { role: "user", message: "Yes" },
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Is this a good time?" },
      { role: "user", message: "No" },
      { role: "user", message: quotes.prospectQuote },
      { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "start_isolated_demo", arguments: "{}" } }] },
      { role: "tool_calls", toolCalls: [{ type: "function", function: { name: "return_to_real_reception", arguments: "{}" } }] },
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Have you already booked an appointment?" },
      { role: "user", message: "No" },
      { role: "assistant", assistantId: MAIN_ASSISTANT_ID, message: "Would you like one follow-up text after this call?" },
      { role: "user", message: "Yes" },
    ];
    await processDemoFollowupJob(repeated.store, callId, { fetchImpl: network(vapiCall(repeatedMessages), () => { sends++; return Response.json({ sid: "SMlater" }); }).fetchImpl });
    assert.equal((repeated.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "quote_mismatch");
    const repeatedNo = memoryStore();
    await prepare(repeatedNo, { ...quotes, notBookedQuote: "No", smsPermissionQuote: "Yes" });
    await processDemoFollowupJob(repeatedNo.store, callId, { fetchImpl: network(vapiCall(repeatedMessages), () => { sends++; return Response.json({ sid: "SMmatch" }); }).fetchImpl });
    assert.equal(sends, 1);
    assert.equal((repeatedNo.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "sent");
    assert.equal([...repeatedNo.objects.keys()].some(key => key.startsWith("sms-permissions/") || key.startsWith("submissions/")), false);
  });

  await check("booking suppression and pre-send failures stay recoverable", async () => {
    const dropped = memoryStore({ match: "voice-demo-booking/", op: "put", mode: "false", times: 1 });
    dropped.objects.set(`voice-route/${parent}.json`, { route: "receptionist", at: 1, receptionStart: 1 });
    await receiveDemoEndReport(endReport(), dropped.store);
    const created = [{ role: "tool_call_result", name: "google.calendar.event.create", result: { kind: "calendar#event", status: "confirmed", id: "evt_real_123" } }];
    let sends = 0;
    assert.equal(await processDemoFollowupJob(dropped.store, callId, { fetchImpl: network(vapiCall(created), () => { sends++; return Response.json({ sid: "SM" }); }).fetchImpl }), "pending");
    assert.equal(dropped.objects.has(`voice-demo-results/${callId}.json`), false);
    assert.equal(dropped.objects.has(`voice-demo-jobs/${callId}.json`), true);
    assert.equal(await processDemoFollowupJob(dropped.store, callId, { fetchImpl: network(vapiCall(created), () => { sends++; return Response.json({ sid: "SM" }); }).fetchImpl }), "done");
    assert.equal((dropped.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "suppressed");
    assert.equal([...dropped.objects.keys()].some(key => key.startsWith("voice-demo-booking/")), true);
    const claimFault = memoryStore({ match: "voice-demo-claims/", op: "get", mode: "throw", when: "present", times: 1 });
    await prepare(claimFault);
    assert.equal(await processDemoFollowupJob(claimFault.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SM" }); }).fetchImpl }), "pending");
    assert.equal(sends, 0);
    assert.notEqual((claimFault.objects.get(`voice-demo-results/${callId}.json`) as { status?: string } | undefined)?.status, "uncertain");
    assert.equal(await processDemoFollowupJob(claimFault.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SMafter" }); }).fetchImpl }), "done");
    assert.equal(sends, 1);
    const resultFault = memoryStore({ match: "voice-demo-results/", op: "get", mode: "throw", when: "present", times: 1 });
    await prepare(resultFault);
    assert.equal(await processDemoFollowupJob(resultFault.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SMonce" }); }).fetchImpl }), "pending");
    assert.equal(resultFault.objects.has(`voice-demo-jobs/${callId}.json`), true);
    assert.equal(await processDemoFollowupJob(resultFault.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SMtwice" }); }).fetchImpl }), "done");
    assert.equal(sends, 2);
    const opted = memoryStore({ match: "voice-demo-optout/", op: "put", mode: "false", times: 1 });
    await prepare(opted);
    assert.equal(await processDemoFollowupJob(opted.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ code: 21610 }, { status: 400 }); }).fetchImpl }), "pending");
    const before = sends;
    assert.equal(await processDemoFollowupJob(opted.store, callId, { fetchImpl: network(vapiCall(positiveMessages()), () => { sends++; return Response.json({ sid: "SMresend" }); }).fetchImpl }), "done");
    assert.equal(sends, before);
    assert.equal((opted.objects.get(`voice-demo-results/${callId}.json`) as { code: number }).code, 21610);
    const conflict = memoryStore();
    await prepare(conflict);
    await processDemoFollowupJob(conflict.store, callId, { fetchImpl: network(vapiCall(positiveMessages(), { messages: [{ role: "user", message: "different" }] }), () => { sends++; return Response.json({ sid: "SM" }); }).fetchImpl });
    assert.equal((conflict.objects.get(`voice-demo-results/${callId}.json`) as { status: string }).status, "transcript_unusable");
    assert.equal(sends, before);
  });

  for (const key of ["VOICE_VAPI_ACTION_SECRET", "VOICE_DEMO_FOLLOWUP_ENABLED", "VAPI_PRIVATE_KEY", "VOICE_VAPI_PHONE_NUMBER_ID", "VOICE_VAPI_SIP_URI", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (prior[key] === undefined) delete process.env[key]; else process.env[key] = prior[key];
  }
  console.log(JSON.stringify({ passed, actualSmsSent: 0 }));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
