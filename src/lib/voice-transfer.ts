import { NextRequest, NextResponse } from "next/server";
import { inquiryStore, type InquiryStore } from "@/lib/inquiries";
import { isCallSid, VOICE_BASE } from "@/lib/missed-calls";
import { validTwilioSignature } from "@/lib/twilio-signature";
import { escapeXml, validVapiSipUri, type ReceptionMarker } from "@/lib/voice-receptionist";

const e164 = (value: string) => /^\+[1-9]\d{7,14}$/.test(value);
export const PUBLIC_SUPPORT_EMAIL = "brendan@get247roi.com";
const DANGER = "If anyone is in immediate danger, hang up and dial 911. We cannot dispatch emergency services.";
const xml = (body: string) => new NextResponse(body, { headers: { "Content-Type": "text/xml" } });

export type CallLink = { sid: string; parentSid: string };

/** Child legs expose parent_call_sid. An inbound parent call has none. */
export function parentFromCallResource(body: unknown, requestedSid: string): CallLink | null {
  if (!body || typeof body !== "object" || !isCallSid(requestedSid)) return null;
  const call = body as Record<string, unknown>;
  if (call.sid !== requestedSid) return null;
  const parent = call.parent_call_sid;
  if (typeof parent === "string" && parent.length > 0) return isCallSid(parent) ? { sid: requestedSid, parentSid: parent } : null;
  if (parent === null || parent === undefined || parent === "") return call.direction === "inbound" ? { sid: requestedSid, parentSid: requestedSid } : null;
  return null;
}

export async function lookupTwilioCallLink(sid: string, fetchImpl: typeof fetch = fetch): Promise<CallLink | null> {
  const account = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!account || !token || !isCallSid(sid)) return null;
  const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(account)}/Calls/${sid}.json`, {
    headers: { Authorization: `Basic ${Buffer.from(`${account}:${token}`).toString("base64")}` },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) return null;
  return parentFromCallResource(await response.json(), sid);
}

export function ownerTransferTwiml(owner: string, callerId: string, parent: string) {
  if (!e164(owner) || !e164(callerId) || owner === callerId || !isCallSid(parent)) throw new Error("invalid_transfer");
  const action = escapeXml(`${VOICE_BASE}/api/voice/receptionist/transfer/end?parent=${parent}`);
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial timeout="25" timeLimit="600" record="do-not-record" callerId="${escapeXml(callerId)}" action="${action}" method="POST"><Number>${escapeXml(owner)}</Number></Dial></Response>`;
}

export function transferFallbackTwiml(parent: string) {
  if (!isCallSid(parent)) throw new Error("invalid_transfer");
  const callback = process.env.VOICE_VAPI_CALLBACK_SIP_URI || "";
  if (validVapiSipUri(callback)) {
    const say = escapeXml(`We cannot reach Brendan right now. I will connect you to leave a callback request. ${DANGER}`);
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${say}</Say><Dial answerOnBridge="true" timeLimit="600" record="do-not-record"><Sip>${escapeXml(callback)}</Sip></Dial></Response>`;
  }
  const say = escapeXml(`We cannot reach Brendan right now. Email ${PUBLIC_SUPPORT_EMAIL}. This does not promise a return call. ${DANGER}`);
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${say}</Say><Hangup/></Response>`;
}

function configuredOwner() {
  const owner = process.env.FORWARD_PHONE_NUMBER || "";
  const callerId = process.env.TWILIO_PHONE_NUMBER || "";
  return e164(owner) && e164(callerId) && owner !== callerId ? { owner, callerId } : null;
}

async function answered(store: InquiryStore, parent: string, source: string) {
  await store.put(`voice-provider-answered/${parent}.json`, { at: Date.now(), source, seconds: 1 }, true);
}

export async function receiveReceptionistTransfer(req: NextRequest, store?: InquiryStore, lookup: (sid: string) => Promise<CallLink | null> = lookupTwilioCallLink) {
  if (!req.headers.get("x-twilio-signature")) return new NextResponse("Forbidden", { status: 403 });
  const form = await req.formData();
  if (!validTwilioSignature(req, form)) return new NextResponse("Forbidden", { status: 403 });
  const callSid = String(form.get("CallSid") || "");
  if (!isCallSid(callSid)) return new NextResponse("Bad call", { status: 400 });
  // ReferTransferTarget is the REFER destination. It is never dialed.
  void form.get("ReferTransferTarget");
  const hinted = req.nextUrl.searchParams.get("parent") || "";
  let link: CallLink | null;
  try { link = await lookup(callSid); }
  catch { console.error("[voice_transfer_lookup_failed]", callSid); return new NextResponse("Retry", { status: 503 }); }
  if (!link || (hinted && hinted !== link.parentSid) || !isCallSid(link.parentSid)) return new NextResponse("Bad call", { status: 400 });
  try {
    const bucket = store ?? inquiryStore(Date.now() + 6000);
    await bucket.ensure();
    const marker = await bucket.get<ReceptionMarker>(`voice-route/${link.parentSid}.json`);
    if (marker?.route !== "receptionist" || !Number.isFinite(marker.receptionStart)) return new NextResponse("Bad call", { status: 400 });
    const key = `voice-transfer/${link.parentSid}.json`;
    if (!await bucket.get(key)) {
      const owner = configuredOwner();
      if (!await bucket.put(key, { at: Date.now(), parent: link.parentSid, ownerDial: Boolean(owner), referTargetIgnored: true })) {
        if (!await bucket.get(key)) return new NextResponse("Retry", { status: 503 });
      }
    }
    const saved = await bucket.get<{ parent: string }>(key);
    if (!saved || saved.parent !== link.parentSid) return new NextResponse("Retry", { status: 503 });
    await answered(bucket, link.parentSid, "sip-refer");
    const owner = configuredOwner();
    if (!owner) return xml(transferFallbackTwiml(link.parentSid));
    return xml(ownerTransferTwiml(owner.owner, owner.callerId, link.parentSid));
  } catch {
    console.error("[voice_transfer_failed]", link.parentSid);
    return new NextResponse("Retry", { status: 503 });
  }
}

export async function receiveReceptionistTransferEnd(req: NextRequest, store?: InquiryStore) {
  if (!req.headers.get("x-twilio-signature")) return new NextResponse("Forbidden", { status: 403 });
  const form = await req.formData();
  if (!validTwilioSignature(req, form)) return new NextResponse("Forbidden", { status: 403 });
  const parent = req.nextUrl.searchParams.get("parent") || String(form.get("CallSid") || "");
  if (!isCallSid(parent)) return new NextResponse("Bad call", { status: 400 });
  const status = String(form.get("DialCallStatus") || "");
  try {
    const bucket = store ?? inquiryStore(Date.now() + 6000);
    await bucket.ensure();
    const marker = await bucket.get<ReceptionMarker>(`voice-route/${parent}.json`);
    if (marker?.route !== "receptionist") return new NextResponse("Bad call", { status: 400 });
    await answered(bucket, parent, "owner-leg");
    if (status === "completed" || status === "answered") return xml("<Response><Hangup/></Response>");
    if (["busy", "no-answer", "failed", "canceled"].includes(status)) return xml(transferFallbackTwiml(parent));
    return xml("<Response><Hangup/></Response>");
  } catch {
    console.error("[voice_transfer_end_failed]", parent);
    return new NextResponse("Retry", { status: 503 });
  }
}
