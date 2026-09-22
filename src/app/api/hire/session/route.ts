import { NextResponse } from "next/server";
import { openingTurn } from "@/lib/hire/sales-engine";
import { createHireSession, updateHireSession } from "@/lib/hire/sessions";
import { getSession } from "@/lib/audit/sessions";
import { attachVisibilityContext, validVisibilityId } from "@/lib/hire/visibility-handoff";

export async function POST(req: Request) {
  try {
    let body: { source?: string; repToken?: string; visibilitySessionId?: unknown } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const session = await createHireSession({
      source: body.source,
      repToken: body.repToken,
    });

    const opening = openingTurn();
    let visibilityContextAttached=false;
    if(validVisibilityId(body.visibilitySessionId)){
      try {
        const scan=await getSession(body.visibilitySessionId);
        if(scan?.report){
          const discovery=attachVisibilityContext(opening.discovery ?? session.discovery,scan);
          const saved=await updateHireSession(session.id,{discovery});
          if(saved){
            opening.discovery=saved.discovery;
            opening.reply="Your saved visibility findings are attached to this conversation. Which priority would you like to tackle first: helping buyers find you, strengthening public proof, or improving a business workflow?";
            visibilityContextAttached=true;
          }
        }
      }catch{ /* An unavailable report never blocks the original conversation. */ }
    }

    return NextResponse.json({
      sessionId: session.id,
      opening: opening.reply,
      discovery: opening.discovery,
      visibilityContextAttached,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not start audit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
