import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/audit/sessions";
import { executeFullAudit } from "@/lib/audit/run-audit";

export const maxDuration = 120;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const force = Boolean(body?.force);

    if (session.report && !force) {
      return NextResponse.json({ sessionId: id, report: session.report });
    }

    await updateSession(id, { status: "scanning" });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const callbackUrl = `${baseUrl}/api/webhooks/athena`;

    const report = await executeFullAudit({
      sessionId: id,
      businessName: session.business_name,
      websiteUrl: session.website_url,
      zipCode: session.zip_code,
      mode: session.mode,
      callbackUrl,
    });

    const saved = await updateSession(id, {
      status: "complete",
      report,
      progress_events: report.progressEvents,
      warm_tier: "warm_a",
    });
    if (!saved?.report) throw new Error("Report storage did not confirm the save");

    return NextResponse.json({ sessionId: id, report: saved.report });
  } catch {
    // Do not expose provider/account errors or leave failed scans marked running.
    await updateSession(id, { status: "failed" }).catch(() => null);
    return NextResponse.json({ error: "The audit could not complete or save its report. Please retry; unavailable checks are not negative findings." }, { status: 503 });
  }
}
