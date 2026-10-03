import { NextRequest, NextResponse } from "next/server";
import { validTwilioSignature } from "@/lib/twilio-signature";

/**
 * Twilio Voice webhook for the business line. Rings the real forwarding
 * number for FORWARD_RING_SECONDS; if unanswered, /api/voice/status fires
 * the missed-call text-back via sendSms.
 */
export async function POST(req: NextRequest) {
  if (!req.headers.get("x-twilio-signature")) return new NextResponse("Forbidden", { status: 403 });
  const form = await req.formData();
  if (!validTwilioSignature(req, form)) return new NextResponse("Forbidden", { status: 403 });
  const forwardTo = process.env.FORWARD_PHONE_NUMBER;

  if (!forwardTo || !/^\+[1-9]\d{7,14}$/.test(forwardTo)) {
    const twiml =
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, this line is not able to take calls right now. Please leave a message after the tone.</Say><Record maxLength="60" /></Response>';
    return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Dial timeout="20" action="https://www.get247roi.com/api/voice/status" method="POST"><Number>${forwardTo}</Number></Dial></Response>`;

  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
}
