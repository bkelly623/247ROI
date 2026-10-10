import { NextResponse } from "next/server";
import { browserNonceFromCookie } from "@/lib/payments/capability";
import { readStripeConfig } from "@/lib/payments/config";
import { createSupabasePaymentLedger } from "@/lib/payments/ledger";
import { createAuthorizedPortalSession } from "@/lib/payments/portal";
import { createStripeGateway } from "@/lib/payments/stripe-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const config = readStripeConfig();
    const ledger = createSupabasePaymentLedger();
    const gateway = createStripeGateway(config);
    const body = (await req.json().catch(() => null)) as { token?: string } | null;
    await gateway.assertAccount();
    const result = await createAuthorizedPortalSession({ token: body?.token ?? null, cookieNonce: browserNonceFromCookie(req.headers.get("cookie"), config.capabilitySecret), config, ledger, gateway });
    return NextResponse.json(result.body, { status: result.status, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "payments_unconfigured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
