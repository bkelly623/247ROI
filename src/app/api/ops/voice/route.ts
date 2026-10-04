import { NextRequest, NextResponse } from "next/server";
import { contactAdminAuthorized } from "@/lib/inquiries";
import { retryVoiceJobs } from "@/lib/voice-jobs";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: NextRequest) {
  if (!contactAdminAuthorized(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json({ ok: true, ...await retryVoiceJobs() }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ ok: false }, { status: 503 }); }
}
