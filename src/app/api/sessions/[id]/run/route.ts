import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/audit/sessions";
import { executeFullAudit } from "@/lib/audit/run-audit";

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

    await updateSession(id, {
      status: "complete",
      report,
      progress_events: report.progressEvents,
      warm_tier: "warm_a",
    });

    return NextResponse.json({ sessionId: id, report });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Audit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
