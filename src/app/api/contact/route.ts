import { NextRequest, NextResponse } from "next/server";
import { inquirySchema, saveInquiry, notifyInquiry } from "@/lib/inquiries";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin) {
    try { if (new URL(origin).host !== req.headers.get("host")) return NextResponse.json({ error: "Please submit from this website." }, { status: 403 }); }
    catch { return NextResponse.json({ error: "Invalid origin." }, { status: 403 }); }
  }
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Invalid request." }, { status: 415 });
  if (Number(req.headers.get("content-length") || 0) > 14000) return NextResponse.json({ error: "Message too long." }, { status: 413 });
  let raw;
  try {
    const text = await req.text();
    if (Buffer.byteLength(text) > 14000) return NextResponse.json({ error: "Message too long." }, { status: 413 });
    raw = JSON.parse(text);
  } catch { return NextResponse.json({ error: "Invalid submission." }, { status: 400 }); }
  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success || parsed.data.website) return NextResponse.json({ error: "Please check your name, phone number, email and message." }, { status: 400 });
  try {
    const saved = await saveInquiry(parsed.data, req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown");
    // Notification failure must not erase a successfully saved inquiry or prompt duplicates.
    const notified = await notifyInquiry(saved).catch(() => false);
    return NextResponse.json({ ok: true, reference: saved.submissionId, saved: true, notification: notified ? "sent" : "queued" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown";
    console.error("[contact_save_failed]", code);
    if (code === "rate_limited") return NextResponse.json({ error: "Too many messages. Please call (610) 300-3001 instead." }, { status: 429, headers: { "Retry-After": "3600" } });
    if (code === "idempotency_conflict") return NextResponse.json({ error: "This message reference was already used. Reload to send a new message." }, { status: 409 });
    return NextResponse.json({ error: "We could not confirm your message was saved. Your text is still here. Try again or call (610) 300-3001." }, { status: 503 });
  }
}
