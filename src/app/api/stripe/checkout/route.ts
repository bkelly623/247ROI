import { NextResponse } from "next/server";
import { startConfiguredCheckout } from "@/lib/payments/checkout";
import { readStripeConfig } from "@/lib/payments/config";
import { createStripeGateway } from "@/lib/payments/stripe-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 2000) return NextResponse.json({ error: "checkout_rejected" }, { status: 413, headers: { "cache-control": "no-store" } });
  let priceId: string | null = null;
  if (raw) {
    try {
      const body = JSON.parse(raw) as { priceId?: unknown };
      priceId = typeof body.priceId === "string" ? body.priceId : null;
    } catch {
      return NextResponse.json({ error: "checkout_rejected" }, { status: 400, headers: { "cache-control": "no-store" } });
    }
  }
  try {
    const config = readStripeConfig();
    const gateway = createStripeGateway(config);
    const result = await startConfiguredCheckout({ config, origin: req.headers.get("origin"), priceId, cookieHeader: req.headers.get("cookie"), gateway });
    const headers: Record<string, string> = { "cache-control": "no-store" };
    if (result.cookie) headers["set-cookie"] = result.cookie;
    return NextResponse.json(result.body, { status: result.status, headers });
  } catch {
    return NextResponse.json({ error: "payments_unconfigured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
