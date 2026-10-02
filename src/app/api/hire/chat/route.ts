import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runHireChatTurn } from '@/lib/hire/openai';
import { getHireSession, updateHireSession } from '@/lib/hire/sessions';
import { guidedTurn } from '@/lib/hire/sales-engine';
import { readHireBody } from '@/lib/hire/http';

export const maxDuration = 30;
const schema=z.object({sessionId:z.string().uuid(),message:z.string().trim().min(1).max(2000),requestId:z.string().uuid(),revision:z.string().max(60)});
export async function POST(req: Request) {
  try {
    const parsed=schema.safeParse(await readHireBody(req));
    if (!parsed.success) return NextResponse.json({error:'Please send a message under 2,000 characters from your current audit.'},{status:400});
    const {sessionId,message,requestId,revision}=parsed.data;
    const session=await getHireSession(sessionId);
    if (!session) return NextResponse.json({error:'This audit could not be found. Your draft is kept on this device.'},{status:404});
    if (session.discovery.notes.includes(`turn:${requestId}`)) {
      return NextResponse.json({...guidedTurn(session.discovery),reply:session.messages.at(-1)?.content,sessionId,revision:session.updated_at,replayed:true});
    }
    if (session.status==='unlocked') return NextResponse.json({error:'This report is saved. Start a new audit to explore another workflow.',reportUrl:`/ai-opportunity-audit/${sessionId}`},{status:409});
    if (session.updated_at!==revision) return NextResponse.json({error:'This conversation changed in another tab. Reload the saved conversation before continuing.',conflict:true},{status:409});
    if (session.messages.filter(m=>m.role==='user').length>=24) return NextResponse.json({error:'This conversation has reached its limit. Use the summary to finish, or start a new audit.'},{status:429});
    const messages=[...session.messages,{role:'user' as const,content:message}];
    const turn=await runHireChatTurn({messages,discovery:session.discovery});
    if (!turn.discovery) throw new Error('Missing discovery');
    turn.discovery.notes=[...turn.discovery.notes.filter(n=>!n.startsWith('turn:')),`turn:${requestId}`];
    const updated=await updateHireSession(sessionId,{messages:[...messages,{role:'assistant',content:turn.reply}],discovery:turn.discovery,proposal:turn.proposal,phase:turn.phase,status:turn.readyForGate?'gate_ready':'chatting'},revision);
    if (!updated) return NextResponse.json({error:'Another answer was saved first. Reload the saved conversation.',conflict:true},{status:409});
    return NextResponse.json({...turn,discovery:{...turn.discovery,notes:turn.discovery.notes.filter(n=>!n.startsWith('turn:'))},sessionId,revision:updated.updated_at},{headers:{'Cache-Control':'no-store'}});
  } catch {
    return NextResponse.json({error:'Could not save this answer. Your draft is kept—please retry.'},{status:503});
  }
}
