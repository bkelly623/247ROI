import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { AuditReport } from "@/lib/audit/types";
import { mergeAthenaReport } from "@/lib/audit/athena";
import { runAuditPipeline } from "@/lib/audit/audit-engine";
import { getSession, updateSession } from "@/lib/audit/sessions";
import { ATHENA } from "@/lib/audit/config";

const schema = z.object({
  sessionId: z.string().uuid(),
  report: z.record(z.unknown()).optional(),
  status: z.enum(["complete", "failed"]).optional(),
  jobId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (
    ATHENA.callbackSecret &&
    auth !== `Bearer ${ATHENA.callbackSecret}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    const session = await getSession(body.sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const baseReport = await runAuditPipeline({
      businessName: session.business_name,
      websiteUrl: session.website_url,
      zipCode: session.zip_code,
    });

    const athenaPartial = (body.report ?? {}) as Partial<AuditReport>;
    const finalReport = mergeAthenaReport(baseReport, athenaPartial);

    await updateSession(body.sessionId, {
      status: body.status === "failed" ? "failed" : "complete",
      report: finalReport,
      progress_events: finalReport.progressEvents,
      athena_job_id: body.jobId,
      warm_tier: "warm_a",
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
