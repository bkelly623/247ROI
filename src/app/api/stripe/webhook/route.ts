import { NextResponse } from "next/server";
import { createSupabasePaymentLedger } from "@/lib/payments/ledger";
import { readStripeConfig } from "@/lib/payments/config";
import { createStripeGateway } from "@/lib/payments/stripe-server";
import { handleStripeWebhook } from "@/lib/payments/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unconfigured(status = 503) {
  return NextResponse.json({ error: "payments_unconfigured" }, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  let config;
  try {
    config = readStripeConfig();
  } catch {
    return unconfigured();
  }
  const gateway = createStripeGateway(config);
  try {
    await gateway.assertAccount();
  } catch {
    return NextResponse.json({ error: "stripe_account_unverified" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  let ledger;
  try {
    ledger = createSupabasePaymentLedger();
  } catch {
    return NextResponse.json({ error: "payment_ledger_unconfigured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  const result = await handleStripeWebhook({ rawBody, signature, config, ledger, gateway });
  return NextResponse.json(result.body, { status: result.status, headers: { "cache-control": "no-store" } });
}
