import assert from "node:assert/strict";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { handleVoiceEvent } from "../src/lib/missed-calls";
import { type InquiryStore } from "../src/lib/inquiries";
import { markReceptionistRoute } from "../src/lib/voice-receptionist";
import { parentFromCallResource, receiveReceptionistTransfer, receiveReceptionistTransferEnd } from "../src/lib/voice-transfer";
import { receiveReceptionistAction } from "../src/lib/voice-intake";

const parent = "CA" + "a".repeat(32);
const child = "CA" + "b".repeat(32);
const owner = "+12025550124";
const business = "+16103003001";
const caller = "+12025550123";
const attack = "+19995550199";
const callbackSip = "sip:callback.line+247@sip.vapi.ai";
let passed = 0;

type Fault = { match: string; op: "put" | "get"; mode: "throw" | "false"; when?: "present"; times: number };
function memoryStore(fault?: Fault) {
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
    get: async <T>(key: string) => {
      if (fault?.op === "get" && hit(key)) throw new Error("injected_get");
      return (objects.get(key) as T | undefined) ?? null;
    },
    put: async (key, value, upsert = false) => {
      if (fault?.op === "put" && hit(key)) {
        if (fault.mode === "throw") throw new Error("injected_put");
        return false;
      }
      if (objects.has(key) && !upsert) return false;
      objects.set(key, structuredClone(value));
      return true;
    },
    remove: async key => { objects.delete(key); },
    list: async () => [],
  };
  return { objects, store };
}
function signed(path: string, fields: URLSearchParams) {
  let payload = "https://www.get247roi.com" + path;
  for (const key of [...fields.keys()].sort()) payload += key + fields.get(key);
  const signature = createHmac("sha1", "offline-fixture").update(payload).digest("base64");
  return new NextRequest("http://localhost:3647" + path, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", "x-twilio-signature": signature }, body: fields.toString() });
}
function actionRequest(args: unknown, secret?: string, name = "record_receptionist_request", extra?: Record<string, unknown>) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret) headers["x-voice-agent-secret"] = secret;
  const body = { message: { type: "tool-calls", call: { id: "call_real_123" }, ...extra, toolCallList: [{ id: "tool_real_123", function: { name, arguments: args } }] } };
  return new NextRequest("http://localhost:3647/api/voice/receptionist/action", { method: "POST", headers, body: JSON.stringify(body) });
}
function rawAction(payload: unknown, secret = "offline-voice-secret") {
  return new NextRequest("http://localhost:3647/api/voice/receptionist/action", {
    method: "POST",
    headers: { "content-type": "application/json", "x-voice-agent-secret": secret },
    body: JSON.stringify(payload),
  });
}
const secret = "offline-voice-secret";
function indexOf(objects: Map<string, unknown>) {
  const key = [...objects.keys()].find(item => item.startsWith("voice-request-index/"));
  return key ? { key, value: objects.get(key) as { requestId: string; receivedAt: string } } : null;
}
const validArgs = { kind: "urgent", name: "Pat Owner", callbackNumber: caller, summary: "The dispatch board is down and jobs are waiting." };
async function check(name: string, fn: () => Promise<void>) { await fn(); passed++; console.log("PASS", name); }

async function main() {
  const prior = { ...process.env };
  process.env.TWILIO_AUTH_TOKEN = "offline-fixture";
  process.env.TWILIO_PHONE_NUMBER = business;
  process.env.FORWARD_PHONE_NUMBER = owner;
  process.env.VOICE_VAPI_ACTION_SECRET = "offline-voice-secret";
  process.env.CONTACT_TELEGRAM_BOT_TOKEN = "offline-telegram";
  process.env.CONTACT_TELEGRAM_CHAT_ID = "offline-chat";
  delete process.env.VOICE_VAPI_CALLBACK_SIP_URI;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  await check("unsigned transfer is rejected before lookup", async () => {
    const bucket = memoryStore();
    let lookups = 0;
    const req = new NextRequest(`http://localhost:3647/api/voice/receptionist/transfer?parent=${parent}`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ CallSid: child, ReferTransferTarget: attack }).toString() });
    assert.equal((await receiveReceptionistTransfer(req, bucket.store, async () => { lookups++; return { sid: child, parentSid: parent }; })).status, 403);
    assert.equal(lookups, 0);
    assert.equal([...bucket.objects.keys()].length, 0);
  });

  await check("transfer dials only the configured owner and ignores the REFER target", async () => {
    const bucket = memoryStore();
    await markReceptionistRoute(bucket.store, parent, 1700000000000);
    const path = `/api/voice/receptionist/transfer?parent=${parent}`;
    const fields = new URLSearchParams({ CallSid: child, ReferTransferTarget: attack });
    const response = await receiveReceptionistTransfer(signed(path, fields), bucket.store, async () => ({ sid: child, parentSid: parent }));
    const xml = await response.text();
    assert.equal(response.status, 200);
    assert.equal(xml.includes(`<Number>${owner}</Number>`), true);
    assert.match(xml, /timeout="25"/);
    assert.match(xml, /timeLimit="600"/);
    assert.match(xml, /record="do-not-record"/);
    assert.equal(xml.includes(`callerId="${business}"`), true);
    assert.match(xml, /\/api\/voice\/receptionist\/transfer\/end\?parent=/);
    assert.equal(xml.includes("referUrl"), false);
    assert.equal(xml.includes(attack), false);
    assert.equal(parentFromCallResource({ sid: child, parent_call_sid: parent, direction: "outbound-dial" }, child)?.parentSid, parent);
    assert.equal(parentFromCallResource({ sid: child, parent_call_sid: "bad", direction: "outbound-dial" }, child), null);
    const again = await receiveReceptionistTransfer(signed(path, fields), bucket.store, async () => ({ sid: child, parentSid: parent }));
    assert.equal((await again.text()).includes(`<Number>${owner}</Number>`), true);
    assert.equal([...bucket.objects.keys()].filter(key => key.startsWith("voice-transfer/")).length, 1);
  });

  await check("missing or self-loop owner does not dial the requested destination", async () => {
    const bucket = memoryStore();
    await markReceptionistRoute(bucket.store, parent, 1700000000000);
    delete process.env.FORWARD_PHONE_NUMBER;
    process.env.VOICE_VAPI_CALLBACK_SIP_URI = callbackSip;
    const path = `/api/voice/receptionist/transfer?parent=${parent}`;
    const xml = await (await receiveReceptionistTransfer(signed(path, new URLSearchParams({ CallSid: parent, ReferTransferTarget: `sip:${attack}@evil.example` })), bucket.store, async () => ({ sid: parent, parentSid: parent }))).text();
    assert.equal(xml.includes(attack), false);
    assert.equal(xml.includes("<Number"), false);
    assert.equal(xml.includes("referUrl"), false);
    assert.equal(xml.includes('length="20"'), false);
    assert.equal(xml.includes(`<Sip>${callbackSip}</Sip>`), true);
    delete process.env.VOICE_VAPI_CALLBACK_SIP_URI;
    process.env.FORWARD_PHONE_NUMBER = business;
    const email = await (await receiveReceptionistTransfer(signed(path, new URLSearchParams({ CallSid: parent, ReferTransferTarget: attack })), bucket.store, async () => ({ sid: parent, parentSid: parent }))).text();
    assert.equal(email.includes(attack), false);
    assert.equal(email.includes("<Number"), false);
    assert.match(email, /brendan@get247roi\.com/);
    assert.match(email, /does not promise a return call/);
    assert.match(email, /dial 911/);
    process.env.FORWARD_PHONE_NUMBER = owner;
  });

  await check("answered owner leg sends no missed-call text; failed leg uses callback SIP once", async () => {
    const bucket = memoryStore();
    await markReceptionistRoute(bucket.store, parent, 1700000000000);
    await bucket.store.put(`voice-calls/${parent}.json`, { sid: parent, caller, startedAt: 1700000000000 });
    let sends = 0;
    const deps = { store: bucket.store, delayMs: 0, lookup: async () => null, send: async () => { sends++; return { ok: true, sid: "SMfixture" }; } };
    const endPath = `/api/voice/receptionist/transfer/end?parent=${parent}`;
    const answered = await receiveReceptionistTransferEnd(signed(endPath, new URLSearchParams({ CallSid: parent, DialCallStatus: "completed" })), bucket.store);
    assert.match(await answered.text(), /<Hangup\/>/);
    await handleVoiceEvent({ kind: "parent", parent, status: "completed", answeredBy: "", timestamp: 1700000005000, providerDuration: 0 }, deps);
    assert.equal(sends, 0);
    process.env.VOICE_VAPI_CALLBACK_SIP_URI = callbackSip;
    const failed = await receiveReceptionistTransferEnd(signed(endPath, new URLSearchParams({ CallSid: parent, DialCallStatus: "no-answer" })), bucket.store);
    const xml = await failed.text();
    assert.match(xml, /cannot reach Brendan/);
    assert.equal(xml.includes(`<Sip>${callbackSip}</Sip>`), true);
    assert.equal(xml.includes("referUrl"), false);
    assert.equal(xml.includes('length="20"'), false);
    assert.equal(xml.includes("<Number"), false);
    await handleVoiceEvent({ kind: "parent", parent, status: "completed", answeredBy: "", timestamp: 1700000008000, providerDuration: 0 }, deps);
    assert.equal(sends, 0);
    delete process.env.VOICE_VAPI_CALLBACK_SIP_URI;
  });

  await check("action secret is required and schema failures do not notify", async () => {
    const bucket = memoryStore();
    let sends = 0;
    const send: typeof fetch = async () => { sends++; return Response.json({ ok: true, result: { message_id: 9 } }); };
    delete process.env.VOICE_VAPI_ACTION_SECRET;
    assert.equal((await receiveReceptionistAction(actionRequest(validArgs, "offline-voice-secret"), bucket.store, send)).status, 403);
    process.env.VOICE_VAPI_ACTION_SECRET = "offline-voice-secret";
    assert.equal((await receiveReceptionistAction(actionRequest(validArgs), bucket.store, send)).status, 403);
    assert.equal((await receiveReceptionistAction(actionRequest(validArgs, "wrong-secret"), bucket.store, send)).status, 403);
    const bad = await receiveReceptionistAction(actionRequest({ ...validArgs, kind: "demo", destination: attack }, "offline-voice-secret"), bucket.store, send);
    const badBody = await bad.json() as { results: { result: string }[] };
    assert.equal(JSON.parse(badBody.results[0].result).ok, false);
    assert.equal(sends, 0);
    assert.equal([...bucket.objects.keys()].some(key => key.startsWith("submissions/") || key.startsWith("voice-requests/")), false);
  });

  await check("urgent intake notifies once and a failed notification is not called delivered", async () => {
    const bucket = memoryStore();
    let sends = 0;
    const send: typeof fetch = async (url) => {
      sends++;
      assert.match(String(url), /api\.telegram\.org/);
      assert.equal(String(url).includes("Messages.json"), false);
      return Response.json({ ok: false }, { status: 500 });
    };
    const first = await receiveReceptionistAction(actionRequest(validArgs, "offline-voice-secret"), bucket.store, send);
    const body = await first.json() as { results: { toolCallId: string; result: string }[] };
    const parsed = JSON.parse(body.results[0].result) as { ok: boolean; requestId: string; notificationStatus: string; humanCallbackPromised: boolean };
    assert.equal(parsed.ok, true);
    assert.equal(parsed.notificationStatus, "pending");
    assert.equal(parsed.humanCallbackPromised, false);
    assert.equal(body.result && (body as { result?: string }).result, undefined);
    assert.notEqual(parsed.notificationStatus, "delivered");
    const saved = bucket.objects.get(`voice-requests/${parsed.requestId}.json`) as { kind: string; email: string };
    assert.equal(saved.kind, "urgent");
    assert.equal(saved.email, "");
    assert.equal(bucket.objects.has(`submissions/${parsed.requestId}.json`), true);
    const second = await receiveReceptionistAction(actionRequest(validArgs, "offline-voice-secret"), bucket.store, send);
    const again = JSON.parse(((await second.json()) as { results: { result: string }[] }).results[0].result) as { requestId: string; notificationStatus: string };
    assert.equal(again.requestId, parsed.requestId);
    assert.equal(again.notificationStatus, "pending");
    assert.equal(sends, 2);
    assert.equal(bucket.objects.has(`receipts/${parsed.requestId}.json`), false);
    assert.equal((bucket.objects.get(`voice-requests/${parsed.requestId}.json`) as { email: string }).email, "");
    assert.equal((bucket.objects.get(`submissions/${parsed.requestId}.json`) as { receivedAt: string }).receivedAt, (bucket.objects.get(`voice-requests/${parsed.requestId}.json`) as { receivedAt: string }).receivedAt);
  });

  await check("accepted owner notification is recorded only after readback", async () => {
    const bucket = memoryStore();
    const send: typeof fetch = async () => Response.json({ ok: true, result: { message_id: 11 } });
    const response = await receiveReceptionistAction(actionRequest({ ...validArgs, kind: "general", email: "pat@example.com" }, "offline-voice-secret", "record_receptionist_request"), bucket.store, send);
    const parsed = JSON.parse(((await response.json()) as { results: { result: string }[] }).results[0].result) as { ok: boolean; notificationStatus: string; requestId: string };
    assert.equal(parsed.ok, true);
    assert.equal(parsed.notificationStatus, "notified");
    assert.equal((bucket.objects.get(`receipts/${parsed.requestId}.json`) as { messageId: number }).messageId, 11);
    assert.equal(randomUUID.length > 0, true);
  });

  await check("changed arguments for the same tool id are rejected", async () => {
    const bucket = memoryStore();
    let sends = 0;
    const send: typeof fetch = async () => { sends++; return Response.json({ ok: true, result: { message_id: 4 } }); };
    const first = await receiveReceptionistAction(actionRequest(validArgs, secret), bucket.store, send);
    const saved = JSON.parse(((await first.json()) as { results: { result: string }[] }).results[0].result) as { requestId: string };
    const original = bucket.objects.get(`voice-requests/${saved.requestId}.json`);
    const conflict = await receiveReceptionistAction(actionRequest({ ...validArgs, email: "pat@example.com" }, secret), bucket.store, send);
    assert.equal(conflict.status, 409);
    assert.equal(((await conflict.json()) as { ok: boolean }).ok, false);
    assert.equal(bucket.objects.get(`voice-requests/${saved.requestId}.json`), original);
    assert.equal((bucket.objects.get(`voice-requests/${saved.requestId}.json`) as { email: string }).email, "");
    assert.equal(sends, 1);
  });

  await check("malformed authenticated envelopes return 400", async () => {
    const bucket = memoryStore();
    const send: typeof fetch = async () => { throw new Error("must_not_notify"); };
    const base = { message: { type: "tool-calls", call: { id: "call_real_123" }, toolCallList: [{ id: "tool_real_123", function: { name: "record_receptionist_request", arguments: validArgs } }] } };
    const cases = [
      { message: { ...base.message, call: { id: 15 } } },
      { message: { ...base.message, call: { id: "call_real_123" }, toolCallList: [null] } },
      { message: { ...base.message, toolCallList: ["tool_real_123"] } },
      { message: { ...base.message, toolCallList: [{ id: 15, function: { name: "record_receptionist_request", arguments: validArgs } }] } },
      { message: { type: "tool-calls", call: null, toolCallList: [{ id: "tool_real_123" }] } },
    ];
    for (const payload of cases) {
      const response = await receiveReceptionistAction(rawAction(payload), bucket.store, send);
      assert.equal(response.status, 400);
      assert.notEqual(response.status, 500);
    }
    assert.equal([...bucket.objects.keys()].length, 0);
  });

  await check("long Vapi context is accepted and bodies over 256KB are rejected", async () => {
    const bucket = memoryStore();
    let sends = 0;
    const send: typeof fetch = async () => { sends++; return Response.json({ ok: true, result: { message_id: 8 } }); };
    const marker = "CTX" + "m".repeat(20_000);
    const accepted = await receiveReceptionistAction(actionRequest(validArgs, secret, "record_receptionist_request", { artifact: marker, messages: [{ role: "assistant", content: marker }] }), bucket.store, send);
    assert.equal(accepted.status, 200);
    assert.equal(Buffer.byteLength(JSON.stringify({ artifact: marker })) > 16_000, true);
    const stored = JSON.stringify([...bucket.objects.values()]);
    assert.equal(stored.includes(marker.slice(0, 24)), false);
    assert.equal(stored.includes("artifact"), false);
    const huge = "Z".repeat((256 * 1024) + 1);
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(JSON.stringify({ message: { pad: huge } }))); controller.close(); } });
    const oversized = new NextRequest("http://localhost:3647/api/voice/receptionist/action", { method: "POST", headers: { "content-type": "application/json", "x-voice-agent-secret": secret }, body: stream, duplex: "half" });
    assert.equal((await receiveReceptionistAction(oversized, bucket.store, send)).status, 413);
    const declared = new NextRequest("http://localhost:3647/api/voice/receptionist/action", { method: "POST", headers: { "content-type": "application/json", "x-voice-agent-secret": secret, "content-length": String((256 * 1024) + 1) }, body: "{}" });
    assert.equal((await receiveReceptionistAction(declared, bucket.store, send)).status, 413);
    assert.equal(sends, 1);
  });

  async function recover(name: string, fault: Fault, afterFault: (objects: Map<string, unknown>) => void) {
    await check(name, async () => {
      const bucket = memoryStore(fault);
      let sends = 0;
      const send: typeof fetch = async () => { sends++; return Response.json({ ok: true, result: { message_id: 21 } }); };
      const failed = await receiveReceptionistAction(actionRequest(validArgs, secret), bucket.store, send);
      assert.equal(failed.status, 503);
      assert.equal(((await failed.json()) as { ok: boolean }).ok, false);
      assert.equal(sends, 0);
      afterFault(bucket.objects);
      const reserved = indexOf(bucket.objects);
      const retry = await receiveReceptionistAction(actionRequest(validArgs, secret), bucket.store, send);
      const body = JSON.parse(((await retry.json()) as { results: { result: string }[] }).results[0].result) as { ok: boolean; requestId: string; notificationStatus: string };
      assert.equal(retry.status, 200);
      assert.equal(body.ok, true);
      assert.equal(body.notificationStatus, "notified");
      assert.equal(sends, 1);
      const voice = bucket.objects.get(`voice-requests/${body.requestId}.json`) as { requestId: string; receivedAt: string; summary: string };
      const submission = bucket.objects.get(`submissions/${body.requestId}.json`) as { submissionId: string; receivedAt: string; message: string };
      assert.equal(voice.requestId, body.requestId);
      assert.equal(submission.submissionId, body.requestId);
      assert.equal(submission.receivedAt, voice.receivedAt);
      assert.equal(submission.message.includes(validArgs.summary), true);
      if (reserved) {
        assert.equal(body.requestId, reserved.value.requestId);
        assert.equal(voice.receivedAt, reserved.value.receivedAt);
      }
      assert.equal((bucket.objects.get(`receipts/${body.requestId}.json`) as { messageId: number }).messageId, 21);
      const third = await receiveReceptionistAction(actionRequest(validArgs, secret), bucket.store, send);
      assert.equal(JSON.parse(((await third.json()) as { results: { result: string }[] }).results[0].result).requestId, body.requestId);
      assert.equal(sends, 1);
    });
  }
  await recover("index write failure is not treated as saved and retry completes", { match: "voice-request-index/", op: "put", mode: "false", times: 1 }, objects => {
    assert.equal([...objects.keys()].length, 0);
  });
  await recover("voice record write failure retries under the reserved id", { match: "voice-requests/", op: "put", mode: "throw", times: 1 }, objects => {
    assert.equal([...objects.keys()].some(key => key.startsWith("voice-requests/")), false);
    assert.equal([...objects.keys()].some(key => key.startsWith("submissions/")), false);
    assert.ok(indexOf(objects));
  });
  await recover("submission write failure retries without a second notification claim", { match: "submissions/", op: "put", mode: "throw", times: 1 }, objects => {
    const reserved = indexOf(objects);
    assert.ok(reserved);
    assert.equal(objects.has(`voice-requests/${reserved.value.requestId}.json`), true);
    assert.equal(objects.has(`submissions/${reserved.value.requestId}.json`), false);
    assert.equal((objects.get(`voice-requests/${reserved.value.requestId}.json`) as { receivedAt: string }).receivedAt, reserved.value.receivedAt);
  });
  await recover("readback failure is not acknowledged", { match: "voice-requests/", op: "get", mode: "throw", when: "present", times: 1 }, objects => {
    const reserved = indexOf(objects);
    assert.ok(reserved);
    assert.equal(objects.has(`voice-requests/${reserved.value.requestId}.json`), true);
    assert.equal(objects.has(`submissions/${reserved.value.requestId}.json`), false);
  });

  await check("notification failure stays pending and the same tool id recovers once", async () => {
    const bucket = memoryStore();
    let sends = 0;
    const send: typeof fetch = async () => {
      sends++;
      if (sends === 1) return Response.json({ ok: false }, { status: 500 });
      return Response.json({ ok: true, result: { message_id: 31 } });
    };
    const first = await receiveReceptionistAction(actionRequest(validArgs, secret), bucket.store, send);
    const pending = JSON.parse(((await first.json()) as { results: { result: string }[] }).results[0].result) as { ok: boolean; requestId: string; notificationStatus: string };
    assert.equal(pending.ok, true);
    assert.equal(pending.notificationStatus, "pending");
    assert.notEqual(pending.notificationStatus, "delivered");
    assert.equal(bucket.objects.has(`submissions/${pending.requestId}.json`), true);
    assert.equal(bucket.objects.has(`receipts/${pending.requestId}.json`), false);
    const stamp = (bucket.objects.get(`voice-requests/${pending.requestId}.json`) as { receivedAt: string }).receivedAt;
    const second = await receiveReceptionistAction(actionRequest(validArgs, secret), bucket.store, send);
    const recovered = JSON.parse(((await second.json()) as { results: { result: string }[] }).results[0].result) as { requestId: string; notificationStatus: string };
    assert.equal(recovered.requestId, pending.requestId);
    assert.equal(recovered.notificationStatus, "notified");
    assert.equal((bucket.objects.get(`voice-requests/${pending.requestId}.json`) as { receivedAt: string }).receivedAt, stamp);
    assert.equal(sends, 2);
    const third = await receiveReceptionistAction(actionRequest(validArgs, secret), bucket.store, send);
    assert.equal(JSON.parse(((await third.json()) as { results: { result: string }[] }).results[0].result).notificationStatus, "notified");
    assert.equal(sends, 2);
  });

  await check("an unrelated voice record is not overwritten", async () => {
    const bucket = memoryStore({ match: "voice-requests/", op: "put", mode: "throw", times: 1 });
    let sends = 0;
    const send: typeof fetch = async () => { sends++; return Response.json({ ok: true, result: { message_id: 41 } }); };
    assert.equal((await receiveReceptionistAction(actionRequest(validArgs, secret), bucket.store, send)).status, 503);
    const reserved = indexOf(bucket.objects);
    assert.ok(reserved);
    const unrelated = { requestId: reserved.value.requestId, fingerprint: "unrelated", summary: "do not replace" };
    bucket.objects.set(`voice-requests/${reserved.value.requestId}.json`, unrelated);
    const retry = await receiveReceptionistAction(actionRequest(validArgs, secret), bucket.store, send);
    assert.equal(retry.status, 409);
    assert.equal(bucket.objects.get(`voice-requests/${reserved.value.requestId}.json`), unrelated);
    assert.equal(bucket.objects.has(`submissions/${reserved.value.requestId}.json`), false);
    assert.equal(sends, 0);
  });

  await check("a legacy index is left unchanged when the voice record already exists", async () => {
    const bucket = memoryStore();
    const requestId = "11111111-1111-4111-8111-111111111111";
    const parsed = { kind: "urgent" as const, name: validArgs.name, callbackNumber: validArgs.callbackNumber, email: "", summary: validArgs.summary };
    const fingerprint = createHash("sha256").update(JSON.stringify({ ...parsed, call: "call_real_123", tool: "tool_real_123" })).digest("hex");
    const receivedAt = "2026-10-09T18:00:00.000Z";
    const indexKey = "voice-request-index/call_real_123/tool_real_123.json";
    bucket.objects.set(indexKey, { requestId });
    bucket.objects.set(`voice-requests/${requestId}.json`, { requestId, vapiCallId: "call_real_123", toolCallId: "tool_real_123", ...parsed, receivedAt, fingerprint });
    bucket.objects.set(`submissions/${requestId}.json`, { submissionId: requestId, name: parsed.name, phone: parsed.callbackNumber, email: "", message: `[urgent] ${parsed.summary}`, smsConsent: false, reviewConsent: false, topic: "ai-receptionist", source: "/voice/receptionist", campaign: "voice-urgent", receivedAt, fingerprint, ipHash: "voice-receptionist", consentVersion: "contact-2026-10" });
    bucket.objects.set(`receipts/${requestId}.json`, { notifiedAt: receivedAt, messageId: 77, channel: "telegram" });
    let sends = 0;
    const send: typeof fetch = async () => { sends++; return Response.json({ ok: true, result: { message_id: 78 } }); };
    const response = await receiveReceptionistAction(actionRequest(validArgs, secret), bucket.store, send);
    const body = JSON.parse(((await response.json()) as { results: { result: string }[] }).results[0].result) as { requestId: string; notificationStatus: string };
    assert.equal(body.requestId, requestId);
    assert.equal(body.notificationStatus, "notified");
    assert.deepEqual(bucket.objects.get(indexKey), { requestId });
    assert.equal((bucket.objects.get(`voice-requests/${requestId}.json`) as { receivedAt: string }).receivedAt, receivedAt);
    assert.equal(sends, 0);
  });

  for (const key of ["TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER", "FORWARD_PHONE_NUMBER", "VOICE_VAPI_ACTION_SECRET", "VOICE_VAPI_CALLBACK_SIP_URI", "CONTACT_TELEGRAM_BOT_TOKEN", "CONTACT_TELEGRAM_CHAT_ID", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (prior[key] === undefined) delete process.env[key]; else process.env[key] = prior[key];
  }
  console.log(JSON.stringify({ passed, actualTransfer: 0, actualSmsSent: 0, demoToolConfiguredHere: false }));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
