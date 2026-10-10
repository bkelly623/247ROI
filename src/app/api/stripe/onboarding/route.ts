import { NextResponse } from "next/server";
import { browserNonceFromCookie } from "@/lib/payments/capability";
import { readStripeConfig } from "@/lib/payments/config";
import { createSupabasePaymentLedger } from "@/lib/payments/ledger";
import { readPaidOnboarding, savePaidOnboarding } from "@/lib/payments/onboarding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function context() {
  const config = readStripeConfig();
  const ledger = createSupabasePaymentLedger();
  return { config, ledger };
}

export async function GET(req: Request) {
  try {
    const { config, ledger } = await context();
    const token = new URL(req.url).searchParams.get("token");
    const result = await readPaidOnboarding({ token, cookieNonce: browserNonceFromCookie(req.headers.get("cookie"), config.capabilitySecret), config, ledger });
    return NextResponse.json(result.body, { status: result.status, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "payments_unconfigured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 20000) return NextResponse.json({ error: "invalid_onboarding" }, { status: 413, headers: { "cache-control": "no-store" } });
  let body: unknown;
  try {
    body = raw ? JSON.parse(raw) as unknown : null;
  } catch {
    return NextResponse.json({ error: "invalid_onboarding" }, { status: 400, headers: { "cache-control": "no-store" } });
  }
  try {
    const { config, ledger } = await context();
    const result = await savePaidOnboarding({
      body,
      cookieNonce: browserNonceFromCookie(req.headers.get("cookie"), config.capabilitySecret),
      config,
      ledger,
    });
    return NextResponse.json(result.body, { status: result.status, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "payments_unconfigured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
