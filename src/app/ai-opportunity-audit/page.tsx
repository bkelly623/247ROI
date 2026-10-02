import type { Metadata } from 'next';
import { AuditEntryFlow } from '@/components/hire/AuditEntryFlow';
import { SITE_URL } from '@/lib/site';
export const metadata:Metadata={
  title:'Business Systems Audit & AI Opportunity Audit | 247ROI',
  description:'Find one practical way to reduce busywork. Get a clear first step, human safeguards and a saved opportunity plan—no phone number required for the operations conversation.',
  alternates:{canonical:'/ai-opportunity-audit'},
  openGraph:{title:'AI Opportunity Audit | 247ROI',description:'Less busywork. One practical first move.',url:'/ai-opportunity-audit'},
};
const questions=[
  ['What will I get?','A short plan based on your answers: the first workflow to improve, a possible time-saving range when there is enough information, what stays human, and a first step you can try.'],
  ['Does every business need AI?','No. Your current software, a clearer checklist or a better handoff may be the right fix. We recommend testing one improvement before building more.'],
  ['Do I have to give you my phone number?','Not for the operations conversation or its plan. You can read, save and share that plan without contact details. A consultation is optional.'],
];
export default function HirePage(){
  const schema={'@context':'https://schema.org','@type':'Service',name:'AI Opportunity Audit',provider:{'@type':'Organization',name:'247ROI',url:SITE_URL},url:`${SITE_URL}/ai-opportunity-audit`,description:metadata.description};
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/><AuditEntryFlow/>
    <section aria-label="About your opportunity plan" className="border-t border-white/10 bg-zinc-950 px-4 py-8 text-zinc-100"><div className="mx-auto max-w-3xl"><h2 className="font-display text-xl font-bold">Useful answers. No AI jargon required.</h2><div className="mt-4 space-y-2">{questions.map(([q,a])=><details key={q} className="rounded-xl border border-white/10 p-4"><summary className="cursor-pointer py-1 font-medium">{q}</summary><p className="mt-3 text-sm leading-relaxed text-zinc-400">{a}</p></details>)}<details className="rounded-xl border border-white/10 p-4"><summary className="cursor-pointer py-1 font-medium">See an example: chasing estimates</summary><div className="mt-3 grid gap-4 text-sm sm:grid-cols-3"><p><strong className="text-orange-300">Today</strong><br/>Sent quotes live in a spreadsheet. Follow-up depends on remembering.</p><p><strong className="text-orange-300">A better way</strong><br/>Prepare reminders and track replies. You approve changes to price and scope.</p><p><strong className="text-orange-300">First move</strong><br/>Map five recent quotes. Check your current software before buying anything new.</p></div><p className="mt-3 text-xs text-zinc-400">Illustrative example, not a measured customer result.</p></details></div></div></section>
  </>;
}
