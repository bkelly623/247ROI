import { NextResponse } from "next/server";
import { HIRE_OPENING } from "@/lib/hire/copy";
import { createHireSession } from "@/lib/hire/sessions";

export async function POST(req: Request) {
  try {
    let body: { source?: string; repToken?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const session = await createHireSession({
      source: body.source,
      repToken: body.repToken,
    });

    return NextResponse.json({
      sessionId: session.id,
      opening: HIRE_OPENING,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not start audit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
