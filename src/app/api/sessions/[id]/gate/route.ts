import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getSession,
  recordRateLimit,
  updateSession,
} from "@/lib/audit/sessions";
import { runAuditPipeline } from "@/lib/audit/audit-engine";
import { enrichReportWithLlm } from "@/lib/audit/llm-enrich";
import { dispatchToAthena } from "@/lib/audit/athena";
import { gateSchema } from "@/lib/audit/gate-validation";

const gateSchemaLegacy = gateSchema;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = gateSchemaLegacy.parse(await req.json());
    const session = await getSession(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.mode === "organic") {
      const allowed = await checkRateLimit(body.phone);
      if (!allowed) {
        return NextResponse.json(
          {
            error: "rate_limit",
            message:
              "Free audit limit reached for this number. Call us for a full enterprise scan.",
          },
          { status: 429 }
        );
      }
    }

    await updateSession(id, {
      first_name: body.firstName,
      last_name: body.lastName,
      phone: body.phone,
      email: body.email,
      gate_submitted_at: new Date().toISOString(),
      status: "scanning",
      warm_tier: "warm_b",
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const callbackUrl = `${baseUrl}/api/webhooks/athena`;

    const athena = await dispatchToAthena({
      sessionId: id,
      businessName: session.business_name,
      websiteUrl: session.website_url,
      zipCode: session.zip_code,
      mode: session.mode,
      callbackUrl,
      botId: "athena_bot_bot_bot",
      lead: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email,
      },
    });

    const baseReport = await runAuditPipeline({
      businessName: session.business_name,
      websiteUrl: session.website_url,
      zipCode: session.zip_code,
    });

    const report = await enrichReportWithLlm({
      businessName: session.business_name,
      websiteUrl: session.website_url,
      zipCode: session.zip_code,
      baseReport,
    });

    await updateSession(id, {
      status: "complete",
      report,
      progress_events: report.progressEvents,
      warm_tier: "warm_a",
      athena_job_id: athena.jobId,
    });

    if (session.mode === "organic") {
      await recordRateLimit(body.phone);
    }

    return NextResponse.json({ sessionId: id, report });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Gate failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await updateSession(id, {
    gate_shown_at: new Date().toISOString(),
    status: "gate_pending",
  });
  return NextResponse.json({ ok: true });
}
