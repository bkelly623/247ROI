import { NextResponse } from "next/server";

/** Live query streaming removed — AI/Google tests happen in real browser tabs on Meet. */
export async function GET() {
  return NextResponse.json(
    { error: "Live query streaming has been removed. Use /present for audit results." },
    { status: 410 }
  );
}
