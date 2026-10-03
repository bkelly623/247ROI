"use client";
import { useState } from "react";
import { trackSiteEvent } from "@/lib/analytics/client";
type Job = { id: string; name: string; request: string; source: string; status: "Review needed" | "Awaiting approval" | "Ready for follow-up" };
const seed: Job[] = [
  { id: "DEMO-101", name: "Oak Street Office", request: "Maintenance estimate requested. Confirm site access and a suitable visit time before quoting.", source: "Website inquiry", status: "Review needed" },
  { id: "DEMO-102", name: "River Road Shop", request: "Service request received. The manager is available tomorrow afternoon. A person must confirm availability.", source: "Phone summary", status: "Awaiting approval" },
  { id: "DEMO-103", name: "Park Lane Studio", request: "Inspection request reviewed. Contact the customer to agree on a time; nothing has been booked.", source: "Email", status: "Ready for follow-up" },
];
export default function WorkflowDemo() {
  const [jobs,setJobs] = useState<Job[]>(seed.map(j=>({...j})));
  const [selected,setSelected] = useState("DEMO-101");
  const [filter,setFilter] = useState("All requests");
  const [log,setLog] = useState("Open a request, prepare its handoff, then approve the next step.");
  const job = jobs.find(j=>j.id===selected)!;
  const visible = jobs.filter(j=>filter==="All requests" || j.status===filter);
  function change(status: Job["status"]) {
    setJobs(items=>items.map(j=>j.id===selected?{...j,status}:j));
    setLog(`${job.id}: ${status}. The queue and counts have updated. No customer message was sent.`);
    trackSiteEvent({ eventName: "demo_interaction", source: "custom-software", metadata: { action: status } });
  }
  return <section id="workflow-demo" className="scroll-mt-28 border-b border-zinc-200 bg-zinc-50 py-14 text-zinc-950"><div className="container mx-auto px-5 sm:px-6">
    <p className="text-xs font-bold uppercase tracking-widest text-orange-700">Interactive sample · custom software & AI</p><h2 className="mt-3 font-display text-3xl font-bold">From scattered requests to an actionable queue.</h2>
    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-600">Try the review-and-approval workflow below. All businesses and requests are fictional. This browser demo illustrates a workflow interface; it does not run an AI model, connect to a CRM, send messages or show client results.</p>
    <div className="mt-7 grid grid-cols-3 gap-3">{[["Requests",jobs.length],["Need review",jobs.filter(j=>j.status!=="Ready for follow-up").length],["Ready",jobs.filter(j=>j.status==="Ready for follow-up").length]].map(([label,count])=><div key={label} className="rounded-xl border border-zinc-200 bg-white p-4"><p className="text-xs text-zinc-600">{label}</p><p className="mt-2 text-3xl font-bold" data-testid={`metric-${String(label).replaceAll(" ","-")}`}>{count}</p></div>)}</div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]"><div className="rounded-2xl border border-zinc-200 bg-white p-5"><label htmlFor="demo-filter" className="text-sm font-semibold">Request queue</label><select id="demo-filter" value={filter} onChange={e=>setFilter(e.target.value)} className="mt-3 min-h-11 w-full rounded-lg border border-zinc-300 bg-white p-2 text-sm">{["All requests","Review needed","Awaiting approval","Ready for follow-up"].map(label=><option key={label}>{label}</option>)}</select><div className="mt-4 space-y-3">{visible.map(item=><button key={item.id} type="button" onClick={()=>setSelected(item.id)} aria-pressed={selected===item.id} className={`w-full rounded-xl border p-4 text-left ${selected===item.id?"border-orange-600 bg-orange-50":"border-zinc-200 hover:bg-zinc-50"}`}><span className="block font-semibold">{item.name}</span><span className="mt-1 block text-xs text-zinc-600">{item.source} · {item.status}</span></button>)}{!visible.length&&<p className="py-4 text-sm text-zinc-600">No requests in this view.</p>}</div></div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7"><p className="text-xs font-semibold text-orange-700">{job.id} · {job.status}</p><h3 className="mt-3 font-display text-2xl font-bold">{job.name}</h3><p className="mt-4 leading-relaxed text-zinc-600">{job.request}</p><div className="mt-5 rounded-xl bg-zinc-50 p-4"><p className="text-sm font-bold">Human approval stays in the loop</p><p className="mt-2 text-sm leading-relaxed text-zinc-600">Check the details and choose the next action. No automatic prices, bookings or customer commitments.</p></div><div className="mt-6 flex flex-wrap gap-3"><button type="button" disabled={job.status!=="Review needed"} onClick={()=>change("Awaiting approval")} className="min-h-12 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white disabled:opacity-40">Prepare handoff</button><button type="button" disabled={job.status!=="Awaiting approval"} onClick={()=>change("Ready for follow-up")} className="min-h-12 rounded-full bg-orange-700 px-5 text-sm font-semibold text-white disabled:opacity-40">Approve next step</button></div></div>
    </div><p role="status" className="mt-5 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">{log}</p><button type="button" onClick={()=>{setJobs(seed.map(j=>({...j})));setSelected("DEMO-101");setFilter("All requests");setLog("Sample reset. No real records were changed.");}} className="mt-4 min-h-11 text-sm font-semibold text-orange-700 underline">Reset sample</button>
  </div></section>;
}
