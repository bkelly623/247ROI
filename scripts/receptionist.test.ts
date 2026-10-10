import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { dialXml, handleVoiceEvent, MIN_ABANDONED_RING_MS, type VoiceEvent } from "../src/lib/missed-calls";
import { type InquiryStore } from "../src/lib/inquiries";
import { escapeXml, lookupTwilioParentCall, markReceptionistRoute, receiveReceptionistCallback, receiveReceptionistParent, receptionistTwiml, validVapiSipUri, validateParentCall, type ParentCallEvidence } from "../src/lib/voice-receptionist";
import { inboundVoice } from "../src/lib/voice-inbound";
import { POST as receptionistInbound } from "../src/app/api/voice/receptionist/route";
import { POST as receptionistEvents } from "../src/app/api/voice/receptionist/events/route";
import { POST as receptionistEnd } from "../src/app/api/voice/receptionist/end/route";
import { POST as receptionistParent } from "../src/app/api/voice/receptionist/parent/route";

const id = "CA" + "a".repeat(32);
const start = 1700000000000;
const sip = "sip:demo.line+247@sip.vapi.ai";
const forward = "+12025550124";
let passed = 0;

function memoryStore() {
  const objects = new Map<string, unknown>();
  let writes = 0;
  const store: InquiryStore = {
    ensure: async () => undefined,
    get: async <T>(key: string) => (objects.get(key) as T | undefined) ?? null,
    put: async (key, value, upsert = false) => { writes++; if (objects.has(key) && !upsert) return false; objects.set(key, structuredClone(value)); return true; },
    remove: async key => { objects.delete(key); },
    list: async () => [],
  };
  return { objects, store, writes: () => writes };
}

async function marked(sendResult = { ok: true, sid: "SMfixture" } as { ok: boolean; sid?: string; code?: number; uncertain?: boolean }) {
  const bucket = memoryStore();
  await markReceptionistRoute(bucket.store, id, start);
  let sends = 0;
  const deps = {
    store: bucket.store,
    delayMs: 0,
    lookup: async () => null,
    send: async (to: string) => { assert.equal(to, "+12025550123"); sends++; return sendResult; },
  };
  await bucket.store.put(`voice-calls/${id}.json`, { sid: id, caller: "+12025550123", startedAt: start - 60000 });
  const event = (kind: VoiceEvent["kind"], status = "", offset = 10000, answeredBy = "") =>
    handleVoiceEvent({ kind, status, timestamp: start + offset, parent: id, answeredBy }, deps);
  return { ...bucket, deps, event, sends: () => sends };
}

function signed(path: string, fields: URLSearchParams, token = "offline-fixture") {
  let payload = "https://www.get247roi.com" + path;
  for (const key of [...fields.keys()].sort()) payload += key + fields.get(key);
  const signature = createHmac("sha1", token).update(payload).digest("base64");
  return new NextRequest("http://localhost:3647" + path, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-twilio-signature": signature },
    body: fields.toString(),
  });
}

function inboundForm() {
  return new URLSearchParams({ CallSid: id, From: "+12025550123", To: "+16103003001", CallStatus: "ringing" });
}

async function check(name: string, fn: () => Promise<void>) { await fn(); passed++; console.log("PASS", name); }

async function main() {
  const priorEnabled = process.env.VOICE_RECEPTIONIST_ENABLED;
  const priorSip = process.env.VOICE_VAPI_SIP_URI;
  const priorForward = process.env.FORWARD_PHONE_NUMBER;
  const priorToken = process.env.TWILIO_AUTH_TOKEN;
  process.env.TWILIO_AUTH_TOKEN = "offline-fixture";
  process.env.FORWARD_PHONE_NUMBER = forward;
  delete process.env.VOICE_RECEPTIONIST_ENABLED;
  delete process.env.VOICE_VAPI_SIP_URI;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SECRET_KEY;
  delete process.env.SUPABASE_SERVICE_KEY;

  await check("default-off inbound and receptionist routes preserve forwarding TwiML", async () => {
    const bucket = memoryStore();
    const req = signed("/api/voice/inbound", inboundForm());
    const legacy = await inboundVoice(req, bucket.store);
    assert.equal(legacy.status, 200);
    assert.equal(await legacy.text(), dialXml(forward, id));
    assert.equal(bucket.objects.has(`voice-route/${id}.json`), false);
    const again = signed("/api/voice/receptionist", inboundForm());
    const fallback = await receptionistInbound(again);
    assert.equal(fallback.status, 200);
    assert.equal(await fallback.text(), dialXml(forward, id));
    assert.equal(MIN_ABANDONED_RING_MS, 2000);
  });

  await check("missing SIP config falls back to forwarding and does not drop the call", async () => {
    process.env.VOICE_RECEPTIONIST_ENABLED = "true";
    process.env.VOICE_VAPI_SIP_URI = "sip:not-vapi@example.com";
    const response = await inboundVoice(signed("/api/voice/inbound", inboundForm()), memoryStore().store);
    assert.equal(await response.text(), dialXml(forward, id));
    delete process.env.VOICE_RECEPTIONIST_ENABLED;
    delete process.env.VOICE_VAPI_SIP_URI;
  });

  await check("Pause is the first verb, then bridged SIP dial", async () => {
    process.env.VOICE_RECEPTIONIST_ENABLED = "true";
    process.env.VOICE_VAPI_SIP_URI = sip;
    const bucket = memoryStore();
    const response = await inboundVoice(signed("/api/voice/inbound", inboundForm()), bucket.store);
    const xml = await response.text();
    assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?><Response><Pause length="20"\/><Dial answerOnBridge="true" /);
    assert.ok(xml.indexOf("<Pause") < xml.indexOf("<Dial"));
    assert.equal(xml.includes("<Number"), false);
    assert.equal(xml.includes("<Say"), false);
    assert.match(xml, /statusCallbackEvent="initiated ringing answered completed"/);
    assert.match(xml, /answerOnBridge="true"/);
    assert.match(xml, /timeLimit="600"/);
    assert.match(xml, /<Dial [^>]*referMethod="POST"/);
    assert.match(xml, /referUrl="https:\/\/www\.get247roi\.com\/api\/voice\/receptionist\/transfer\?parent=CA/);
    assert.equal(xml.slice(xml.indexOf("<Sip")).includes("referUrl"), false);
    const marker = bucket.objects.get(`voice-route/${id}.json`) as { route: string; receptionStart: number };
    assert.equal(marker.route, "receptionist");
    assert.equal(Number.isFinite(marker.receptionStart), true);
    assert.equal(bucket.objects.has(`voice-sip-connected/${id}.json`), false);
    const dedicated = await receptionistInbound(signed("/api/voice/receptionist", inboundForm()));
    assert.equal(await dedicated.text(), dialXml(forward, id));
    delete process.env.VOICE_RECEPTIONIST_ENABLED;
    delete process.env.VOICE_VAPI_SIP_URI;
  });

  await check("SIP URI is restricted to sip.vapi.ai and XML-escaped", async () => {
    assert.equal(escapeXml(`&<>"'`), "&amp;&lt;&gt;&quot;&apos;");
    assert.equal(validVapiSipUri(sip), true);
    const xml = receptionistTwiml(sip, id);
    assert.equal(xml.includes(sip), true);
    assert.equal(/&(?!amp;|lt;|gt;|quot;|apos;)/.test(xml), false);
    for (const bad of [
      `sip:demo@sip.vapi.ai"><Say>no</Say>`,
      "sip:demo&notify=1@sip.vapi.ai",
      "sip:user:secret@sip.vapi.ai",
      "sip:demo@sip.vapi.ai\r\nX-Injected: 1",
      "sip:demo@evil.example",
      "sip:demo@sip.vapi.ai.evil.com",
      "sip:demo@SIP.vapi.ai",
      "",
    ]) {
      assert.equal(validVapiSipUri(bad), false);
      assert.throws(() => receptionistTwiml(bad, id));
    }
  });

  await check("unsigned receptionist callbacks do not write", async () => {
    const bucket = memoryStore();
    const headers = { "content-type": "application/x-www-form-urlencoded" };
    const body = new URLSearchParams({ CallSid: id, CallStatus: "completed", Timestamp: "Thu, 01 Jan 2026 00:00:00 +0000" }).toString();
    const inbound = new NextRequest("http://localhost:3647/api/voice/inbound", { method: "POST", headers, body });
    assert.equal((await inboundVoice(inbound, bucket.store)).status, 403);
    const events = new NextRequest(`http://localhost:3647/api/voice/receptionist/events?parent=${id}`, { method: "POST", headers, body });
    const end = new NextRequest("http://localhost:3647/api/voice/receptionist/end", { method: "POST", headers, body });
    let lookups = 0;
    assert.equal((await receiveReceptionistCallback(events, "sip", bucket.store)).status, 403);
    assert.equal((await receiveReceptionistCallback(end, "dial", bucket.store)).status, 403);
    const parent = new NextRequest("http://localhost:3647/api/voice/receptionist/parent", { method: "POST", headers, body });
    assert.equal((await receiveReceptionistParent(parent, bucket.store, async () => { lookups++; return null; })).status, 403);
    assert.equal((await receptionistEvents(events)).status, 403);
    assert.equal((await receptionistEnd(end)).status, 403);
    assert.equal((await receptionistParent(parent)).status, 403);
    assert.equal(lookups, 0);
    assert.equal(bucket.writes(), 0);
  });

  await check("caller hangup before pickup still qualifies and does not invent a child leg", async () => {
    const f = await marked();
    await f.event("parent", "ringing", 1000);
    assert.equal(await f.event("parent", "completed", 8000), "sent");
    assert.equal(f.sends(), 1);
    assert.equal(f.objects.has(`voice-ringing/${id}.json`), false);
    assert.equal(f.objects.has(`voice-end/${id}.json`), false);
    assert.equal(f.objects.has(`voice-connected/${id}.json`), false);
  });

  await check("SIP no-answer after the minimum ring is eligible; shorter abandon is not", async () => {
    const answered = await marked();
    await answered.event("sip", "ringing", 1000);
    assert.equal(await answered.event("sip", "no-answer", 8000), "sent");
    const abandoned = await marked();
    await abandoned.event("sip", "canceled", 2000);
    await abandoned.event("sip", "ringing", 1000);
    assert.equal(abandoned.sends(), 0);
    const parentShort = await marked();
    await parentShort.event("parent", "ringing", 10000);
    await handleVoiceEvent({ kind: "parent", parent: id, status: "completed", answeredBy: "", timestamp: start + 11000, providerDuration: 0 }, parentShort.deps);
    assert.equal(parentShort.sends(), 0);
  });

  await check("authoritative SIP answer suppresses a later parent completion", async () => {
    const f = await marked();
    await f.event("sip", "initiated", 1000);
    assert.equal(await f.event("sip", "in-progress", 5000), "ai_answered_no_text");
    assert.equal(await f.event("parent", "completed", 90000), "ai_answered_no_text");
    assert.equal(f.sends(), 0);
    const named = await marked();
    assert.equal(await named.event("sip", "answered", 5000), "ai_answered_no_text");
    assert.equal(await named.event("parent", "completed", 90000), "ai_answered_no_text");
    assert.equal(named.sends(), 0);
  });

  await check("parent completion does not text when SIP answers before send", async () => {
    const f = await marked();
    let now = start + 8000;
    const deps = { ...f.deps, delayMs: 10000, now: () => now };
    const parent = (status: string, offset: number): VoiceEvent => ({ kind: "parent", parent: id, status, answeredBy: "", timestamp: start + offset });
    assert.equal(await handleVoiceEvent(parent("ringing", 1000), deps), "waiting_or_short_call");
    assert.equal(await handleVoiceEvent(parent("completed", 8000), deps), "scheduled");
    assert.equal(f.sends(), 0);
    assert.equal(await handleVoiceEvent({ kind: "sip", parent: id, status: "answered", answeredBy: "", timestamp: start + 9000 }, deps), "ai_answered_no_text");
    now += 20000;
    assert.equal(await handleVoiceEvent(parent("completed", 8000), deps), "ai_answered_no_text");
    assert.equal(f.sends(), 0);
  });

  await check("duplicate parent callbacks claim one missed-call send", async () => {
    const f = await marked();
    await f.event("parent", "ringing", 1000);
    await Promise.all(Array.from({ length: 30 }, () => f.event("parent", "completed", 8000)));
    assert.equal(f.sends(), 1);
    assert.equal(f.objects.has(`voice-claims/${id}.json`), true);
  });

  await check("completed SIP leg without an answer is fail-closed", async () => {
    const f = await marked();
    await f.event("parent", "ringing", 1000);
    await f.event("sip", "ringing", 21000);
    assert.equal(await f.event("sip", "completed", 40000), "uncertain_no_text");
    assert.equal(f.sends(), 0);
    assert.equal(f.objects.has(`voice-claims/${id}.json`), false);
  });

  await check("dial end converges and is not itself a SIP answer", async () => {
    const missed = await marked();
    await missed.event("sip", "ringing", 1000);
    assert.equal(await missed.event("dial", "no-answer", 8000), "sent");
    const bridged = await marked();
    await bridged.event("sip", "ringing", 1000);
    assert.equal(await bridged.event("dial", "completed", 40000), "uncertain_no_text");
    assert.equal(bridged.sends(), 0);
    assert.equal(bridged.objects.has(`voice-sip-connected/${id}.json`), false);
  });

  await check("receptionist opt-out and definite rejection keep the existing claim rules", async () => {
    const opted = await marked({ ok: false, code: 21610 });
    await opted.event("parent", "ringing", 1000);
    await opted.event("parent", "completed", 8000);
    await opted.event("parent", "completed", 8000);
    assert.equal(opted.sends(), 1);
    const rejected = await marked({ ok: false, code: 20429 });
    await rejected.event("parent", "ringing", 1000);
    await assert.rejects(() => rejected.event("parent", "completed", 8000), /rejected/);
    assert.equal(rejected.objects.has(`voice-claims/${id}.json`), false);
  });

  await check("unmarked forwarding parent completion still does not send", async () => {
    const bucket = memoryStore();
    let sends = 0;
    const deps = { store: bucket.store, delayMs: 0, lookup: async () => ({ sid: id, caller: "+12025550123", startedAt: start }), send: async () => { sends++; return { ok: true, sid: "SM" }; } };
    await handleVoiceEvent({ kind: "parent", parent: id, status: "ringing", answeredBy: "", timestamp: start + 1000 }, deps);
    await handleVoiceEvent({ kind: "parent", parent: id, status: "completed", answeredBy: "", timestamp: start + 8000 }, deps);
    assert.equal(sends, 0);
    assert.equal(bucket.objects.has(`voice-route/${id}.json`), false);
  });

  await check("signed SIP callback is queued for the existing retry worker", async () => {
    const bucket = memoryStore();
    await markReceptionistRoute(bucket.store, id, start);
    const path = `/api/voice/receptionist/events?parent=${id}&kind=sip`;
    const fields = new URLSearchParams({ CallSid: "CA" + "b".repeat(32), CallStatus: "ringing", Timestamp: "Thu, 14 Nov 2024 22:13:20 +0000" });
    const response = await receiveReceptionistCallback(signed(path, fields), "sip", bucket.store);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /<Response\/>/);
    const jobs = [...bucket.objects.keys()].filter(key => key.startsWith("voice-jobs/"));
    assert.equal(jobs.length, 1);
    const saved = bucket.objects.get(jobs[0]) as VoiceEvent;
    assert.equal(saved.kind, "sip");
    assert.equal(saved.status, "ringing");
    assert.equal(saved.parent, id);
    const endFields = new URLSearchParams({ CallSid: id, DialCallStatus: "no-answer", Timestamp: "Thu, 14 Nov 2024 22:13:40 +0000" });
    const endResponse = await receiveReceptionistCallback(signed("/api/voice/receptionist/end", endFields), "dial", bucket.store);
    assert.equal(endResponse.status, 200);
    assert.match(await endResponse.text(), /<Hangup\/>/);
  });

  const business = "+16103003001";
  const endHeader = "Thu, 14 Nov 2024 22:13:25 +0000";
  const endAt = Date.parse(endHeader);
  function completionFields(duration = "0") {
    return new URLSearchParams({ CallSid: id, CallStatus: "completed", From: "+12025550123", To: business, Direction: "inbound", CallDuration: duration });
  }
  function evidence(durationSec: number, patch: Partial<ParentCallEvidence> = {}): ParentCallEvidence {
    return { sid: id, status: "completed", endTime: endAt, durationSec, from: "+12025550123", to: business, ...patch };
  }

  await check("completion-only parent callback uses lookup end_time against local reception start", async () => {
    const long = memoryStore();
    await markReceptionistRoute(long.store, id, endAt - 5000);
    await long.store.put(`voice-calls/${id}.json`, { sid: id, caller: "+12025550123", startedAt: endAt - 5000 });
    let now = endAt;
    let sends = 0;
    const deps = { store: long.store, delayMs: 10000, now: () => now, lookup: async () => null, send: async (to: string) => { assert.equal(to, "+12025550123"); sends++; return { ok: true, sid: "SMfixture" }; } };
    const response = await receiveReceptionistParent(signed("/api/voice/receptionist/parent", completionFields()), long.store, async () => evidence(0));
    assert.equal(response.status, 200);
    const jobKey = [...long.objects.keys()].find(key => key.startsWith("voice-jobs/"));
    assert.ok(jobKey);
    const saved = long.objects.get(jobKey) as VoiceEvent;
    assert.equal(saved.timestamp, endAt);
    assert.ok(Math.abs(saved.timestamp - Date.now()) > 60000);
    assert.equal(saved.providerDuration, 0);
    assert.equal(long.objects.has(`voice-parent-ringing/${id}.json`), false);
    assert.equal(long.objects.has(`voice-ringing/${id}.json`), false);
    const { processVoiceJob } = await import("../src/lib/voice-jobs");
    const job = jobKey.slice("voice-jobs/".length).replace(/\.json$/, "");
    assert.equal(await processVoiceJob(job, long.store, event => handleVoiceEvent(event, deps)), "scheduled");
    assert.equal(sends, 0);
    now += 10000;
    await processVoiceJob(job, long.store, event => handleVoiceEvent(event, deps));
    assert.equal(sends, 1);
    await receiveReceptionistParent(signed("/api/voice/receptionist/parent", completionFields()), long.store, async () => evidence(0));
    const again = [...long.objects.keys()].find(key => key.startsWith("voice-jobs/"));
    if (again) await processVoiceJob(again.slice("voice-jobs/".length).replace(/\.json$/, ""), long.store, event => handleVoiceEvent(event, deps));
    assert.equal(sends, 1);

    const brief = memoryStore();
    await markReceptionistRoute(brief.store, id, endAt - 1500);
    await brief.store.put(`voice-calls/${id}.json`, { sid: id, caller: "+12025550123", startedAt: endAt - 1500 });
    let briefSends = 0;
    const briefDeps = { store: brief.store, delayMs: 0, lookup: async () => null, send: async () => { briefSends++; return { ok: true, sid: "SMfixture" }; } };
    assert.equal((await receiveReceptionistParent(signed("/api/voice/receptionist/parent", completionFields()), brief.store, async () => evidence(0))).status, 200);
    const briefJob = [...brief.objects.keys()].find(key => key.startsWith("voice-jobs/"));
    assert.ok(briefJob);
    await processVoiceJob(briefJob.slice("voice-jobs/".length).replace(/\.json$/, ""), brief.store, event => handleVoiceEvent(event, briefDeps));
    assert.equal(briefSends, 0);
    assert.equal(brief.objects.has(`voice-schedule/${id}.json`), false);
    assert.equal(brief.objects.has(`voice-parent-ringing/${id}.json`), false);
  });

  await check("positive provider duration suppresses missed-call text without a SIP answer callback", async () => {
    const bucket = memoryStore();
    await markReceptionistRoute(bucket.store, id, endAt - 20000);
    await bucket.store.put(`voice-calls/${id}.json`, { sid: id, caller: "+12025550123", startedAt: endAt - 20000 });
    let sends = 0;
    const deps = { store: bucket.store, delayMs: 0, lookup: async () => null, send: async () => { sends++; return { ok: true, sid: "SMfixture" }; } };
    assert.equal((await receiveReceptionistParent(signed("/api/voice/receptionist/parent", completionFields("8")), bucket.store, async () => evidence(8))).status, 200);
    const { processVoiceJob } = await import("../src/lib/voice-jobs");
    const jobKey = [...bucket.objects.keys()].find(key => key.startsWith("voice-jobs/")) || "";
    await processVoiceJob(jobKey.slice("voice-jobs/".length).replace(/\.json$/, ""), bucket.store, event => handleVoiceEvent(event, deps));
    assert.equal(sends, 0);
    assert.equal(bucket.objects.has(`voice-sip-connected/${id}.json`), false);
    assert.equal(bucket.objects.has(`voice-provider-answered/${id}.json`), true);
  });

  await check("parent lookup mismatch or missing duration does not send", async () => {
    const good = { sid: id, direction: "inbound", to: business, from: "+12025550123", status: "completed", duration: "0", end_time: endHeader };
    assert.equal(validateParentCall(good, id, business)?.durationSec, 0);
    assert.equal(validateParentCall({ ...good, duration: "" }, id, business), null);
    assert.equal(validateParentCall({ ...good, end_time: "" }, id, business), null);
    assert.equal(validateParentCall({ ...good, sid: "CA" + "c".repeat(32) }, id, business), null);
    assert.equal(validateParentCall({ ...good, direction: "outbound-api" }, id, business), null);
    assert.equal(validateParentCall({ ...good, to: "+19999999999" }, id, business), null);
    assert.equal(validateParentCall({ ...good, status: "in-progress" }, id, business), null);
    const bucket = memoryStore();
    await markReceptionistRoute(bucket.store, id, endAt - 5000);
    await bucket.store.put(`voice-calls/${id}.json`, { sid: id, caller: "+12025550100", startedAt: endAt - 5000 });
    assert.equal((await receiveReceptionistParent(signed("/api/voice/receptionist/parent", completionFields()), bucket.store, async () => null)).status, 400);
    assert.equal((await receiveReceptionistParent(signed("/api/voice/receptionist/parent", completionFields()), bucket.store, async () => { throw new Error("offline"); })).status, 503);
    assert.equal((await receiveReceptionistParent(signed("/api/voice/receptionist/parent", completionFields()), bucket.store, async () => evidence(0))).status, 400);
    assert.equal([...bucket.objects.keys()].some(key => key.startsWith("voice-jobs/")), false);
  });

  await check("authenticated call lookup reads end_time and rejects an uncertain resource", async () => {
    const priorAccount = process.env.TWILIO_ACCOUNT_SID;
    const priorPhone = process.env.TWILIO_PHONE_NUMBER;
    process.env.TWILIO_ACCOUNT_SID = "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    process.env.TWILIO_PHONE_NUMBER = business;
    let calls = 0;
    const found = await lookupTwilioParentCall(id, async (url, init) => {
      calls++;
      assert.match(String(url), new RegExp(`/Calls/${id}\\.json$`));
      assert.ok(init?.signal);
      const headers = new Headers(init?.headers);
      assert.equal(headers.has("authorization"), true);
      return Response.json({ sid: id, direction: "inbound", to: business, from: "+12025550123", status: "completed", duration: "0", end_time: endHeader });
    });
    assert.equal(calls, 1);
    assert.equal(found?.endTime, endAt);
    assert.equal(found?.durationSec, 0);
    assert.equal(await lookupTwilioParentCall(id, async () => Response.json({ sid: id, direction: "inbound", to: business, from: "+12025550123", status: "completed", end_time: endHeader })), null);
    assert.equal(await lookupTwilioParentCall(id, async () => new Response("no", { status: 404 })), null);
    if (priorAccount === undefined) delete process.env.TWILIO_ACCOUNT_SID; else process.env.TWILIO_ACCOUNT_SID = priorAccount;
    if (priorPhone === undefined) delete process.env.TWILIO_PHONE_NUMBER; else process.env.TWILIO_PHONE_NUMBER = priorPhone;
  });

  await check("marker storage failure forwards and a repeat inbound keeps the original reception start", async () => {
    process.env.VOICE_RECEPTIONIST_ENABLED = "true";
    process.env.VOICE_VAPI_SIP_URI = sip;
    const failed = memoryStore();
    const originalPut = failed.store.put;
    failed.store.put = async (key, value, upsert) => { if (String(key).startsWith("voice-route/")) throw new Error("offline"); return originalPut(key, value, upsert); };
    const forwarded = await inboundVoice(signed("/api/voice/inbound", inboundForm()), failed.store);
    assert.equal(await forwarded.text(), dialXml(forward, id));
    const kept = memoryStore();
    const first = await inboundVoice(signed("/api/voice/inbound", inboundForm()), kept.store);
    assert.match(await first.text(), /<Pause length="20"\/>/);
    const snapshot = structuredClone(kept.objects.get(`voice-route/${id}.json`));
    let routeWrites = 0;
    const keptPut = kept.store.put;
    kept.store.put = async (key, value, upsert) => { if (String(key).startsWith("voice-route/")) routeWrites++; return keptPut(key, value, upsert); };
    const second = await inboundVoice(signed("/api/voice/inbound", inboundForm()), kept.store);
    assert.match(await second.text(), /<Pause length="20"\/>/);
    assert.equal(routeWrites, 0);
    assert.deepEqual(kept.objects.get(`voice-route/${id}.json`), snapshot);
    delete process.env.VOICE_RECEPTIONIST_ENABLED;
    delete process.env.VOICE_VAPI_SIP_URI;
  });

  await check("receptionist sender does not text the business number", async () => {
    const priorPhone = process.env.TWILIO_PHONE_NUMBER;
    process.env.TWILIO_PHONE_NUMBER = "+12025550123";
    const bucket = memoryStore();
    await markReceptionistRoute(bucket.store, id, endAt - 5000);
    await bucket.store.put(`voice-calls/${id}.json`, { sid: id, caller: "+12025550123", startedAt: endAt - 5000 });
    let sends = 0;
    const deps = { store: bucket.store, delayMs: 0, lookup: async () => null, send: async () => { sends++; return { ok: true, sid: "SMfixture" }; } };
    assert.equal((await receiveReceptionistParent(signed("/api/voice/receptionist/parent", completionFields()), bucket.store, async () => evidence(0))).status, 200);
    const { processVoiceJob } = await import("../src/lib/voice-jobs");
    const jobKey = [...bucket.objects.keys()].find(key => key.startsWith("voice-jobs/")) || "";
    await processVoiceJob(jobKey.slice("voice-jobs/".length).replace(/\.json$/, ""), bucket.store, event => handleVoiceEvent(event, deps));
    assert.equal(sends, 0);
    const untouched = new URLSearchParams({ CallSid: id, DialCallStatus: "completed" });
    const hangup = await receiveReceptionistCallback(signed("/api/voice/receptionist/end", untouched), "dial", bucket.store);
    assert.match(await hangup.text(), /<Hangup\/>/);
    assert.equal(bucket.objects.has(`voice-sip-connected/${id}.json`), false);
    if (priorPhone === undefined) delete process.env.TWILIO_PHONE_NUMBER; else process.env.TWILIO_PHONE_NUMBER = priorPhone;
  });

  if (priorEnabled === undefined) delete process.env.VOICE_RECEPTIONIST_ENABLED; else process.env.VOICE_RECEPTIONIST_ENABLED = priorEnabled;
  if (priorSip === undefined) delete process.env.VOICE_VAPI_SIP_URI; else process.env.VOICE_VAPI_SIP_URI = priorSip;
  if (priorForward === undefined) delete process.env.FORWARD_PHONE_NUMBER; else process.env.FORWARD_PHONE_NUMBER = priorForward;
  if (priorToken === undefined) delete process.env.TWILIO_AUTH_TOKEN; else process.env.TWILIO_AUTH_TOKEN = priorToken;
  console.log(JSON.stringify({ passed, actualSmsSent: 0, scope: "offline receptionist fixtures" }));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
