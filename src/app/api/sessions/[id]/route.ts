import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/audit/sessions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.status === "complete" && !session.report) {
    return NextResponse.json({ error: "Report missing" }, { status: 500 });
  }

  if (session.status === "complete" && session.report) {
    await updateSession(id, {
      report_viewed_at: new Date().toISOString(),
      warm_tier: "warm_a",
    });
  }

  return NextResponse.json({ session });
}
