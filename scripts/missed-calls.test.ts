import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { dialXml, handleVoiceEvent, registerVoiceCall, type VoiceEvent } from "../src/lib/missed-calls";
import { type InquiryStore } from "../src/lib/inquiries";
import { POST as eventPost } from "../src/app/api/voice/events/route";
import { validTwilioSignature } from "../src/lib/twilio-signature";
const id = "CA" + "1".repeat(32);
const start = 1700000000000;
let passed = 0;
async function fixture(sendResult = { ok: true, sid: "SMfixture" } as { ok: boolean; sid?: string; code?: number; uncertain?: boolean }) {
  const objects = new Map<string, unknown>();
  const store: InquiryStore = {
    ensure: async () => undefined,
    get: async <T>(key: string) => (objects.get(key) as T | undefined) ?? null,
    put: async (key, value, upsert = false) => { if (objects.has(key) && !upsert) return false; objects.set(key, structuredClone(value)); return true; },
    remove: async key => { objects.delete(key); }, list: async () => [],
  };
  await registerVoiceCall({ sid: id, caller: "+12025550123", startedAt: start }, store);
  let sends = 0;
  const deps = { store, delayMs: 0, lookup: async () => null, send: async (to: string) => { assert.equal(to, "+12025550123"); sends++; return sendResult; } };
  const event = (kind: VoiceEvent["kind"], status = "", offset = 10000, answeredBy = "") => handleVoiceEvent({ kind, status, timestamp: start + offset, parent: id, answeredBy }, deps);
  return { objects, store, deps, event, sends: () => sends };
}
async function check(name: string, fn: () => Promise<void>) { await fn(); passed++; console.log("PASS", name); }
async function main() {
  await check("ringing never sends, regardless of elapsed time", async () => { const f = await fixture(); await f.event("child", "ringing", 1000); await f.event("child", "ringing", 60000); assert.equal(f.sends(), 0); });
  await check("human answer and completed call never text", async () => { const f = await fixture(); await f.event("child", "ringing", 1000); await f.event("child", "in-progress", 5000); await f.event("amd", "", 6000, "human"); await f.event("child", "completed", 90000); await f.event("dial", "completed", 90000); assert.equal(f.sends(), 0); });
  await check("voicemail texts before call ends; completion cannot duplicate", async () => { const f = await fixture(); await f.event("child", "in-progress"); assert.equal(await f.event("amd", "", 12000, "machine_start"), "sent"); assert.equal(f.sends(), 1); await f.event("child", "completed", 120000); await f.event("dial", "completed", 120000); assert.equal(f.sends(), 1); });
  await check("abandoned after first ring texts from child terminal event", async () => { const f = await fixture(); await f.event("child", "ringing", 1000); await f.event("child", "canceled", 8000); assert.equal(f.sends(), 1); });
  await check("very short abandoned call does not text", async () => { const f = await fixture(); await f.event("child", "ringing", 1000); await f.event("child", "canceled", 2000); assert.equal(f.sends(), 0); });
  await check("unanswered timeout, busy and failed are eligible", async () => { for (const status of ["no-answer", "busy", "failed"]) { const f = await fixture(); await f.event("child", "ringing", 1000); await f.event("child", status, 30000); assert.equal(f.sends(), 1); } });
  await check("network answered does not equal human; unknown is not guessed", async () => { const f = await fixture(); await f.event("child", "in-progress"); await f.event("amd", "", 15000, "unknown"); await f.event("child", "completed", 30000); assert.equal(f.sends(), 0); });
  await check("late human result suppresses even after completion", async () => { const f = await fixture(); await f.event("child", "completed", 30000); await f.event("amd", "", 31000, "human"); assert.equal(f.sends(), 0); });
  await check("late machine result still texts after voicemail message ends", async () => { const f = await fixture(); await f.event("child", "completed", 30000); await f.event("amd", "", 31000, "machine_start"); assert.equal(f.sends(), 1); });
  await check("30 concurrent duplicate callbacks send once", async () => { const f = await fixture(); await Promise.all(Array.from({ length: 30 }, () => f.event("amd", "", 12000, "machine_start"))); assert.equal(f.sends(), 1); });
  await check("uncertain provider response never blind-retries", async () => { const f = await fixture({ ok: false, uncertain: true }); await f.event("amd", "", 12000, "machine_start"); await f.event("amd", "", 12000, "machine_start"); assert.equal(f.sends(), 1); assert(f.objects.has(`voice-results/${id}.json`)); });
  await check("STOP rejection cannot cause repeated sends", async () => { const f = await fixture({ ok: false, code: 21610 }); await f.event("amd", "", 12000, "machine_start"); await f.event("amd", "", 12000, "machine_start"); assert.equal(f.sends(), 1); });
  await check("definite provider rejection is retryable", async () => { const f = await fixture({ ok: false, code: 20429 }); await assert.rejects(() => f.event("amd", "", 12000, "machine_start"), /rejected/); assert(!f.objects.has(`voice-claims/${id}.json`)); });
  await check("store outage cannot produce untracked SMS", async () => { const f = await fixture(); f.store.put = async () => { throw new Error("offline"); }; await assert.rejects(() => f.event("amd", "", 12000, "machine_start")); assert.equal(f.sends(), 0); });
  await check("parent completed alone never sends", async () => { const f = await fixture(); await f.event("parent", "completed", 30000); assert.equal(f.sends(), 0); });
  await check("Twiml enables early AMD and independent child completion", async () => { const xml = dialXml("+12025550124", id); assert(xml.includes('machineDetection="Enable"')); assert(xml.includes('amdStatusCallback=')); assert(xml.includes('statusCallbackEvent="initiated ringing answered completed"')); assert(!xml.includes("DetectMessageEnd")); assert(!xml.includes("<Gather")); assert.throws(() => dialXml("bad", id)); });
  await check("callbacks authenticate path, query and payload", async () => { process.env.TWILIO_AUTH_TOKEN = "offline-fixture"; const path = `/api/voice/events?parent=${id}&kind=amd`; const fields = new URLSearchParams({ CallSid: id, AnsweredBy: "human" }); let payload = "https://www.get247roi.com" + path; for (const key of [...fields.keys()].sort()) payload += key + fields.get(key); const signature = createHmac("sha1", "offline-fixture").update(payload).digest("base64"); const req = (suffix = path, signed = true) => new NextRequest("http://localhost:3647" + suffix, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", ...(signed ? { "x-twilio-signature": signature } : {}) }, body: fields.toString() }); assert(validTwilioSignature(req(), await req().formData())); assert(!validTwilioSignature(req(path.replace("amd", "child")), await req().formData())); assert.equal((await eventPost(req(path, false))).status, 403); assert.equal((await eventPost(req(path.replace("amd", "child")))).status, 403); });
  await check("end before ringing callback waits for actual event time", async () => { const f = await fixture(); await f.event("child", "canceled", 8000); assert.equal(f.sends(),0); await f.event("child", "ringing", 1000); assert.equal(f.sends(),1); });
  await check("pre-ring setup time cannot qualify a short hangup", async () => { const f = await fixture(); await f.event("child", "canceled", 11000); await f.event("child", "ringing", 10000); assert.equal(f.sends(),0); });
  await check("public or unavailable bucket blocks writes and sends", async () => { const f = await fixture(); f.store.ensure = async () => { throw new Error("not private"); }; await assert.rejects(() => f.event("amd", "", 12000,"machine_start")); assert.equal(f.sends(),0); });
  await check("durable queue retains failed work and drains after recovery", async () => { const { queueVoiceEvent, processVoiceJob } = await import("../src/lib/voice-jobs"); const f = await fixture(); const event: VoiceEvent = { kind:"amd", parent:id, status:"", answeredBy:"human", timestamp:start }; const job = await queueVoiceEvent(event,f.store); await assert.rejects(() => processVoiceJob(job,f.store,async()=>{throw new Error("temporary");})); assert(f.objects.has(`voice-jobs/${job}.json`)); await processVoiceJob(job,f.store,e=>handleVoiceEvent(e,f.deps)); assert(!f.objects.has(`voice-jobs/${job}.json`)); assert.equal(f.sends(),0); });
  await check("ring window preserves time for existing carrier voicemail", async () => { assert(dialXml("+12025550124",id).includes('timeout="60"')); assert(dialXml("+12025550124",id).includes("rp=ct,rt,5xx")); });
  await check("10-second delay starts only after a missed outcome and survives retries", async () => {
    const f = await fixture(); let now = start;
    const deps = { ...f.deps, delayMs: 10000, now: () => now };
    const event: VoiceEvent = { kind: "child", parent:id, status:"ringing", answeredBy:"", timestamp:start };
    await handleVoiceEvent(event,deps); assert(!f.objects.has(`voice-schedule/${id}.json`));
    now += 5000; event.status="canceled"; event.timestamp=now;
    assert.equal(await handleVoiceEvent(event,deps),"scheduled"); assert.equal(f.sends(),0);
    const schedule = structuredClone(f.objects.get(`voice-schedule/${id}.json`));
    now += 9999; assert.equal(await handleVoiceEvent(event,deps),"scheduled"); assert.equal(f.sends(),0);
    assert.deepEqual(f.objects.get(`voice-schedule/${id}.json`),schedule);
    now++; assert.equal(await handleVoiceEvent(event,deps),"sent"); assert.equal(f.sends(),1);
    await handleVoiceEvent(event,deps); assert.equal(f.sends(),1);
  });
  await check("human classification during delay cancels pending voicemail text", async () => {
    const f = await fixture(); let now = start;
    const deps = { ...f.deps, delayMs:10000, now:()=>now };
    const event: VoiceEvent = {kind:"amd",parent:id,status:"",answeredBy:"machine_start",timestamp:start};
    assert.equal(await handleVoiceEvent(event,deps),"scheduled");
    now+=2000; await handleVoiceEvent({...event,answeredBy:"human"},deps);
    now+=10000; assert.equal(await handleVoiceEvent(event,deps),"human_no_text"); assert.equal(f.sends(),0);
  });
  await check("scheduled job stays durable until its due time", async () => {
    const {queueVoiceEvent,processVoiceJob}=await import("../src/lib/voice-jobs");
    const f=await fixture(); let now=start;
    const deps={...f.deps,delayMs:10000,now:()=>now};
    const event: VoiceEvent={kind:"amd",parent:id,status:"",answeredBy:"machine_start",timestamp:start};
    const job=await queueVoiceEvent(event,f.store);
    assert.equal(await processVoiceJob(job,f.store,e=>handleVoiceEvent(e,deps)),"scheduled");
    assert(f.objects.has(`voice-jobs/${job}.json`));assert.equal(f.sends(),0);
    now+=10000;await processVoiceJob(job,f.store,e=>handleVoiceEvent(e,deps));
    assert(!f.objects.has(`voice-jobs/${job}.json`));assert.equal(f.sends(),1);
  });
  await check("post-response task waits the real 10 seconds before sending", async () => {
    const {queueVoiceEvent,processVoiceJobAfterResponse}=await import("../src/lib/voice-jobs");
    const {MISSED_CALL_DELAY_MS}=await import("../src/lib/missed-calls");
    assert.equal(MISSED_CALL_DELAY_MS,10000);
    const f=await fixture(); const began=Date.now();
    const deps={...f.deps,delayMs:MISSED_CALL_DELAY_MS};
    const event: VoiceEvent={kind:"amd",parent:id,status:"",answeredBy:"machine_start",timestamp:began};
    const job=await queueVoiceEvent(event,f.store);
    const running=processVoiceJobAfterResponse(job,f.store,e=>handleVoiceEvent(e,deps));
    await new Promise(resolve=>setTimeout(resolve,100));assert.equal(f.sends(),0);
    await running; assert(Date.now()-began>=10000); assert.equal(f.sends(),1);
    assert(!f.objects.has(`voice-jobs/${job}.json`));
  });
  console.log(JSON.stringify({ passed, actualSmsSent: 0, scope: "offline fixtures; carrier detection and handset delivery require real call acceptance" }));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
