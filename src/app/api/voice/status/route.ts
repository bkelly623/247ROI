import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/twilio";

/**
 * NOTE: this text is not currently declared as a use case in the Twilio A2P
 * 10DLC campaign registration (the campaign only covers the website contact
 * form). This flow runs in production but its own message content/use case
 * has not been separately submitted for review — flagged as a follow-up.
 */
const MISSED_CALL_TEXT =
  "Hi, sorry we missed your call! This is 247ROI's assistant — tell me what's going on and I'll get you the right help, or call again at (610) 300-3001. Msg & data rates may apply. Reply STOP to opt out, HELP for help.";

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
