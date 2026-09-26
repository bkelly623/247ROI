import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendSms } from "@/lib/twilio";

const schema = z.object({
  name: z.string().min(1),
  /** SMS opt-in: phone number and explicit consent captured on the public contact form. */
  phone: z.string().min(7),
  email: z.string().email().optional(),
  message: z.string().min(1),
  smsConsent: z.boolean(),
});

/**
 * This exact string is what's registered as "Sample message #1" in the
 * Twilio A2P 10DLC campaign registration. Do not edit this text without
 * also updating that registration — the two must stay identical.
 */
const CONTACT_REPLY_TEXT =
  "Hi, thanks for reaching out to 247ROI! We got your message and will follow up shortly. Msg & data rates may apply. Reply STOP to opt out, HELP for help.";

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());

    // SMS opt-in enforcement: a phone number may only be submitted alongside explicit consent.
    if (!body.smsConsent) {
      return NextResponse.json(
        { error: "SMS consent checkbox must be checked to submit this form." },
        { status: 400 }
      );
    }

    // TODO(247ROI): persist this submission (name/phone/email/message/smsConsent) to Supabase
    // once a contact_submissions table exists; logged here in the interim so consent capture
    // is not silently dropped.
    console.log("[contact-sms-consent]", {
      name: body.name,
      phone: body.phone,
      email: body.email,
      smsConsent: body.smsConsent,
      receivedAt: new Date().toISOString(),
    });

    const sendResult = await sendSms(body.phone, CONTACT_REPLY_TEXT);
    if (!sendResult.ok) {
      // The submission itself is still valid and logged; surface the send failure
      // so it's visible, but don't block the user's confirmation on a carrier/API hiccup.
      console.error("[contact-sms-send-failed]", { phone: body.phone, error: sendResult.error });
    }

    return NextResponse.json({ ok: true, smsSent: sendResult.ok });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid submission.", details: err.flatten() }, { status: 400 });
    }
    console.error("[contact-api] unexpected error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
