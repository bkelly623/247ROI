import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, string>;

    const payload = new URLSearchParams();
    payload.set("businessName", body.businessName ?? "");
    payload.set("businessType", body.businessType ?? "");
    payload.set("businessTypeOther", body.businessTypeOther ?? "");
    payload.set("callsPerDay", body.callsPerDay ?? "");
    payload.set("missCallOutcome", body.missCallOutcome ?? "");
    payload.set("averageJobValue", body.averageJobValue ?? "");
    payload.set("fixTimeline", body.fixTimeline ?? "");
    payload.set("notes", body.notes ?? "");
    payload.set("_subject", "247ROI Intake Form Submission");

    const res = await fetch("https://formsubmit.co/ajax/contact@247roi.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: payload.toString(),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
