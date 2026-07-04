import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/audit/sessions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { action } = await req.json().catch(() => ({ action: "view" }));

  if (action === "cta_click") {
    await updateSession(id, {
      cta_clicked_at: new Date().toISOString(),
      warm_tier: "hot",
    });
  }

  return NextResponse.json({ ok: true });
}
