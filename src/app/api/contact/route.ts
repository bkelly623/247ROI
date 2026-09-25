import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  /** SMS opt-in: phone number and explicit consent captured on the public contact form. */
  phone: z.string().min(7),
  email: z.string().email().optional(),
  message: z.string().min(1),
  smsConsent: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());

    // SMS opt-in enforcement: a phone number may only be submitted alongside explicit consent.
    // TODO(247ROI): persist this submission (name/phone/email/message/smsConsent) to Supabase
    // once a contact_submissions table exists; logged here in the interim so consent capture
    // is not silently dropped.
    if (!body.smsConsent) {
      return NextResponse.json(
        { error: "SMS consent checkbox must be checked to submit this form." },
        { status: 400 }
      );
    }

    console.log("[contact-sms-consent]", {
      name: body.name,
      phone: body.phone,
      email: body.email,
      smsConsent: body.smsConsent,
      receivedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid submission.", details: err.flatten() }, { status: 400 });
    }
    console.error("[contact-api] unexpected error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
