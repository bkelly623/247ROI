import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { inquiryStore, notifyInquiry, type InquiryStore, type SavedInquiry } from "@/lib/inquiries";
import { PUBLIC_SUPPORT_EMAIL } from "@/lib/voice-transfer";

const e164 = (value: string) => /^\+[1-9]\d{7,14}$/.test(value);
const token = (value: string) => /^[A-Za-z0-9_-]{1,80}$/.test(value);
const emailOk = (value: string) => /^[^\s@<>]{1,64}@[^\s@<>]{1,190}$/.test(value) && value.length <= 254;
const EMERGENCY = "If anyone is in immediate danger, hang up and dial 911. This service cannot dispatch emergency services.";
const MAX_BODY_BYTES = 256 * 1024;

export type VoiceRequestRecord = {
  requestId: string;
  vapiCallId: string;
  toolCallId: string;
  kind: "general" | "urgent";
  name: string;
  callbackNumber: string;
  email: string;
  summary: string;
  receivedAt: string;
  fingerprint: string;
};

type ParsedRequest = { kind: "general" | "urgent"; name: string; callbackNumber: string; email: string; summary: string };

type RequestIndex = VoiceRequestRecord;

type Failure = { ok: false; status: number; error: string };
type Commit =
  | { ok: true; requestId: string; notificationStatus: "notified" | "pending" }
  | Failure;

function authorized(header: string | null) {
  const secret = process.env.VOICE_VAPI_ACTION_SECRET;
  if (!secret || !header) return false;
  const a = createHash("sha256").update(secret).digest();
  const b = createHash("sha256").update(header).digest();
  return timingSafeEqual(a, b);
}

function clean(value: unknown, min: number, max: number) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text.length < min || text.length > max || /[\u0000-\u001f]/.test(text)) return null;
  return text;
}

export function parseReceptionistRequest(raw: unknown): ParsedRequest | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const args = raw as Record<string, unknown>;
  if (Object.keys(args).some(key => !["kind", "name", "callbackNumber", "email", "summary"].includes(key))) return null;
  if (args.kind !== "general" && args.kind !== "urgent") return null;
  const kind = args.kind === "urgent" ? "urgent" : "general";
  const name = clean(args.name, 2, 80);
  const summary = clean(args.summary, 5, 500);
  const callbackNumber = typeof args.callbackNumber === "string" ? args.callbackNumber.trim() : "";
  if (!name || !summary || !e164(callbackNumber)) return null;
  if (e164(process.env.TWILIO_PHONE_NUMBER || "") && callbackNumber === process.env.TWILIO_PHONE_NUMBER) return null;
  let email = "";
  if (args.email !== undefined && args.email !== "") {
    if (typeof args.email !== "string" || !emailOk(args.email.trim())) return null;
    email = args.email.trim();
  }
  return { kind, name, callbackNumber, email, summary };
}

function requestFingerprint(callId: string, toolId: string, parsed: ParsedRequest) {
  return createHash("sha256").update(JSON.stringify({ ...parsed, call: callId, tool: toolId })).digest("hex");
}

function result(toolCallId: string, body: { ok: boolean; requestId: string | null; notificationStatus: string }) {
  return { toolCallId, result: JSON.stringify({ ...body, humanCallbackPromised: false, emergency: EMERGENCY, supportEmail: PUBLIC_SUPPORT_EMAIL }) };
}

function fail(status: number, error: string): Failure {
  return { ok: false, status, error };
}

function isCompleteIndex(value: Partial<RequestIndex> | null): value is RequestIndex {
  return !!value
    && typeof value.requestId === "string"
    && value.requestId.length > 0
    && typeof value.receivedAt === "string"
    && value.receivedAt.length > 0
    && typeof value.fingerprint === "string"
    && value.fingerprint.length > 0
    && typeof value.vapiCallId === "string"
    && typeof value.toolCallId === "string"
    && (value.kind === "general" || value.kind === "urgent")
    && typeof value.name === "string"
    && typeof value.callbackNumber === "string"
    && typeof value.email === "string"
    && typeof value.summary === "string";
}

function indexAgrees(index: RequestIndex, callId: string, toolId: string, parsed: ParsedRequest, fingerprint: string) {
  return index.fingerprint === fingerprint
    && index.vapiCallId === callId
    && index.toolCallId === toolId
    && index.kind === parsed.kind
    && index.name === parsed.name
    && index.callbackNumber === parsed.callbackNumber
    && index.email === parsed.email
    && index.summary === parsed.summary;
}

function sameVoice(saved: VoiceRequestRecord, expected: VoiceRequestRecord) {
  return saved.requestId === expected.requestId
    && saved.vapiCallId === expected.vapiCallId
    && saved.toolCallId === expected.toolCallId
    && saved.kind === expected.kind
    && saved.name === expected.name
    && saved.callbackNumber === expected.callbackNumber
    && saved.email === expected.email
    && saved.summary === expected.summary
    && saved.receivedAt === expected.receivedAt
    && saved.fingerprint === expected.fingerprint;
}

function inquiryFrom(record: VoiceRequestRecord): SavedInquiry {
  return {
    submissionId: record.requestId,
    name: record.name,
    phone: record.callbackNumber,
    email: record.email,
    message: `[${record.kind}] ${record.summary}`,
    smsConsent: false,
    reviewConsent: false,
    topic: "ai-receptionist",
    source: "/voice/receptionist",
    campaign: `voice-${record.kind}`,
    receivedAt: record.receivedAt,
    fingerprint: record.fingerprint,
    ipHash: "voice-receptionist",
    consentVersion: "contact-2026-10",
  };
}

function sameInquiry(saved: SavedInquiry, expected: SavedInquiry) {
  return saved.submissionId === expected.submissionId
    && saved.fingerprint === expected.fingerprint
    && saved.receivedAt === expected.receivedAt
    && saved.name === expected.name
    && saved.phone === expected.phone
    && (saved.email || "") === expected.email
    && saved.message === expected.message
    && saved.topic === expected.topic
    && saved.campaign === expected.campaign
    && saved.smsConsent === false;
}

async function readBounded(req: NextRequest): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
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
  } catch {
    return { ok: false, status: 400, error: "invalid_json" };
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) return { ok: false, status: 413, error: "too_large" };
  return { ok: true, text };
}

function envelope(payload: unknown): { callId: string; tools: { id: string; function?: { name?: string; arguments?: unknown } }[] } | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const message = (payload as { message?: unknown }).message;
  if (!message || typeof message !== "object" || Array.isArray(message)) return null;
  const msg = message as { type?: unknown; call?: unknown; toolCallList?: unknown };
  if (msg.type !== "tool-calls") return null;
  if (!msg.call || typeof msg.call !== "object" || Array.isArray(msg.call)) return null;
  const callId = (msg.call as { id?: unknown }).id;
  if (typeof callId !== "string" || !token(callId)) return null;
  if (!Array.isArray(msg.toolCallList) || msg.toolCallList.length < 1 || msg.toolCallList.length > 3) return null;
  const tools = [];
  for (const entry of msg.toolCallList) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const id = (entry as { id?: unknown }).id;
    if (typeof id !== "string") return null;
    const fn = (entry as { function?: unknown }).function;
    const tool: { id: string; function?: { name?: string; arguments?: unknown } } = { id };
    if (fn && typeof fn === "object" && !Array.isArray(fn)) tool.function = fn as { name?: string; arguments?: unknown };
    tools.push(tool);
  }
  return { callId, tools };
}

async function ensureRecord<T>(bucket: InquiryStore, key: string, value: T, same: (saved: T, expected: T) => boolean): Promise<{ ok: true; saved: T } | Failure> {
  let saved = await bucket.get<T>(key);
  if (saved) {
    if (!same(saved, value)) return fail(409, "idempotency_conflict");
    return { ok: true, saved };
  }
  const wrote = await bucket.put(key, value);
  if (!wrote) {
    saved = await bucket.get<T>(key);
    if (!saved) return fail(503, "not_saved");
    if (!same(saved, value)) return fail(409, "idempotency_conflict");
    return { ok: true, saved };
  }
  saved = await bucket.get<T>(key);
  if (!saved || !same(saved, value)) return fail(503, "readback_failed");
  return { ok: true, saved };
}

async function commitReceptionistRequest(bucket: InquiryStore, callId: string, toolId: string, parsed: ParsedRequest, send: typeof fetch): Promise<Commit> {
  await bucket.ensure();
  const fingerprint = requestFingerprint(callId, toolId, parsed);
  const indexKey = `voice-request-index/${callId}/${toolId}.json`;
  let prior = await bucket.get<Partial<RequestIndex>>(indexKey);
  if (!prior) {
    const created: RequestIndex = {
      requestId: randomUUID(),
      vapiCallId: callId,
      toolCallId: toolId,
      ...parsed,
      receivedAt: new Date().toISOString(),
      fingerprint,
    };
    if (!await bucket.put(indexKey, created)) {
      prior = await bucket.get<Partial<RequestIndex>>(indexKey);
      if (!prior?.requestId) return fail(503, "not_saved");
    } else {
      const read = await bucket.get<RequestIndex>(indexKey);
      if (!read || !isCompleteIndex(read) || read.requestId !== created.requestId || read.fingerprint !== created.fingerprint || read.receivedAt !== created.receivedAt) {
        return fail(503, "readback_failed");
      }
      prior = read;
    }
  }
  if (!prior || typeof prior.requestId !== "string" || prior.requestId.length === 0) return fail(503, "not_saved");

  let record: VoiceRequestRecord;
  if (isCompleteIndex(prior)) {
    if (!indexAgrees(prior, callId, toolId, parsed, fingerprint)) return fail(409, "idempotency_conflict");
    record = {
      requestId: prior.requestId,
      vapiCallId: prior.vapiCallId,
      toolCallId: prior.toolCallId,
      kind: prior.kind,
      name: prior.name,
      callbackNumber: prior.callbackNumber,
      email: prior.email,
      summary: prior.summary,
      receivedAt: prior.receivedAt,
      fingerprint: prior.fingerprint,
    };
  } else {
    const existing = await bucket.get<VoiceRequestRecord>(`voice-requests/${prior.requestId}.json`);
    if (existing) {
      if (existing.requestId !== prior.requestId || existing.fingerprint !== fingerprint || existing.vapiCallId !== callId || existing.toolCallId !== toolId) {
        return fail(409, "idempotency_conflict");
      }
      record = existing;
    } else {
      record = { requestId: prior.requestId, vapiCallId: callId, toolCallId: toolId, ...parsed, receivedAt: new Date().toISOString(), fingerprint };
    }
  }

  const voice = await ensureRecord(bucket, `voice-requests/${record.requestId}.json`, record, sameVoice);
  if (!voice.ok) return voice;
  const inquiry = inquiryFrom(voice.saved);
  const submission = await ensureRecord(bucket, `submissions/${voice.saved.requestId}.json`, inquiry, sameInquiry);
  if (!submission.ok) return submission;
  await notifyInquiry(submission.saved, bucket, send);
  const receipt = await bucket.get<{ messageId?: number }>(`receipts/${voice.saved.requestId}.json`);
  return {
    ok: true,
    requestId: voice.saved.requestId,
    notificationStatus: receipt?.messageId ? "notified" : "pending",
  };
}

export async function receiveReceptionistAction(req: NextRequest, store?: InquiryStore, send: typeof fetch = fetch) {
  if (!process.env.VOICE_VAPI_ACTION_SECRET) return NextResponse.json({ ok: false, error: "unconfigured" }, { status: 403 });
  if (!authorized(req.headers.get("x-voice-agent-secret"))) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 403 });
  const body = await readBounded(req);
  if (!body.ok) return NextResponse.json({ ok: false, error: body.error }, { status: body.status });
  let payload: unknown;
  try { payload = JSON.parse(body.text); } catch { return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }); }
  const message = envelope(payload);
  if (!message) return NextResponse.json({ ok: false, error: "invalid_tool_call" }, { status: 400 });
  const bucket = store ?? inquiryStore(Date.now() + 6000);
  const results = [];
  for (const tool of message.tools) {
    if (!token(tool.id)) {
      results.push(result("rejected", { ok: false, requestId: null, notificationStatus: "rejected" }));
      continue;
    }
    if (tool.function?.name !== "record_receptionist_request") {
      results.push(result(tool.id, { ok: false, requestId: null, notificationStatus: "rejected" }));
      continue;
    }
    let args = tool.function.arguments;
    if (typeof args === "string") { try { args = JSON.parse(args); } catch { args = null; } }
    const parsed = parseReceptionistRequest(args);
    if (!parsed) {
      results.push(result(tool.id, { ok: false, requestId: null, notificationStatus: "rejected" }));
      continue;
    }
    try {
      const committed = await commitReceptionistRequest(bucket, message.callId, tool.id, parsed, send);
      if (!committed.ok) return NextResponse.json({ ok: false, error: committed.error }, { status: committed.status });
      results.push(result(tool.id, { ok: true, requestId: committed.requestId, notificationStatus: committed.notificationStatus }));
    } catch {
      console.error("[voice_intake_failed]", message.callId);
      return NextResponse.json({ ok: false, error: "not_saved" }, { status: 503 });
    }
  }
  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
