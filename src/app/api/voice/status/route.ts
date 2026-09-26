import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/twilio";

/**
 * This exact string is registered as "Sample message #2" in the Twilio A2P
 * 10DLC campaign registration. Do not edit this text without also updating
 * that registration — the two must stay identical.
 */
const MISSED_CALL_TEXT =
  "Hi, sorry we missed your call! This is 247ROI — reply here and we'll get back to you, or call us back at (610) 300-3001. Msg & data rates may apply. Reply STOP to opt out, HELP for help.";

const UNANSWERED_STATUSES = new Set(["no-answer", "busy", "failed", "canceled"]);

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const dialCallStatus = String(form.get("DialCallStatus") || "");
  const caller = String(form.get("From") || "");

  if (caller && UNANSWERED_STATUSES.has(dialCallStatus)) {
    const result = await sendSms(caller, MISSED_CALL_TEXT);
    if (!result.ok) {
      console.error("[missed-call-sms-failed]", { caller, dialCallStatus, error: result.error });
    } else {
      console.log("[missed-call-sms-sent]", { caller, dialCallStatus });
    }
  }

  const twiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>';
  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
}
