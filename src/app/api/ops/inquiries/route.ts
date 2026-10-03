import { NextRequest, NextResponse } from "next/server";
import { contactAdminAuthorized, inquiryStore, retryInquiries } from "@/lib/inquiries";
export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store" };
export async function GET(req: NextRequest) {
  if (!contactAdminAuthorized(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  try {
    const store = inquiryStore();
    await store.ensure();
    const id = req.nextUrl.searchParams.get("id");
    if (id && !/^[a-f0-9-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid reference" }, { status: 400, headers });
    if (id) return NextResponse.json({ inquiry: await store.get(`submissions/${id}.json`), receipt: await store.get(`receipts/${id}.json`) }, { headers });
    return NextResponse.json({ ok: true, privateStorage: true, notificationConfigured: Boolean(process.env.CONTACT_TELEGRAM_BOT_TOKEN && process.env.CONTACT_TELEGRAM_CHAT_ID), storageHost: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname }, { headers });
  } catch { return NextResponse.json({ ok: false, error: "inquiry_storage_unavailable" }, { status: 503, headers }); }
}
export async function POST(req: NextRequest) {
  if (!contactAdminAuthorized(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  try { return NextResponse.json({ ok: true, ...await retryInquiries() }, { headers }); }
  catch { return NextResponse.json({ ok: false, error: "retry_failed" }, { status: 503, headers }); }
}
