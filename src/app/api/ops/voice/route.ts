import { NextRequest, NextResponse } from "next/server";
import { contactAdminAuthorized, inquiryStore } from "@/lib/inquiries";
import { isCallSid } from "@/lib/missed-calls";
import { retryVoiceJobs } from "@/lib/voice-jobs";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(req: NextRequest) {
  if (!contactAdminAuthorized(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("call");
  if (!id || !isCallSid(id)) return NextResponse.json({ error: "Invalid call" }, { status: 400 });
  try {
    const store = inquiryStore(Date.now() + 8000); await store.ensure();
    const types = ["calls", "ringing", "connected", "human", "machine", "unknown", "end", "claims", "results"];
    const values = await Promise.all(types.map(type => store.get(`voice-${type}/${id}.json`)));
    return NextResponse.json({ ok: true, privateStorage: true, call: id, state: Object.fromEntries(types.map((type, i) => [type, values[i]])) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ ok: false }, { status: 503 }); }
}
export async function POST(req: NextRequest) {
  if (!contactAdminAuthorized(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json({ ok: true, ...await retryVoiceJobs() }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ ok: false }, { status: 503 }); }
}
