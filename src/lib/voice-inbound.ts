import { NextRequest, NextResponse } from "next/server";
import { validTwilioSignature } from "@/lib/twilio-signature";
import { inquiryStore, type InquiryStore } from "@/lib/inquiries";
import { dialXml, isCallSid, registerVoiceCall } from "@/lib/missed-calls";
import { markReceptionistRoute, receptionistTwiml, validVapiSipUri } from "@/lib/voice-receptionist";

export async function inboundVoice(req: NextRequest, store?: InquiryStore) {
  if (!req.headers.get("x-twilio-signature")) return new NextResponse("Forbidden", { status: 403 });
  const form = await req.formData();
  if (!validTwilioSignature(req, form)) return new NextResponse("Forbidden", { status: 403 });
  const parent = String(form.get("CallSid") || "");
  if (!isCallSid(parent)) return new NextResponse("Bad call", { status: 400 });
  const sip = process.env.VOICE_VAPI_SIP_URI || "";
  if (process.env.VOICE_RECEPTIONIST_ENABLED === "true" && validVapiSipUri(sip)) {
    let serveSip = false;
    try {
      const bucket = store ?? inquiryStore(Date.now() + 6000);
      const key = `voice-route/${parent}.json`;
      const existing = await bucket.get<{ route?: string; receptionStart?: number }>(key);
      if (existing?.route === "receptionist" && Number.isFinite(existing.receptionStart)) serveSip = true;
      else {
        await registerVoiceCall({ sid: parent, caller: String(form.get("From") || ""), startedAt: Date.now() }, bucket);
        const started = Date.now();
        if (await markReceptionistRoute(bucket, parent, started)) serveSip = true;
        else {
          const raced = await bucket.get<{ route?: string; receptionStart?: number }>(key);
          serveSip = raced?.route === "receptionist" && Number.isFinite(raced.receptionStart);
        }
      }
    } catch { console.error("[voice_receptionist_storage_failed]", parent); }
    if (serveSip) return new NextResponse(receptionistTwiml(sip, parent), { headers: { "Content-Type": "text/xml" } });
    console.error("[voice_receptionist_untracked_fallback]", parent);
  } else if (process.env.VOICE_RECEPTIONIST_ENABLED === "true") console.error("[voice_receptionist_unconfigured]");
  const forwardTo = process.env.FORWARD_PHONE_NUMBER;
  if (!forwardTo || !/^\+[1-9]\d{7,14}$/.test(forwardTo)) {
    console.error("[voice_forwarding_unconfigured]");
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, this line is not able to take calls right now. Please leave a message after the tone.</Say><Record maxLength="60" /></Response>', { headers: { "Content-Type": "text/xml" } });
  }
  try { await registerVoiceCall({ sid: parent, caller: String(form.get("From") || ""), startedAt: Date.now() }, store ?? inquiryStore(Date.now() + 6000)); }
  catch { console.error("[voice_initial_storage_failed]", parent); } // Do not break ringing; callbacks can recover via authenticated Twilio lookup.
  return new NextResponse(dialXml(forwardTo, parent), { headers: { "Content-Type": "text/xml" } });
}
