import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getHireSession, updateHireSession, publicHireView } from '@/lib/hire/sessions';
import { canProduceBrief } from '@/lib/hire/discovery-policy';
import { primaryPain } from '@/lib/hire/estimates';
import { proposalFallback } from '@/lib/hire/prompt';
import { readHireBody } from '@/lib/hire/http';

export async function GET(req: NextRequest,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({error:'Not found'},{status:404});
  try {
    const session=await getHireSession(id);
    if(!session) return NextResponse.json({error:'Saved audit not found.'},{status:404});
    return NextResponse.json({session:publicHireView(session,req.nextUrl.searchParams.get('resume')==='1'),unlocked:session.status==='unlocked' || session.status==='gate_ready'}, {headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
  } catch { return NextResponse.json({error:'Your saved audit is temporarily unavailable. Please retry.'},{status:503}); }
}
const finishSchema=z.object({
  confirmed:z.literal(true), revision:z.string().max(60),
  correction:z.object({businessType:z.string().trim().min(2).max(80),title:z.string().trim().min(2).max(100),process:z.string().trim().min(10).max(1000),tools:z.string().max(200),hours:z.number().min(0).max(168).nullable(),automatable:z.boolean().nullable()}).optional(),
});
export async function POST(req: NextRequest,{params}:{params:Promise<{id:string}>}) {
  try {
    const {id}=await params;
    if(!z.string().uuid().safeParse(id).success) return NextResponse.json({error:'Not found'},{status:404});
    const parsed=finishSchema.safeParse(await readHireBody(req));
    if(!parsed.success) return NextResponse.json({error:'Please confirm the summary. No contact details are required.'},{status:400});
    const session=await getHireSession(id);
    if(!session) return NextResponse.json({error:'Saved audit not found.'},{status:404});
    if(session.status==='unlocked') return NextResponse.json({sessionId:id,unlocked:true});
    if(session.updated_at!==parsed.data.revision) return NextResponse.json({error:'The conversation changed. Reload before confirming.'},{status:409});
    const d=structuredClone(session.discovery), p=primaryPain(d), edit=parsed.data.correction;
    if(edit && p) {
      d.businessType=edit.businessType; p.title=edit.title; p.processSteps=edit.process.split(/\n|→/).map(s=>s.trim()).filter(Boolean).slice(0,5); p.rawDescription=edit.process; p.tools=edit.tools.split(',').map(s=>s.trim()).filter(Boolean).slice(0,8);
      p.time={...p.time,statedHoursPerWeek:edit.hours,computedHoursPerWeek:edit.hours,minutesPerOccurrence:null,occurrencesPerWeek:null,hiddenMinutesPerOccurrence:null}; p.automatable=edit.automatable;
      if(edit.hours==null) d.notes.push('hours_unknown');
    }
    if(!canProduceBrief(d)) return NextResponse.json({error:'Describe your business and one concrete example of the work first.'},{status:400});
    d.salesStage='pitch';d.notes=[...new Set([...d.notes,'owner_confirmed'])];
    const updated=await updateHireSession(id,{discovery:d,proposal:proposalFallback(d),status:'unlocked',phase:'unlocked',unlocked_at:new Date().toISOString()},session.updated_at);
    if(!updated) return NextResponse.json({error:'Another update arrived. Reload and confirm again.'},{status:409});
    return NextResponse.json({sessionId:id,unlocked:true,session:publicHireView(updated)},{headers:{'Cache-Control':'no-store'}});
  } catch { return NextResponse.json({error:'Could not save your report. Please retry; the conversation is retained.'},{status:503}); }
}
