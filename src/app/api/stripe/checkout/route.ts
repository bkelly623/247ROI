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
  let offerToken: string | null = null;
  if (raw) {
    try {
      const body = JSON.parse(raw) as { priceId?: unknown; offerToken?: unknown };
      if (!body || Object.keys(body).some(k => !["priceId", "offerToken"].includes(k))) throw new Error("checkout_rejected");
      priceId = typeof body.priceId === "string" ? body.priceId : null;
      offerToken = typeof body.offerToken === "string" ? body.offerToken : null;
      if ((body.offerToken !== undefined && !offerToken) || (body.priceId !== undefined && !priceId)) throw new Error("checkout_rejected");
    } catch {
      return NextResponse.json({ error: "checkout_rejected" }, { status: 400, headers: { "cache-control": "no-store" } });
    }
  }
  try {
    const config = readStripeConfig();
    const gateway = createStripeGateway(config);
    const result = await startConfiguredCheckout({ config, origin: req.headers.get("origin"), priceId, offerToken, cookieHeader: req.headers.get("cookie"), gateway });
    const headers: Record<string, string> = { "cache-control": "no-store" };
    if (result.cookie) headers["set-cookie"] = result.cookie;
    return NextResponse.json(result.body, { status: result.status, headers });
  } catch {
    return NextResponse.json({ error: "payments_unconfigured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
