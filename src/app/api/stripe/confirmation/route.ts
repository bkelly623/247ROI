import { NextResponse } from "next/server";
import { browserNonceFromCookie } from "@/lib/payments/capability";
import { buildConfirmation } from "@/lib/payments/confirmation";
import { readStripeConfig } from "@/lib/payments/config";
import { createSupabasePaymentLedger } from "@/lib/payments/ledger";
import { createStripeGateway } from "@/lib/payments/stripe-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let config;
  try {
    config = readStripeConfig();
  } catch {
    return NextResponse.json({ error: "payments_unconfigured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  let ledger;
  try {
    ledger = createSupabasePaymentLedger();
  } catch {
    return NextResponse.json({ error: "payment_ledger_unconfigured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  const gateway = createStripeGateway(config);
  const sessionId = new URL(req.url).searchParams.get("session_id");
  try {
    await gateway.assertAccount();
    const body = await buildConfirmation({
      sessionId,
      config,
      ledger,
      retrieve: (id) => gateway.retrieveCheckoutSession(id),
      cookieNonce: browserNonceFromCookie(req.headers.get("cookie"), config.capabilitySecret),
    });
    return NextResponse.json(body, { status: 200, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "stripe_account_unverified" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
