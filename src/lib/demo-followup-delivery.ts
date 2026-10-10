import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { inquiryStore, type InquiryStore } from "@/lib/inquiries";
import { isCallSid } from "@/lib/missed-calls";

const token = (value: string) => /^[A-Za-z0-9_-]{1,80}$/.test(value);
const e164 = (value: string) => /^\+[1-9]\d{7,14}$/.test(value);
const MAX_BODY_BYTES = 1024 * 1024;
const SKEW_MS = 120_000;
const MAX_ATTEMPTS = 8;
const MAX_MESSAGES = 200;
export const DEMO_FOLLOWUP_TEXT = "Thanks for trying 247ROI's AI receptionist. Want a quick 10\u201315 minute call to plan a custom demo for your business? Reply here or call this number. Reply STOP to opt out.";
export const MAIN_ASSISTANT_ID = "68a623c2-d6f6-4bdf-85f9-bbc709521bf4";
export const DEMO_ASSISTANT_ID = "6dd3c21c-b082-43ed-9248-3201abceb678";
const CALENDAR_CREATE = "google.calendar.event.create";

type QuoteSet = { smsPermissionQuote: string; notBookedQuote: string; prospectQuote: string };
type FollowupRequest = QuoteSet & { vapiCallId: string; toolCallId: string; fingerprint: string; receivedAt: string; status: string };
type FollowupJob = { vapiCallId: string; receivedAt: string; attempts: number };
type FollowupResult = { final: true; status: string; at: string; ok?: boolean; uncertain?: boolean; code?: number; sid?: string; parentSid?: string; childSid?: string };
type SmsResult = { ok: boolean; sid?: string; code?: number; uncertain?: boolean };
type Leg = { sid: string; parentCallSid: string; to: string; from: string; direction: string; status: string; startTime: unknown; endTime: unknown };
type Binding = { phone: string; parentSid: string; childSid: string };
type Evidence = {
  demo: boolean;
  eventCreate: boolean;
  bookingUncertain: boolean;
  booked: boolean;
  transfer: boolean;
  stop: boolean;
  decline: boolean;
  existing: boolean;
  support: boolean;
  vendor: boolean;
  wrong: boolean;
  spam: boolean;
  users: string[];
};
type Failure = { ok: false; status: number; error: string };
export type DemoDeps = { fetchImpl?: typeof fetch; now?: () => number };

function authorized(header: string | null) {
  const secret = process.env.VOICE_VAPI_ACTION_SECRET;
  if (!secret || !header) return false;
  const a = createHash("sha256").update(secret).digest();
  const b = createHash("sha256").update(header).digest();
  return timingSafeEqual(a, b);
}

function norm(value: string) {
  return value.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9+]+/g, " ").trim();
}

function cleanQuote(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text.length < 2 || text.length > 240 || /[\u0000-\u001f]/.test(text)) return null;
  return text;
}

function parseQuotes(raw: unknown): QuoteSet | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const args = raw as Record<string, unknown>;
  if (Object.keys(args).some(key => !["smsPermissionQuote", "notBookedQuote", "prospectQuote"].includes(key))) return null;
  const smsPermissionQuote = cleanQuote(args.smsPermissionQuote);
  const notBookedQuote = cleanQuote(args.notBookedQuote);
  const prospectQuote = cleanQuote(args.prospectQuote);
  if (!smsPermissionQuote || !notBookedQuote || !prospectQuote) return null;
  return { smsPermissionQuote, notBookedQuote, prospectQuote };
}

function fingerprintOf(callId: string, quotes: QuoteSet) {
  return createHash("sha256").update(JSON.stringify({
    call: callId,
    smsPermissionQuote: quotes.smsPermissionQuote,
    notBookedQuote: quotes.notBookedQuote,
    prospectQuote: quotes.prospectQuote,
  })).digest("hex");
}

function phoneKey(phone: string) {
  return createHash("sha256").update(phone).digest("hex");
}

async function readBounded(req: NextRequest): Promise<{ ok: true; text: string } | Failure> {
  const declared = req.headers.get("content-length");
  if (declared !== null && declared !== "") {
    if (!/^\d+$/.test(declared)) return { ok: false, status: 400, error: "invalid_json" };
    if (Number(declared) > MAX_BODY_BYTES) return { ok: false, status: 413, error: "too_large" };
  }
  const reader = req.body?.getReader();
  if (!reader) return { ok: true, text: "" };
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, status: 413, error: "too_large" };
      }
      chunks.push(value);
    }
  } catch { return { ok: false, status: 400, error: "invalid_json" }; }
  const text = Buffer.concat(chunks).toString("utf8");
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) return { ok: false, status: 413, error: "too_large" };
  return { ok: true, text };
}

function toolResult(toolCallId: string, body: Record<string, unknown>) {
  return { toolCallId, result: JSON.stringify(body) };
}

function envelope(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const message = (payload as { message?: unknown }).message;
  if (!message || typeof message !== "object" || Array.isArray(message)) return null;
  const msg = message as { type?: unknown; call?: unknown; toolCallList?: unknown };
  if (msg.type !== "tool-calls") return null;
  if (!msg.call || typeof msg.call !== "object" || Array.isArray(msg.call)) return null;
  const callId = (msg.call as { id?: unknown }).id;
  if (typeof callId !== "string" || !token(callId)) return null;
  if (!Array.isArray(msg.toolCallList) || msg.toolCallList.length !== 1) return null;
  const entry = msg.toolCallList[0];
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  const toolId = (entry as { id?: unknown }).id;
  if (typeof toolId !== "string" || !token(toolId)) return null;
  const fn = (entry as { function?: unknown }).function;
  if (!fn || typeof fn !== "object" || Array.isArray(fn)) return null;
  return { callId, toolId, fn: fn as { name?: unknown; arguments?: unknown } };
}

function namesOf(message: Record<string, unknown>) {
  const names: string[] = [];
  const pull = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(pull); return; }
    const row = node as Record<string, unknown>;
    const fn = row.function;
    if (fn && typeof fn === "object" && !Array.isArray(fn) && typeof (fn as { name?: unknown }).name === "string") names.push((fn as { name: string }).name);
    if (typeof row.name === "string" && (row.type === "function" || row.role === "tool" || row.role === "tool_call_result" || row.role === "function")) names.push(row.name);
    if (Array.isArray(row.toolCalls)) row.toolCalls.forEach(pull);
  };
  pull(message.toolCalls);
  pull(message.toolCall);
  pull(message.function);
  if ((message.role === "tool" || message.role === "tool_calls" || message.role === "tool_call_result" || message.role === "function") && typeof message.name === "string") names.push(message.name);
  return names;
}

function textOf(message: Record<string, unknown>) {
  const value = typeof message.message === "string" ? message.message : typeof message.content === "string" ? message.content : "";
  return value.slice(0, 1500);
}

function argumentsUrgent(message: Record<string, unknown>) {
  const blobs: unknown[] = [];
  const pull = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(pull); return; }
    const row = node as Record<string, unknown>;
    const fn = row.function;
    if (fn && typeof fn === "object" && !Array.isArray(fn)) blobs.push((fn as { arguments?: unknown }).arguments);
    if (Array.isArray(row.toolCalls)) row.toolCalls.forEach(pull);
  };
  pull(message.toolCalls);
  pull(message.function);
  return blobs.some(blob => typeof blob === "string" ? /"kind"\s*:\s*"urgent"/.test(blob) : !!blob && typeof blob === "object" && (blob as { kind?: unknown }).kind === "urgent");
}

export function inspectDemoMessages(messages: unknown): Evidence | null {
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_MESSAGES) return null;
  const evidence: Evidence = { demo: false, eventCreate: false, bookingUncertain: false, booked: false, transfer: false, stop: false, decline: false, existing: false, support: false, vendor: false, wrong: false, spam: false, users: [] };
  for (const entry of messages) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const message = entry as Record<string, unknown>;
    const names = namesOf(message);
    if (names.includes("start_isolated_demo")) evidence.demo = true;
    if (names.includes(CALENDAR_CREATE) || names.includes("event.create")) evidence.eventCreate = true;
    if (names.includes("transferCall")) evidence.transfer = true;
    if (names.includes("record_receptionist_request") && argumentsUrgent(message)) evidence.transfer = true;
    const resultValue = message.result;
    const resultText = `${typeof resultValue === "string" ? resultValue : resultValue && typeof resultValue === "object" ? JSON.stringify(resultValue) : ""} ${message.role === "tool" || message.role === "tool_call_result" ? textOf(message) : ""}`.slice(0, 1500);
    const parsed = resultValue && typeof resultValue === "object" ? resultValue as { kind?: unknown; status?: unknown } : null;
    if ((names.includes(CALENDAR_CREATE) || names.includes("event.create")) && parsed?.status !== "confirmed" && parsed?.kind !== "calendar#event") evidence.bookingUncertain = true;
    if (parsed?.status === "confirmed" || parsed?.kind === "calendar#event") evidence.booked = true;
    if (/uncertain|failed/i.test(resultText) && /book|event|appointment|calendar/i.test(resultText)) evidence.bookingUncertain = true;
    if (/\bappointment booked\b|\bevent created\b|\byou(?: are|'re) booked\b/i.test(resultText)) evidence.booked = true;
    const role = message.role === "bot" || message.role === "assistant" ? "assistant" : message.role === "user" ? "user" : "other";
    const text = textOf(message);
    if (role === "user") {
      evidence.users.push(text);
      const n = norm(text);
      if (["stop", "stopall", "unsubscribe", "cancel", "end", "quit"].includes(n)) evidence.stop = true;
      if (/\b(not interested|no thanks|do not contact|dont contact|stop calling)\b/.test(n)) evidence.decline = true;
      if (/\b(existing customer|existing client|i am a customer|im a customer|already a client|current customer|my account)\b/.test(n)) evidence.existing = true;
      if (/\b(customer support|tech support|support ticket|billing issue|need support)\b/.test(n)) evidence.support = true;
      if (/\b(i am a vendor|im a vendor|we are a vendor|partnership opportunity)\b/.test(n)) evidence.vendor = true;
      if (/\bwrong number\b/.test(n)) evidence.wrong = true;
      if (/\b(this is spam|robocall|you have won)\b/.test(n)) evidence.spam = true;
    }
  }
  return evidence;
}

function explicitOptInOffer(original: string) {
  if (!original.includes("?")) return false;
  const n = norm(original);
  if (/\b(already|received|did you|have you gotten|have you already)\b/.test(n)) return false;
  if (/\b(not|dont|do not|wouldnt|wont|unless|what if|if you|only if|maybe|might)\b/.test(n)) return false;
  return /^(would you like|may i send you|can i send you|do you want) one follow up text( after this call)?$/.test(n);
}

function asksAlreadyBooked(original: string) {
  if (!original.includes("?")) return false;
  return /\b(already booked|already have an appointment|already scheduled|have you booked|did you book|did you already book|appointment already)\b/.test(norm(original));
}

function sameUtterance(message: string, quote: string) {
  const host = norm(message);
  const needle = norm(quote);
  return needle.length >= 2 && needle.length <= 240 && host === needle;
}

function directOptIn(message: string) {
  const n = norm(message);
  if (/[?]/.test(message)) return false;
  if (/\b(maybe|what if|if you|for example|the phrase|dont|do not|not|quoted|quote)\b/.test(n)) return false;
  return /^(please )?(text me|sms me|send me a text|send a text|you can text me)$/.test(n);
}

type Phase = "before_demo" | "during_demo" | "after_return";
type UserTurn = { text: string; lane: "real" | "demo" | "unknown"; phase: Phase | "unknown"; prior: string };

function activationIds(activations: unknown) {
  if (activations == null) return null;
  if (!Array.isArray(activations)) return new Set<string>();
  const ids = new Set<string>();
  for (const entry of activations) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return new Set<string>();
    const id = (entry as { assistantId?: unknown }).assistantId;
    if (typeof id !== "string" || !id) return new Set<string>();
    ids.add(id);
  }
  return ids;
}

function callerTurns(messages: unknown, activations: unknown) {
  if (!Array.isArray(messages)) return null;
  const known = activationIds(activations);
  const turns: UserTurn[] = [];
  let lane: UserTurn["lane"] = "unknown";
  let phase: UserTurn["phase"] = "before_demo";
  let started = false;
  let uncertain = false;
  let lastAssistant = "";
  let adjacentAssistant = false;
  const seeAssistant = (id: unknown) => {
    if (typeof id !== "string" || !id || (known && !known.has(id))) { lane = "unknown"; uncertain = true; return; }
    if (id === MAIN_ASSISTANT_ID) {
      if (phase === "during_demo") { lane = "unknown"; uncertain = true; return; }
      lane = "real";
      return;
    }
    if (id === DEMO_ASSISTANT_ID) {
      if (!started) { lane = "unknown"; uncertain = true; return; }
      lane = "demo";
      phase = "during_demo";
      return;
    }
    lane = "unknown";
    uncertain = true;
  };
  for (const entry of messages) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const message = entry as Record<string, unknown>;
    // Native results repeat tool names; only invocations transition lanes.
    const names = ["tool_call_result", "tool", "function"].includes(String(message.role)) ? [] : namesOf(message);
    if (names.includes("start_isolated_demo")) {
      if (lane !== "real" || phase !== "before_demo") { uncertain = true; lane = "unknown"; }
      else { started = true; lane = "demo"; phase = "during_demo"; }
    }
    if (names.includes("return_to_real_reception")) {
      if (!started || phase !== "during_demo") { uncertain = true; lane = "unknown"; }
      else { lane = "real"; phase = "after_return"; }
    }
    const role = message.role === "bot" || message.role === "assistant" ? "assistant" : message.role === "user" ? "user" : "other";
    if (role === "assistant") {
      if (typeof message.assistantId !== "string") { lane = "unknown"; uncertain = true; }
      else seeAssistant(message.assistantId);
      lastAssistant = textOf(message);
      adjacentAssistant = true;
    }
    else if (role === "user") {
      turns.push({ text: textOf(message), lane, phase, prior: adjacentAssistant ? lastAssistant : "" });
      adjacentAssistant = false;
    } else { adjacentAssistant = false; lastAssistant = ""; }
  }
  return { turns, started, uncertain };
}

function exclusion(text: string) {
  const n = norm(text);
  if (/\b(not interested|no thanks|do not contact|dont contact|stop calling)\b/.test(n)) return "declined";
  if (/\b(existing customer|existing client|i am a customer|im a customer|already a client|current customer|my account)\b/.test(n)) return "existing_customer";
  if (/\b(customer support|tech support|support ticket|billing issue|need support)\b/.test(n)) return "support";
  if (/\b(i am a vendor|im a vendor|we are a vendor|partnership opportunity)\b/.test(n)) return "vendor";
  if (/\bwrong number\b/.test(n)) return "wrong_number";
  if (/\b(this is spam|robocall|you have won)\b/.test(n)) return "spam";
  if (/\b(i already booked|i have an appointment|i booked (it|one|an appointment)|appointment is booked)\b/.test(n)) return "booked";
  return "";
}

function permissionTurn(turn: UserTurn, quote: string) {
  if (turn.lane !== "real" || (turn.phase !== "before_demo" && turn.phase !== "after_return")) return false;
  if (!sameUtterance(turn.text, quote)) return false;
  if (directOptIn(turn.text)) return true;
  const yes = new Set(["yes", "yeah", "yep", "yup", "sure", "ok", "okay", "please", "please do", "yes please"]);
  return yes.has(norm(turn.text)) && explicitOptInOffer(turn.prior);
}

function notBookedTurn(turn: UserTurn, quote: string) {
  if (turn.lane !== "real" || (turn.phase !== "before_demo" && turn.phase !== "after_return")) return false;
  if (!sameUtterance(turn.text, quote)) return false;
  const n = norm(turn.text);
  if (/\b(maybe|not sure|i think so|kind of|kinda|possibly|probably)\b/.test(n)) return false;
  if (/^(i havent booked( an appointment)?|i have not booked( an appointment)?|i didnt book|i did not book|no appointment|not yet booked|i havent scheduled|i have not scheduled)$/.test(n)) return true;
  const denial = new Set(["no", "nope", "nah", "not yet", "no not yet", "i havent", "i have not", "not booked"]);
  return denial.has(n) && asksAlreadyBooked(turn.prior);
}

export function followupDecision(messages: unknown, quotes: QuoteSet, activations?: unknown) {
  const evidence = inspectDemoMessages(messages);
  const spoken = callerTurns(messages, activations);
  if (!evidence || !spoken) return "transcript_unusable";
  if (evidence.eventCreate || evidence.booked) return "booked";
  if (evidence.bookingUncertain) return "booking_uncertain";
  if (evidence.transfer) return "urgent_transfer";
  if (evidence.stop) return "opt_out";
  if (spoken.uncertain || !spoken.started) return spoken.started ? "context_uncertain" : "no_demo";
  for (const turn of spoken.turns) {
    if (turn.lane === "unknown" && exclusion(turn.text)) return "context_uncertain";
    if (turn.lane === "real" && exclusion(turn.text)) return exclusion(turn.text);
  }
  const prospect = spoken.turns.some(turn => turn.lane === "real" && turn.phase === "before_demo" && sameUtterance(turn.text, quotes.prospectQuote) && /\b(demo|receptionist|my business|our business|interested|pricing|how it works|missed calls|automate)\b/.test(norm(turn.text)));
  if (!prospect) return spoken.turns.some(turn => sameUtterance(turn.text, quotes.prospectQuote)) ? "prospect_rejected" : "quote_mismatch";
  if (!spoken.turns.some(turn => permissionTurn(turn, quotes.smsPermissionQuote))) {
    return spoken.turns.some(turn => sameUtterance(turn.text, quotes.smsPermissionQuote)) ? "permission_rejected" : "quote_mismatch";
  }
  if (!spoken.turns.some(turn => notBookedTurn(turn, quotes.notBookedQuote))) {
    return spoken.turns.some(turn => sameUtterance(turn.text, quotes.notBookedQuote)) ? "not_booked_unclear" : "quote_mismatch";
  }
  return "eligible";
}

function millis(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function childSidOf(call: Record<string, unknown>) {
  const overrides = call.assistantOverrides;
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) return null;
  const values = (overrides as { variableValues?: unknown }).variableValues;
  if (!values || typeof values !== "object" || Array.isArray(values)) return null;
  const sid = (values as Record<string, unknown>)["twilio-callsid"];
  return typeof sid === "string" && isCallSid(sid) ? sid : null;
}

function parseLeg(body: unknown, sid: string): Leg | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const row = body as Record<string, unknown>;
  if (row.sid !== sid) return null;
  return {
    sid,
    parentCallSid: typeof row.parent_call_sid === "string" ? row.parent_call_sid : "",
    to: typeof row.to === "string" ? row.to : "",
    from: typeof row.from === "string" ? row.from : "",
    direction: typeof row.direction === "string" ? row.direction : "",
    status: typeof row.status === "string" ? row.status : "",
    startTime: row.start_time ?? null,
    endTime: row.end_time ?? null,
  };
}

async function fetchVapi(id: string, fetchImpl: typeof fetch) {
  const key = process.env.VAPI_PRIVATE_KEY;
  if (!key) throw new Error("demo_followup_unconfigured");
  const response = await fetchImpl(`https://api.vapi.ai/call/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("vapi_not_ready");
  const body = await response.json();
  if (!body || typeof body !== "object" || Array.isArray(body) || (body as { id?: unknown }).id !== id) return null;
  return body as Record<string, unknown>;
}

async function fetchTwilio(sid: string, fetchImpl: typeof fetch): Promise<Leg | "missing" | "retry"> {
  const account = process.env.TWILIO_ACCOUNT_SID;
  const tokenValue = process.env.TWILIO_AUTH_TOKEN;
  if (!account || !tokenValue || !isCallSid(sid)) return "retry";
  const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(account)}/Calls/${sid}.json`, {
    headers: { Authorization: `Basic ${Buffer.from(`${account}:${tokenValue}`).toString("base64")}` },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (response.status === 404) return "missing";
  if (!response.ok) return "retry";
  return parseLeg(await response.json(), sid) ?? "retry";
}

function correlated(call: Record<string, unknown>, child: Leg, parent: Leg) {
  const childStart = millis(child.startTime), childEnd = millis(child.endTime), parentStart = millis(parent.startTime), parentEnd = millis(parent.endTime);
  const vapiStart = millis(call.startedAt), vapiEnd = millis(call.endedAt);
  if (childStart === null || childEnd === null || parentStart === null || parentEnd === null || vapiStart === null || vapiEnd === null) return "pending";
  if (!(childStart <= childEnd && parentStart <= parentEnd && vapiStart <= vapiEnd)) return "stale";
  if (childStart < parentStart - SKEW_MS || childEnd > parentEnd + SKEW_MS) return "stale";
  if (vapiStart < childStart - SKEW_MS || vapiEnd > childEnd + SKEW_MS || Math.abs(vapiEnd - childEnd) > SKEW_MS) return "stale";
  return "ok";
}

async function bindCall(store: InquiryStore, call: Record<string, unknown>, fetchImpl: typeof fetch): Promise<{ ok: true; binding: Binding } | { ok: false; status: "pending" | "web_call" | "unbound" | "stale" | "wrong_recipient" | "business_number" }> {
  if (call.type === "webCall") return { ok: false, status: "web_call" };
  if (call.type !== "inboundPhoneCall") return { ok: false, status: "unbound" };
  if (call.phoneNumberId !== process.env.VOICE_VAPI_PHONE_NUMBER_ID || call.phoneNumberId === "") return { ok: false, status: "unbound" };
  const sid = childSidOf(call);
  if (!sid) return { ok: false, status: "unbound" };
  const child = await fetchTwilio(sid, fetchImpl);
  if (child === "retry") return { ok: false, status: "pending" };
  if (child === "missing") return { ok: false, status: "unbound" };
  const sip = process.env.VOICE_VAPI_SIP_URI || "";
  if (!sip || child.to !== sip || child.status !== "completed" || !isCallSid(child.parentCallSid) || child.parentCallSid === child.sid) return { ok: false, status: "unbound" };
  const parent = await fetchTwilio(child.parentCallSid, fetchImpl);
  if (parent === "retry") return { ok: false, status: "pending" };
  if (parent === "missing") return { ok: false, status: "unbound" };
  const business = process.env.TWILIO_PHONE_NUMBER || "";
  if (parent.direction !== "inbound" || parent.to !== business || parent.sid !== child.parentCallSid) return { ok: false, status: "unbound" };
  if (!e164(parent.from)) return { ok: false, status: "unbound" };
  if (parent.from === business) return { ok: false, status: "business_number" };
  const marker = await store.get<{ route?: string }>(`voice-route/${parent.sid}.json`);
  if (marker?.route !== "receptionist") return { ok: false, status: "unbound" };
  const customer = call.customer && typeof call.customer === "object" ? (call.customer as { number?: unknown }).number : undefined;
  if (typeof customer !== "string" || customer.trim() !== parent.from) return { ok: false, status: "wrong_recipient" };
  const timing = correlated(call, child, parent);
  if (timing === "pending") return { ok: false, status: "pending" };
  if (timing === "stale") return { ok: false, status: "stale" };
  return { ok: true, binding: { phone: parent.from, parentSid: parent.sid, childSid: child.sid } };
}

async function saveWhole<T extends { fingerprint?: string; vapiCallId: string }>(store: InquiryStore, key: string, record: T, same: (saved: T) => boolean): Promise<{ ok: true; saved: T } | Failure> {
  const existing = await store.get<T>(key);
  if (existing) {
    if (!same(existing)) return { ok: false, status: 409, error: "idempotency_conflict" };
    return { ok: true, saved: existing };
  }
  if (!await store.put(key, record)) {
    const raced = await store.get<T>(key);
    if (!raced) return { ok: false, status: 503, error: "not_saved" };
    if (!same(raced)) return { ok: false, status: 409, error: "idempotency_conflict" };
    return { ok: true, saved: raced };
  }
  const read = await store.get<T>(key);
  if (!read || !same(read)) return { ok: false, status: 503, error: "readback_failed" };
  return { ok: true, saved: read };
}

async function persistSuppression(store: InquiryStore, key: string, value: unknown) {
  try {
    if (await store.get(key)) return true;
    if (!await store.put(key, value)) return !!(await store.get(key));
    return !!(await store.get(key));
  } catch { return false; }
}

async function finalize(store: InquiryStore, callId: string, status: string, extra: Partial<FollowupResult> = {}) {
  try {
    const key = `voice-demo-results/${callId}.json`;
    const current = await store.get<FollowupResult>(key);
    if (!(current?.final && (current.ok || current.uncertain || current.code === 21610 || current.status === "sent"))) {
      const result: FollowupResult = { final: true, status, at: new Date().toISOString(), ...extra };
      if (!await store.put(key, result, true)) return false;
      const read = await store.get<FollowupResult>(key);
      if (!read?.final || read.status !== status) return false;
      const request = await store.get<FollowupRequest>(`voice-demo-request/${callId}.json`);
      if (request?.vapiCallId === callId && request.fingerprint) {
        await store.put(`voice-demo-request/${callId}.json`, { ...request, status }, true);
        const requestRead = await store.get<FollowupRequest>(`voice-demo-request/${callId}.json`);
        if (requestRead?.status !== status) return false;
      }
    }
    await store.remove(`voice-demo-jobs/${callId}.json`);
    return !(await store.get(`voice-demo-jobs/${callId}.json`));
  } catch { return false; }
}

async function bump(store: InquiryStore, job: FollowupJob) {
  const next = { ...job, attempts: job.attempts + 1 };
  await store.put(`voice-demo-jobs/${job.vapiCallId}.json`, next, true);
}

async function sendDemoText(to: string, fetchImpl: typeof fetch): Promise<SmsResult> {
  const account = process.env.TWILIO_ACCOUNT_SID, tokenValue = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_PHONE_NUMBER;
  if (!account || !tokenValue || !from || !e164(from) || !e164(to) || to === from) throw new Error("demo_followup_unconfigured");
  try {
    const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(account)}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${account}:${tokenValue}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: to, From: from, Body: DEMO_FOLLOWUP_TEXT }),
      signal: AbortSignal.timeout(10000),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok && typeof body.sid === "string") return { ok: true, sid: body.sid };
    return { ok: false, code: Number(body.code) || response.status, uncertain: response.status >= 500 || response.ok };
  } catch { return { ok: false, uncertain: true }; }
}

async function deliver(store: InquiryStore, callId: string, binding: Binding, fetchImpl: typeof fetch): Promise<"pending" | "done"> {
  const ids = { parentSid: binding.parentSid, childSid: binding.childSid };
  if (process.env.VOICE_DEMO_FOLLOWUP_ENABLED !== "true") return await finalize(store, callId, "disabled", ids) ? "done" : "pending";
  const optoutKey = `voice-demo-optout/${phoneKey(binding.phone)}.json`;
  const bookingKey = `voice-demo-booking/${phoneKey(binding.phone)}.json`;
  const phoneClaim = `voice-demo-phone/${phoneKey(binding.phone)}.json`;
  const callClaim = `voice-demo-claims/${callId}.json`;
  const blocked = async () => {
    const booking = await store.get(bookingKey);
    const opted = await store.get(optoutKey);
    if (!booking && !opted) return false;
    return await finalize(store, callId, booking ? "suppressed" : "opt_out", ids) ? "done" as const : "pending" as const;
  };
  try { const early = await blocked(); if (early) return early; } catch { return "pending"; }
  const prior = await store.get<FollowupResult>(`voice-demo-results/${callId}.json`);
  if (prior?.final) { await store.remove(`voice-demo-jobs/${callId}.json`); return "done"; }
  type Claim = { at?: string; state?: string; phone?: string; ok?: boolean; uncertain?: boolean; code?: number; sid?: string };
  let claim: Claim | null;
  try { claim = await store.get<Claim>(callClaim); } catch { return "pending"; }
  if (claim?.state === "provider") {
    if (claim.code === 21610 && !await persistSuppression(store, optoutKey, { at: new Date().toISOString(), phone: binding.phone })) return "pending";
    const status = claim.ok ? "sent" : claim.code === 21610 ? "opt_out" : "uncertain";
    return await finalize(store, callId, status, { ok: claim.ok === true, uncertain: claim.uncertain === true, code: claim.code, sid: claim.sid, ...ids }) ? "done" : "pending";
  }
  const age = Date.now() - Date.parse(claim?.at || "");
  if (claim?.state === "dispatched") {
    if (!Number.isFinite(age) || age < 15000) return "pending";
    return await finalize(store, callId, "uncertain", { ok: false, uncertain: true, ...ids }) ? "done" : "pending";
  }
  if (claim?.state === "ready" && (!Number.isFinite(age) || age < 15000)) return "pending";
  if (claim && claim.state !== "ready") return "pending";
  if (!claim) {
    try {
      if (!await store.put(callClaim, { at: new Date().toISOString(), state: "ready", phone: binding.phone })) return "pending";
      const read = await store.get<Claim>(callClaim);
      if (!read || read.state !== "ready") { await store.remove(callClaim); return "pending"; }
    } catch { await store.remove(callClaim).catch(() => undefined); return "pending"; }
  }
  let existingPhone: { vapiCallId?: string } | null;
  try { existingPhone = await store.get<{ vapiCallId?: string }>(phoneClaim); } catch { return "pending"; }
  if (existingPhone && existingPhone.vapiCallId !== callId) return await finalize(store, callId, "prior_phone", ids) ? "done" : "pending";
  if (!existingPhone) {
    try {
      if (!await store.put(phoneClaim, { at: new Date().toISOString(), vapiCallId: callId })) {
        const raced = await store.get<{ vapiCallId?: string }>(phoneClaim);
        if (!raced) return "pending";
        if (raced.vapiCallId !== callId) return await finalize(store, callId, "prior_phone", ids) ? "done" : "pending";
      }
      const phoneRead = await store.get<{ vapiCallId?: string }>(phoneClaim);
      if (!phoneRead || phoneRead.vapiCallId !== callId) return "pending";
    } catch { return "pending"; }
  }
  try { const again = await blocked(); if (again) return again; } catch { return "pending"; }
  try {
    if (!await store.put(callClaim, { at: new Date().toISOString(), state: "dispatched", phone: binding.phone }, true)) return "pending";
    const dispatched = await store.get<Claim>(callClaim);
    if (!dispatched || dispatched.state !== "dispatched") {
      await store.put(callClaim, { at: new Date().toISOString(), state: "ready", phone: binding.phone }, true);
      return "pending";
    }
  } catch { return "pending"; }
  // Create-only gate: concurrent recovery of an old ready claim must have
  // exactly one dispatcher. Never reclaim this gate after uncertain acceptance.
  const dispatchGate = `voice-demo-dispatch/${callId}.json`;
  try {
    if (!await store.put(dispatchGate, { at: new Date().toISOString() })) return "pending";
  } catch { return "pending"; }
  const sent = await sendDemoText(binding.phone, fetchImpl);
  if (!sent.ok && !sent.uncertain && sent.code !== 21610) {
    await store.remove(callClaim);
    // Keep phone ownership bound to this call across definite-rejection retries.
    await store.remove(dispatchGate);
    throw new Error("demo_followup_rejected");
  }
  const provider: Claim = { at: new Date().toISOString(), state: "provider", phone: binding.phone, ok: sent.ok, uncertain: sent.uncertain === true, code: sent.code, sid: sent.sid };
  if (!await store.put(callClaim, provider, true)) return "pending";
  const recorded = await store.get<Claim>(callClaim);
  if (!recorded || recorded.state !== "provider" || recorded.ok !== sent.ok || recorded.code !== sent.code) return "pending";
  if (sent.code === 21610 && !await persistSuppression(store, optoutKey, { at: new Date().toISOString(), phone: binding.phone })) return "pending";
  const status = sent.ok ? "sent" : sent.code === 21610 ? "opt_out" : "uncertain";
  return await finalize(store, callId, status, { ok: sent.ok, uncertain: sent.uncertain === true, code: sent.code, sid: sent.sid, ...ids }) ? "done" : "pending";
}

function transcriptOf(call: Record<string, unknown>) {
  const artifact = call.artifact;
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) return null;
  const messages = (artifact as { messages?: unknown }).messages;
  const top = call.messages;
  if (Array.isArray(top) && Array.isArray(messages) && JSON.stringify(top) !== JSON.stringify(messages)) return "conflict" as const;
  return messages;
}

export async function processDemoFollowupJob(store: InquiryStore, vapiCallId: string, deps: DemoDeps = {}) {
  if (!token(vapiCallId)) return "done";
  const fetchImpl = deps.fetchImpl ?? fetch;
  const job = await store.get<FollowupJob>(`voice-demo-jobs/${vapiCallId}.json`);
  if (!job || job.vapiCallId !== vapiCallId) return "done";
  const prior = await store.get<FollowupResult>(`voice-demo-results/${vapiCallId}.json`);
  if (prior?.final) { await store.remove(`voice-demo-jobs/${vapiCallId}.json`); return "done"; }
  const age = (deps.now ?? Date.now)() - Date.parse(job.receivedAt);
  const expired = job.attempts >= MAX_ATTEMPTS || (Number.isFinite(age) && age > 20 * 60 * 1000);
  let call: Record<string, unknown> | null;
  try { call = await fetchVapi(vapiCallId, fetchImpl); }
  catch {
    if (expired) return await finalize(store, vapiCallId, "unverified") ? "done" : "pending";
    await bump(store, job); return "pending";
  }
  const transcript = call ? transcriptOf(call) : null;
  if (transcript === "conflict") return await finalize(store, vapiCallId, "transcript_unusable") ? "done" : "pending";
  if (!call || call.status !== "ended" || typeof call.endedAt !== "string" || !Array.isArray(transcript) || transcript.length < 1) {
    if (expired) return await finalize(store, vapiCallId, "unverified") ? "done" : "pending";
    await bump(store, job);
    return "pending";
  }
  const messages = transcript;
  const evidence = inspectDemoMessages(messages);
  if (!evidence) return await finalize(store, vapiCallId, "unverified") ? "done" : "pending";
  const bound = await bindCall(store, call, fetchImpl);
  if (!bound.ok && bound.status === "pending") {
    if (expired) return await finalize(store, vapiCallId, "unverified") ? "done" : "pending";
    await bump(store, job); return "pending";
  }
  if (!bound.ok) return await finalize(store, vapiCallId, bound.status) ? "done" : "pending";
  const ids = { parentSid: bound.binding.parentSid, childSid: bound.binding.childSid };
  if (evidence.stop || evidence.eventCreate || evidence.booked || evidence.bookingUncertain) {
    if (evidence.stop && !await persistSuppression(store, `voice-demo-optout/${phoneKey(bound.binding.phone)}.json`, { at: new Date().toISOString(), phone: bound.binding.phone })) return "pending";
    if ((evidence.eventCreate || evidence.booked || evidence.bookingUncertain) && !await persistSuppression(store, `voice-demo-booking/${phoneKey(bound.binding.phone)}.json`, { at: new Date().toISOString(), phone: bound.binding.phone, vapiCallId, parentSid: bound.binding.parentSid })) return "pending";
    const status = evidence.eventCreate || evidence.booked ? "suppressed" : evidence.bookingUncertain ? "booking_uncertain" : "opt_out";
    return await finalize(store, vapiCallId, status, ids) ? "done" : "pending";
  }
  const request = await store.get<FollowupRequest>(`voice-demo-request/${vapiCallId}.json`);
  if (!request) {
    if (expired) return await finalize(store, vapiCallId, "unverified") ? "done" : "pending";
    await bump(store, job); return "pending";
  }
  if (request.vapiCallId !== vapiCallId) return await finalize(store, vapiCallId, "unverified") ? "done" : "pending";
  const activations = call.artifact && typeof call.artifact === "object" && !Array.isArray(call.artifact) ? (call.artifact as { assistantActivations?: unknown }).assistantActivations : undefined;
  const decision = followupDecision(messages, request, activations);
  if (decision !== "eligible") {
    if ((decision === "booked" || decision === "booking_uncertain") && !await persistSuppression(store, `voice-demo-booking/${phoneKey(bound.binding.phone)}.json`, { at: new Date().toISOString(), phone: bound.binding.phone, vapiCallId, parentSid: bound.binding.parentSid })) return "pending";
    if (decision === "opt_out" && !await persistSuppression(store, `voice-demo-optout/${phoneKey(bound.binding.phone)}.json`, { at: new Date().toISOString(), phone: bound.binding.phone })) return "pending";
    return await finalize(store, vapiCallId, decision, ids) ? "done" : "pending";
  }
  return deliver(store, vapiCallId, bound.binding, fetchImpl);
}

export async function retryDemoFollowupJobs(store: InquiryStore, deadline = Date.now() + 20000, deps: DemoDeps = {}) {
  let processed = 0, pending = 0;
  const jobs = await store.list("voice-demo-jobs");
  const batch = jobs.slice(0, 10);
  for (const job of batch) {
    if (Date.now() > deadline) return { processed, pending, hasMore: true };
    const id = job.name.replace(/\.json$/, "");
    try { if (await processDemoFollowupJob(store, id, deps) === "pending") pending++; else processed++; }
    catch { pending++; }
  }
  return { processed, pending, hasMore: jobs.length > 10 };
}

export async function receiveDemoFollowupRequest(req: NextRequest, store?: InquiryStore) {
  if (!process.env.VOICE_VAPI_ACTION_SECRET) return NextResponse.json({ ok: false, error: "unconfigured" }, { status: 403 });
  if (!authorized(req.headers.get("x-voice-agent-secret"))) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 403 });
  const body = await readBounded(req);
  if (!body.ok) return NextResponse.json({ ok: false, error: body.error }, { status: body.status });
  let payload: unknown;
  try { payload = JSON.parse(body.text); } catch { return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }); }
  const message = envelope(payload);
  if (!message) return NextResponse.json({ ok: false, error: "invalid_tool_call" }, { status: 400 });
  if (message.fn.name !== "request_demo_followup") {
    return NextResponse.json({ results: [toolResult(message.toolId, { ok: false, status: "rejected", sent: false })] });
  }
  let args = message.fn.arguments;
  if (typeof args === "string") { try { args = JSON.parse(args); } catch { args = null; } }
  const quotes = parseQuotes(args);
  if (!quotes) return NextResponse.json({ results: [toolResult(message.toolId, { ok: false, status: "rejected", sent: false })] });
  const bucket = store ?? inquiryStore(Date.now() + 6000);
  try {
    await bucket.ensure();
    const fingerprint = fingerprintOf(message.callId, quotes);
    const record: FollowupRequest = { vapiCallId: message.callId, toolCallId: message.toolId, ...quotes, fingerprint, receivedAt: new Date().toISOString(), status: "pending_verification" };
    const saved = await saveWhole(bucket, `voice-demo-request/${message.callId}.json`, record, current => current.vapiCallId === message.callId && current.fingerprint === fingerprint && current.smsPermissionQuote === quotes.smsPermissionQuote);
    if (!saved.ok) return NextResponse.json({ ok: false, error: saved.error }, { status: saved.status });
    return NextResponse.json({ results: [toolResult(message.toolId, { ok: true, status: "pending_verification", sent: false })] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("[demo_followup_request_failed]", message.callId);
    return NextResponse.json({ ok: false, error: "not_saved" }, { status: 503 });
  }
}

export async function receiveDemoEndReport(req: NextRequest, store?: InquiryStore) {
  if (!process.env.VOICE_VAPI_ACTION_SECRET) return NextResponse.json({ ok: false, error: "unconfigured" }, { status: 403 });
  if (!authorized(req.headers.get("x-voice-agent-secret"))) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 403 });
  const body = await readBounded(req);
  if (!body.ok) return NextResponse.json({ ok: false, error: body.error }, { status: body.status });
  let payload: unknown;
  try { payload = JSON.parse(body.text); } catch { return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ ok: false, error: "invalid_report" }, { status: 400 });
  const message = (payload as { message?: unknown }).message;
  if (!message || typeof message !== "object" || Array.isArray(message)) return NextResponse.json({ ok: false, error: "invalid_report" }, { status: 400 });
  const msg = message as { type?: unknown; call?: unknown };
  if (msg.type !== "end-of-call-report" || !msg.call || typeof msg.call !== "object" || Array.isArray(msg.call)) return NextResponse.json({ ok: false, error: "invalid_report" }, { status: 400 });
  const callId = (msg.call as { id?: unknown }).id;
  if (typeof callId !== "string" || !token(callId)) return NextResponse.json({ ok: false, error: "invalid_report" }, { status: 400 });
  const bucket = store ?? inquiryStore(Date.now() + 6000);
  try {
    await bucket.ensure();
    const record: FollowupJob = { vapiCallId: callId, receivedAt: new Date().toISOString(), attempts: 0 };
    const saved = await saveWhole(bucket, `voice-demo-jobs/${callId}.json`, record, current => current.vapiCallId === callId && typeof current.attempts === "number");
    if (!saved.ok) return NextResponse.json({ ok: false, error: saved.error }, { status: saved.status });
    return NextResponse.json({ ok: true, status: "pending", sent: false }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("[demo_followup_report_failed]", callId);
    return NextResponse.json({ ok: false, error: "not_saved" }, { status: 503 });
  }
}
