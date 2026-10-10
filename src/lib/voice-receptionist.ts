import { after, NextRequest, NextResponse } from "next/server";
import { inquiryStore, type InquiryStore } from "@/lib/inquiries";
import { isCallSid, MIN_ABANDONED_RING_MS, MISSED_CALL_DELAY_MS, registerVoiceCall, VOICE_BASE, type VoiceCall, type VoiceEvent } from "@/lib/missed-calls";
import { queueVoiceEvent, processVoiceJobAfterResponse } from "@/lib/voice-jobs";
import { validTwilioSignature } from "@/lib/twilio-signature";

const SIP_URI = /^sip:[A-Za-z0-9._+\-]{1,80}@sip\.vapi\.ai(?::(?:6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}))?(?:;[A-Za-z][A-Za-z0-9._\-]{0,20}=[A-Za-z0-9._\-]{1,40})*$/;
const CLEAR_UNANSWERED = new Set(["no-answer", "busy", "failed", "canceled"]);
const PARENT_TERMINAL = new Set(["completed", "no-answer", "busy", "failed", "canceled"]);
type End = { status: string; at: number };
type SmsResult = { ok: boolean; sid?: string; code?: number; uncertain?: boolean };
type Dependencies = { store: InquiryStore; send: (to: string) => Promise<SmsResult>; lookup: (sid: string) => Promise<VoiceCall | null>; now?: () => number; delayMs?: number };

export function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;" })[char] ?? char);
}

/** Host must be exactly sip.vapi.ai. Credentials, XML, and header characters are rejected. */
export function validVapiSipUri(value: string) {
  return SIP_URI.test(value);
}

export function receptionistTwiml(sipUri: string, parent: string) {
  if (!validVapiSipUri(sipUri) || !isCallSid(parent)) throw new Error("invalid_sip_configuration");
  const events = `${VOICE_BASE}/api/voice/receptionist/events?parent=${parent}&amp;kind=sip#rc=3&amp;rp=ct,rt,5xx`;
  const action = `${VOICE_BASE}/api/voice/receptionist/end`;
  const refer = escapeXml(`${VOICE_BASE}/api/voice/receptionist/transfer?parent=${parent}`);
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Pause length="20"/><Dial answerOnBridge="true" timeLimit="600" referUrl="${refer}" referMethod="POST" action="${action}" method="POST"><Sip statusCallback="${events}" statusCallbackMethod="POST" statusCallbackEvent="initiated ringing answered completed">${escapeXml(sipUri)}</Sip></Dial></Response>`;
}

export type ReceptionMarker = { route: "receptionist"; at: number; receptionStart: number };

export async function markReceptionistRoute(store: InquiryStore, sid: string, at: number) {
  if (!isCallSid(sid) || !Number.isFinite(at)) return false;
  return store.put(`voice-route/${sid}.json`, { route: "receptionist", at, receptionStart: at } satisfies ReceptionMarker);
}

function connectedStatus(status: string) {
  return status === "in-progress" || status === "answered";
}

const e164 = (value: string) => /^\+[1-9]\d{7,14}$/.test(value);

async function sameBusinessNumber(store: InquiryStore, id: string, deps: Dependencies) {
  const business = process.env.TWILIO_PHONE_NUMBER || "";
  if (!e164(business)) return false;
  let call = await store.get<VoiceCall>(`voice-calls/${id}.json`);
  if (!call) call = await deps.lookup(id);
  return call?.caller === business;
}

export type ParentCallEvidence = { sid: string; status: string; endTime: number; durationSec: number; from: string; to: string };

/** Accept only the authenticated call resource. Missing duration or end_time fails closed. */
export function validateParentCall(body: unknown, expectedSid: string, expectedTo: string): ParentCallEvidence | null {
  if (!body || typeof body !== "object") return null;
  const call = body as Record<string, unknown>;
  if (call.sid !== expectedSid || !isCallSid(expectedSid)) return null;
  if (call.direction !== "inbound") return null;
  if (typeof call.to !== "string" || call.to !== expectedTo || !e164(expectedTo)) return null;
  if (typeof call.from !== "string" || !e164(call.from)) return null;
  if (typeof call.status !== "string" || !PARENT_TERMINAL.has(call.status)) return null;
  const endTime = Date.parse(typeof call.end_time === "string" ? call.end_time : "");
  if (!Number.isFinite(endTime)) return null;
  const durationText = typeof call.duration === "number" && Number.isInteger(call.duration) ? String(call.duration) : call.duration;
  if (typeof durationText !== "string" || !/^\d+$/.test(durationText)) return null;
  const durationSec = Number(durationText);
  if (!Number.isInteger(durationSec) || durationSec < 0) return null;
  return { sid: expectedSid, status: call.status, endTime, durationSec, from: call.from, to: expectedTo };
}

export async function lookupTwilioParentCall(sid: string, fetchImpl: typeof fetch = fetch): Promise<ParentCallEvidence | null> {
  const account = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const expectedTo = process.env.TWILIO_PHONE_NUMBER;
  if (!account || !token || !expectedTo || !isCallSid(sid)) return null;
  const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(account)}/Calls/${sid}.json`, {
    headers: { Authorization: `Basic ${Buffer.from(`${account}:${token}`).toString("base64")}` },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) return null;
  return validateParentCall(await response.json(), sid, expectedTo);
}

export function receptionistOutcome(facts: { sipEnd: End | null; sipRinging: { at: number } | null; parentEnd: End | null; parentRinging: { at: number } | null; dialEnd: End | null; receptionStart: number | null; providerDuration: number | null }) {
  const { sipEnd, sipRinging, parentEnd, parentRinging, dialEnd, receptionStart, providerDuration } = facts;
  if (providerDuration !== null && providerDuration > 0) return "answered";
  if (sipEnd?.status === "completed") return "uncertain";
  if (sipEnd && CLEAR_UNANSWERED.has(sipEnd.status)) {
    if (sipEnd.status === "busy" || sipEnd.status === "failed") return "unanswered";
    if (!sipRinging) return "waiting";
    return sipEnd.at - sipRinging.at >= MIN_ABANDONED_RING_MS ? "unanswered" : "waiting";
  }
  const sipActivity = Boolean(sipEnd || sipRinging);
  if (!sipActivity && parentEnd && PARENT_TERMINAL.has(parentEnd.status)) {
    if (providerDuration === null && !parentRinging) return "uncertain";
    if (parentEnd.status === "busy" || parentEnd.status === "failed") return "unanswered";
    const startAt = parentRinging?.at ?? receptionStart;
    if (startAt === null || !Number.isFinite(startAt)) return "uncertain";
    return parentEnd.at - startAt >= MIN_ABANDONED_RING_MS ? "unanswered" : "waiting";
  }
  if (sipRinging && !sipEnd && parentEnd) return "waiting";
  if (dialEnd && CLEAR_UNANSWERED.has(dialEnd.status) && dialEnd.status !== "completed") {
    if (dialEnd.status === "busy" || dialEnd.status === "failed") return "unanswered";
    const ringAt = sipRinging?.at ?? parentRinging?.at;
    if (ringAt === undefined) return "waiting";
    return dialEnd.at - ringAt >= MIN_ABANDONED_RING_MS ? "unanswered" : "waiting";
  }
  if (dialEnd?.status === "completed") return "uncertain";
  return "waiting";
}

/** Marker-bound receptionist facts. Parent termination is explicit and never writes a child call leg. */
export async function handleReceptionistVoiceEvent(event: VoiceEvent, deps: Dependencies) {
  const { store } = deps;
  const id = event.parent;
  const at = event.timestamp;
  if (event.kind === "sip" && !await store.get(`voice-route/${id}.json`)) await markReceptionistRoute(store, id, at);
  if (event.kind === "sip") {
    if (connectedStatus(event.status)) await store.put(`voice-sip-connected/${id}.json`, { at, status: event.status });
    if (event.status === "ringing") await store.put(`voice-sip-ringing/${id}.json`, { at });
    if (PARENT_TERMINAL.has(event.status)) await store.put(`voice-sip-end/${id}.json`, { status: event.status, at });
  } else if (event.kind === "parent") {
    if (connectedStatus(event.status)) await store.put(`voice-sip-connected/${id}.json`, { at, status: event.status, source: "parent" });
    if (event.status === "ringing") await store.put(`voice-parent-ringing/${id}.json`, { at });
    if (PARENT_TERMINAL.has(event.status)) await store.put(`voice-parent-end/${id}.json`, { status: event.status, at });
    if (typeof event.providerDuration === "number" && event.providerDuration >= 0) {
      const prior = await store.get<{ seconds: number }>(`voice-provider-duration/${id}.json`);
      const seconds = prior && prior.seconds > 0 ? prior.seconds : event.providerDuration;
      await store.put(`voice-provider-duration/${id}.json`, { seconds }, true);
      if (seconds > 0) await store.put(`voice-provider-answered/${id}.json`, { at, seconds }, true);
    }
  } else if (event.kind === "dial") {
    if (PARENT_TERMINAL.has(event.status) || event.status === "answered") await store.put(`voice-dial-action/${id}.json`, { status: event.status, at });
  }
  if (await store.get(`voice-sip-connected/${id}.json`) || await store.get(`voice-provider-answered/${id}.json`)) return "ai_answered_no_text";
  const [sipEnd, sipRinging, parentEnd, parentRinging, dialEnd, marker, duration] = await Promise.all([
    store.get<End>(`voice-sip-end/${id}.json`),
    store.get<{ at: number }>(`voice-sip-ringing/${id}.json`),
    store.get<End>(`voice-parent-end/${id}.json`),
    store.get<{ at: number }>(`voice-parent-ringing/${id}.json`),
    store.get<End>(`voice-dial-action/${id}.json`),
    store.get<ReceptionMarker>(`voice-route/${id}.json`),
    store.get<{ seconds: number }>(`voice-provider-duration/${id}.json`),
  ]);
  const providerDuration = typeof duration?.seconds === "number" ? duration.seconds : null;
  const receptionStart = typeof marker?.receptionStart === "number" ? marker.receptionStart : null;
  const outcome = receptionistOutcome({ sipEnd, sipRinging, parentEnd, parentRinging, dialEnd, receptionStart, providerDuration });
  if (outcome === "answered") return "ai_answered_no_text";
  if (outcome === "uncertain") return "uncertain_no_text";
  if (outcome !== "unanswered") return "waiting_or_short_call";
  if (await sameBusinessNumber(store, id, deps)) return "same_number_blocked";
  const now = (deps.now ?? Date.now)();
  await store.put(`voice-schedule/${id}.json`, { dueAt: now + (deps.delayMs ?? MISSED_CALL_DELAY_MS), reason: "unanswered" });
  const schedule = await store.get<{ dueAt: number }>(`voice-schedule/${id}.json`);
  if (!schedule || !Number.isFinite(schedule.dueAt)) throw new Error("voice_schedule_missing");
  if (now < schedule.dueAt) return "scheduled";
  if (!await store.put(`voice-claims/${id}.json`, { at: Date.now(), reason: "unanswered", state: "sending" })) return "duplicate_suppressed";
  if (await store.get(`voice-human/${id}.json`)) return "human_no_text";
  if (await store.get(`voice-sip-connected/${id}.json`) || await store.get(`voice-provider-answered/${id}.json`)) return "ai_answered_no_text";
  if (await sameBusinessNumber(store, id, deps)) return "same_number_blocked";
  const ringNow = await store.get<{ at: number }>(`voice-parent-ringing/${id}.json`);
  const endNow = await store.get<End>(`voice-parent-end/${id}.json`);
  if (ringNow && endNow && !["busy", "failed"].includes(endNow.status) && endNow.at - ringNow.at < MIN_ABANDONED_RING_MS && !await store.get(`voice-sip-end/${id}.json`)) return "waiting_or_short_call";
  const sipEndNow = await store.get<End>(`voice-sip-end/${id}.json`);
  const dialNow = await store.get<End>(`voice-dial-action/${id}.json`);
  if (sipEndNow?.status === "completed" || (dialNow?.status === "completed" && !CLEAR_UNANSWERED.has(sipEndNow?.status || ""))) return "uncertain_no_text";
  let call = await store.get<VoiceCall>(`voice-calls/${id}.json`);
  if (!call) {
    call = await deps.lookup(id);
    if (!call) return "not_textable";
    await registerVoiceCall(call, store);
  }
  if (e164(process.env.TWILIO_PHONE_NUMBER || "") && call.caller === process.env.TWILIO_PHONE_NUMBER) return "same_number_blocked";
  let result: SmsResult;
  try { result = await deps.send(call.caller); } catch { result = { ok: false, uncertain: true }; }
  await store.put(`voice-results/${id}.json`, { ...result, at: Date.now(), reason: "unanswered" }, true);
  if (!result.ok) {
    console.error("[voice_sms_failed]", { call: id, code: result.code, uncertain: result.uncertain });
    if (!result.uncertain && result.code !== 21610) { await store.remove(`voice-claims/${id}.json`); throw new Error("voice_sms_rejected"); }
    return result.uncertain ? "sms_acceptance_unknown" : "opted_out";
  }
  console.info("[voice_sms_accepted]", { call: id, message: result.sid, reason: "unanswered" });
  return "sent";
}

export async function receiveReceptionistCallback(req: NextRequest, kind: "sip" | "dial", store?: InquiryStore) {
  if (!req.headers.get("x-twilio-signature")) return new NextResponse("Forbidden", { status: 403 });
  const form = await req.formData();
  if (!validTwilioSignature(req, form)) return new NextResponse("Forbidden", { status: 403 });
  const parent = req.nextUrl.searchParams.get("parent") || String(form.get("ParentCallSid") || form.get("CallSid") || "");
  if (!isCallSid(parent)) return new NextResponse("Bad call", { status: 400 });
  const timestamp = Date.parse(String(form.get("Timestamp") || ""));
  const voice = kind === "dial" ? "<Response><Hangup/></Response>" : "<Response/>";
  if (!Number.isFinite(timestamp)) {
    if (kind === "dial") return new NextResponse(voice, { headers: { "Content-Type": "text/xml" } });
    return new NextResponse("Missing event timestamp", { status: 400 });
  }
  const status = kind === "dial" ? String(form.get("DialCallStatus") || "") : String(form.get("CallStatus") || "");
  try {
    const bucket = store ?? inquiryStore(Date.now() + 6000);
    const job = await queueVoiceEvent({ kind, parent, status, answeredBy: String(form.get("AnsweredBy") || ""), timestamp }, bucket);
    try { after(async () => { try { await processVoiceJobAfterResponse(job); } catch { console.error("[voice_job_pending]", job); } }); }
    catch { console.error("[voice_job_pending]", job); }
  } catch {
    console.error("[voice_callback_enqueue_failed]", { parent, kind });
    return new NextResponse("Retry", { status: 503 });
  }
  return new NextResponse(voice, { headers: { "Content-Type": "text/xml" } });
}

/** Number StatusCallback is completion-only. Terminal time comes from Calls/{CallSid}.json end_time. */
export async function receiveReceptionistParent(req: NextRequest, store?: InquiryStore, lookup: (sid: string) => Promise<ParentCallEvidence | null> = lookupTwilioParentCall) {
  if (!req.headers.get("x-twilio-signature")) return new NextResponse("Forbidden", { status: 403 });
  const form = await req.formData();
  if (!validTwilioSignature(req, form)) return new NextResponse("Forbidden", { status: 403 });
  const parent = String(form.get("CallSid") || "");
  if (!isCallSid(parent)) return new NextResponse("Bad call", { status: 400 });
  const formStatus = String(form.get("CallStatus") || "");
  if (!PARENT_TERMINAL.has(formStatus)) return new NextResponse("Bad call", { status: 400 });
  let evidence: ParentCallEvidence | null;
  try { evidence = await lookup(parent); }
  catch { console.error("[voice_parent_lookup_failed]", parent); return new NextResponse("Retry", { status: 503 }); }
  if (!evidence || evidence.status !== formStatus) return new NextResponse("Bad call", { status: 400 });
  try {
    const bucket = store ?? inquiryStore(Date.now() + 6000);
    const known = await bucket.get<VoiceCall>(`voice-calls/${parent}.json`);
    if (known && known.caller !== evidence.from) return new NextResponse("Bad call", { status: 400 });
    const job = await queueVoiceEvent({ kind: "parent", parent, status: evidence.status, answeredBy: "", timestamp: evidence.endTime, providerDuration: evidence.durationSec }, bucket);
    try { after(async () => { try { await processVoiceJobAfterResponse(job); } catch { console.error("[voice_job_pending]", job); } }); }
    catch { console.error("[voice_job_pending]", job); }
  } catch {
    console.error("[voice_callback_enqueue_failed]", { parent, kind: "parent" });
    return new NextResponse("Retry", { status: 503 });
  }
  return new NextResponse("<Response/>", { headers: { "Content-Type": "text/xml" } });
}
