import { inquiryStore, type InquiryStore } from "@/lib/inquiries";

export const VOICE_BASE = "https://www.get247roi.com";
export const MISSED_CALL_TEXT = "Hi, sorry we missed your call! This is 247ROI's assistant — tell me what's going on and I'll get you the right help, or call again at (610) 300-3001. Msg & data rates may apply. Reply STOP to opt out, HELP for help.";
// Carriers do not report audible rings. Approximate the first US ringing burst.
export const MIN_ABANDONED_RING_MS = 2000;
export const isCallSid = (s: string) => /^CA[0-9a-f]{32}$/i.test(s);
const phone = (s: string) => /^\+[1-9]\d{7,14}$/.test(s);
export type VoiceCall = { sid: string; caller: string; startedAt: number };
export type VoiceEvent = { kind: "child" | "amd" | "dial" | "parent"; parent: string; status: string; answeredBy: string; timestamp: number };
type End = { status: string; at: number };
type SmsResult = { ok: boolean; sid?: string; code?: number; uncertain?: boolean };
type Dependencies = { store: InquiryStore; send: (to: string) => Promise<SmsResult>; lookup: (sid: string) => Promise<VoiceCall | null> };

export function dialXml(forward: string, parent: string) {
  if (!phone(forward) || !isCallSid(parent)) throw new Error("invalid_dial_configuration");
  const events = `${VOICE_BASE}/api/voice/events?parent=${parent}&amp;kind=`;
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial timeout="60" action="${VOICE_BASE}/api/voice/status" method="POST"><Number statusCallback="${events}child#rc=3&amp;rp=ct,rt,5xx" statusCallbackMethod="POST" statusCallbackEvent="initiated ringing answered completed" machineDetection="Enable" amdStatusCallback="${events}amd#rc=3&amp;rp=ct,rt,5xx" amdStatusCallbackMethod="POST">${forward}</Number></Dial></Response>`;
}

async function lookupCall(sid: string): Promise<VoiceCall | null> {
  const account = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN;
  if (!account || !token) throw new Error("voice_credentials_missing");
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account}/Calls/${sid}.json`, { headers: { Authorization: `Basic ${Buffer.from(`${account}:${token}`).toString("base64")}` }, signal: AbortSignal.timeout(8000), cache: "no-store" });
  if (!r.ok) throw new Error("voice_lookup_failed");
  const c = await r.json();
  if (c.direction !== "inbound" || c.to !== process.env.TWILIO_PHONE_NUMBER || !phone(c.from)) return null;
  const startedAt = Date.parse(c.date_created);
  if (!Number.isFinite(startedAt)) throw new Error("voice_timestamp_missing");
  return { sid, caller: c.from, startedAt };
}

async function send(to: string): Promise<SmsResult> {
  const account = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_PHONE_NUMBER;
  if (!account || !token || !from) throw new Error("voice_credentials_missing");
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`, {
      method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${account}:${token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: to, From: from, Body: MISSED_CALL_TEXT }), signal: AbortSignal.timeout(10000),
    });
    const body = await r.json();
    if (r.ok && typeof body.sid === "string") return { ok: true, sid: body.sid };
    // 5xx or malformed acceptance may have been processed: do not blind-retry.
    return { ok: false, code: Number(body.code) || r.status, uncertain: r.status >= 500 || r.ok };
  } catch { return { ok: false, uncertain: true }; }
}

export async function registerVoiceCall(call: VoiceCall, store = inquiryStore()) {
  if (!isCallSid(call.sid) || !phone(call.caller)) return;
  await store.ensure();
  await store.put(`voice-calls/${call.sid}.json`, call);
}

/** Immutable event facts tolerate duplicate and out-of-order signed callbacks.
 * A permanent create-only send claim prevents simultaneous/late duplicate SMS.
 * Ambiguous provider acceptance is retained for reconciliation, never resent.
 */
export async function handleVoiceEvent(event: VoiceEvent, deps: Dependencies = { store: inquiryStore(), send, lookup: lookupCall }) {
  const { store } = deps, id = event.parent;
  if (!isCallSid(id) || !Number.isFinite(event.timestamp)) throw new Error("invalid_voice_event");
  await store.ensure();
  let call = await store.get<VoiceCall>(`voice-calls/${id}.json`);
  if (!call) {
    call = await deps.lookup(id);
    if (!call) return "not_textable";
    await registerVoiceCall(call, store);
  }
  const key = (type: string) => `voice-${type}/${id}.json`;
  const at = event.timestamp;
  if (event.kind === "amd") {
    if (event.answeredBy === "human") await store.put(key("human"), { at });
    else if (event.answeredBy.startsWith("machine_") || event.answeredBy === "fax") await store.put(key("machine"), { at, result: event.answeredBy });
    else { await store.put(key("unknown"), { at, result: event.answeredBy }); console.warn("[voice_amd_unknown]", id); }
  }
  if (event.kind === "child" && event.status === "ringing") await store.put(key("ringing"), { at });
  if (event.kind === "child" && event.status === "in-progress") await store.put(key("connected"), { at });
  if (event.kind === "child" && ["completed", "no-answer", "busy", "failed", "canceled"].includes(event.status)) {
    await store.put(key("end"), { status: event.status, at } satisfies End);
  }
  // A parent 'completed' is NOT evidence a person answered or evidence nobody did.
  const [human, machine, end, ringing, connected] = await Promise.all([
    store.get(key("human")), store.get(key("machine")), store.get<End>(key("end")), store.get<{ at: number }>(key("ringing")), store.get(key("connected")),
  ]);
  if (human) return "human_no_text";
  let reason = machine ? "voicemail" : "";
  if (!reason && end && !connected && end.status !== "completed") {
    const elapsed = ringing ? end.at - ringing.at : -1;
    if (["busy", "failed"].includes(end.status) || elapsed >= MIN_ABANDONED_RING_MS) reason = "unanswered";
  }
  if (!reason) return "waiting_or_short_call";
  if (!await store.put(key("claims"), { at: Date.now(), reason, state: "sending" })) return "duplicate_suppressed";
  // Recheck human evidence after obtaining the exclusive send claim.
  if (await store.get(key("human"))) return "human_no_text";
  let result: SmsResult;
  try { result = await deps.send(call.caller); } catch { result = { ok: false, uncertain: true }; }
  await store.put(key("results"), { ...result, at: Date.now(), reason }, true);
  if (!result.ok) {
    console.error("[voice_sms_failed]", { call: id, code: result.code, uncertain: result.uncertain });
    // Known rejection can safely retry via provider webhook retries, except opt-out.
    if (!result.uncertain && result.code !== 21610) { await store.remove(key("claims")); throw new Error("voice_sms_rejected"); }
    return result.uncertain ? "sms_acceptance_unknown" : "opted_out";
  }
  console.info("[voice_sms_accepted]", { call: id, message: result.sid, reason });
  return "sent";
}
