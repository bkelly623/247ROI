import { NextRequest, NextResponse } from "next/server";
import { validTwilioSignature } from "@/lib/twilio-signature";
import { inquiryStore } from "@/lib/inquiries";
import { dialXml, isCallSid, registerVoiceCall } from "@/lib/missed-calls";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!req.headers.get("x-twilio-signature")) return new NextResponse("Forbidden", { status: 403 });
  const form = await req.formData();
  if (!validTwilioSignature(req, form)) return new NextResponse("Forbidden", { status: 403 });
  const parent = String(form.get("CallSid") || "");
  if (!isCallSid(parent)) return new NextResponse("Bad call", { status: 400 });
  const forwardTo = process.env.FORWARD_PHONE_NUMBER;
  if (!forwardTo || !/^\+[1-9]\d{7,14}$/.test(forwardTo)) {
    console.error("[voice_forwarding_unconfigured]");
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, this line is not able to take calls right now. Please leave a message after the tone.</Say><Record maxLength="60" /></Response>', { headers: { "Content-Type": "text/xml" } });
  }
  try { await registerVoiceCall({ sid: parent, caller: String(form.get("From") || ""), startedAt: Date.now() }, inquiryStore(Date.now() + 6000)); }
  catch { console.error("[voice_initial_storage_failed]", parent); } // Do not break ringing; callbacks can recover via authenticated Twilio lookup.
  return new NextResponse(dialXml(forwardTo, parent), { headers: { "Content-Type": "text/xml" } });
}
