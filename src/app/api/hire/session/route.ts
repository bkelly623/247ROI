import { NextResponse } from 'next/server';
import { z } from 'zod';
import { openingTurn } from '@/lib/hire/sales-engine';
import { createHireSession, updateHireSession, localMemoryAllowed } from '@/lib/hire/sessions';
import { getSession } from '@/lib/audit/sessions';
import { attachVisibilityContext, validVisibilityId } from '@/lib/hire/visibility-handoff';
import { readHireBody } from '@/lib/hire/http';

export async function POST(req: Request) {
  try {
    const parsed=z.object({source:z.string().max(80).optional(),visibilitySessionId:z.string().max(50).optional()}).safeParse(await readHireBody(req));
    if(!parsed.success) return NextResponse.json({error:'Invalid audit request.'},{status:400});
    const body=parsed.data;
    const session=await createHireSession({source:body.source ?? 'ai_opportunity_audit_page'});
    const opening=openingTurn(); let visibilityContextAttached=false;
    if(validVisibilityId(body.visibilitySessionId)) {
      try {
        const scan=await getSession(body.visibilitySessionId);
        if(scan?.report) {
          opening.discovery=attachVisibilityContext(opening.discovery ?? session.discovery,scan);
          opening.reply='Your saved visibility findings are attached. What kind of business do you run, and which part of the work would you most like to improve?';
          visibilityContextAttached=true;
        }
      } catch { /* Report availability must not block the operations audit. */ }
    }
    const saved=await updateHireSession(session.id,{discovery:opening.discovery,messages:[{role:'assistant',content:opening.reply}]});
    if(!saved) throw new Error('Save failed');
    return NextResponse.json({sessionId:saved.id,opening:opening.reply,discovery:saved.discovery,choices:opening.choices,revision:saved.updated_at,visibilityContextAttached,durable:!localMemoryAllowed()},{headers:{'Cache-Control':'no-store'}});
  } catch {
    return NextResponse.json({error:'Could not start a saved audit. Please retry in a moment.'},{status:503});
  }
}
