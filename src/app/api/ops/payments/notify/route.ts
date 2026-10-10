import { NextResponse } from "next/server";
import { contactAdminAuthorized } from "@/lib/inquiries";
import { createSupabasePaymentLedger } from "@/lib/payments/ledger";
import { drainPaymentNotifications } from "@/lib/payments/outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!contactAdminAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "cache-control": "no-store" } });
  }
  try {
    const ledger = createSupabasePaymentLedger();
    const result = await drainPaymentNotifications({ ledger });
    if (!result.configured) return NextResponse.json({ error: "notification_unconfigured" }, { status: 503, headers: { "cache-control": "no-store" } });
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "payment_ledger_unconfigured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
