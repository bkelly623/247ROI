"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUp, Check, Loader2, RotateCcw, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { emptyDiscovery, type DiscoveryState, type HireMessage } from '@/lib/hire/types';
import { OPENING } from '@/lib/hire/sales-engine';
import { canProduceBrief, choicesFor, discoverySummary, nextDiscoveryStep, type HireChoice } from '@/lib/hire/discovery-policy';
import { primaryPain } from '@/lib/hire/estimates';
import { trackSiteEvent } from '@/lib/analytics/client';

const field='w-full min-h-11 rounded-xl border border-white/20 bg-zinc-900 px-3 py-2 text-base text-zinc-100 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30';
const action='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold disabled:opacity-50';
type Pending={text:string;requestId:string};
type Saved={id:string;draft:string;pending:Pending|null};
function storageKey(){return `247roi:opportunity:v2:${new URLSearchParams(window.location.search).get('visibility')||'direct'}`;}
function store(data:Saved){try{localStorage.setItem(storageKey(),JSON.stringify(data));}catch{/* Private browsing: server link still works. */}}
async function request(url:string,body?:unknown){
  const res=await fetch(url,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(24000)});
  const data=await res.json(); if(!res.ok) throw new Error(data.error||'Please retry.');return data;
}
export function HireAuditFlow(){
  const router=useRouter();
  const [id,setId]=useState<string|null>(null),[revision,setRevision]=useState('');
  const [messages,setMessages]=useState<HireMessage[]>([{role:'assistant',content:OPENING}]);
  const [discovery,setDiscovery]=useState<DiscoveryState>(emptyDiscovery());
  const [choices,setChoices]=useState<HireChoice[]>(choicesFor(emptyDiscovery()));
  const [input,setInput]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [review,setReview]=useState(false),[guided,setGuided]=useState(false),[resumed,setResumed]=useState(false),[slow,setSlow]=useState(false),[copyStatus,setCopyStatus]=useState('');
  const reviewRef=useRef<HTMLElement>(null);
  const pending=useRef<Pending|null>(null),lock=useRef(false),initialized=useRef(false),log=useRef<HTMLDivElement>(null),inputRef=useRef<HTMLTextAreaElement>(null);
  const boot=useCallback(async(force=false)=>{
    setLoading(true);setError('');
    try{
      let saved:Saved|null=null;try{saved=JSON.parse(localStorage.getItem(storageKey())||'null');}catch{}
      const query=new URLSearchParams(window.location.search);
      force=force||query.get('new')==='1';
      const fromUrl=query.get('resume');
      const resumeId=force?null:(fromUrl||saved?.id);
      if(resumeId){
        const data=await request(`/api/hire/${encodeURIComponent(resumeId)}?resume=1`);
        if(data.session.status==='unlocked'){router.replace(`/ai-opportunity-audit/${resumeId}`);return;}
        setId(resumeId);setRevision(data.session.updated_at);setMessages(data.session.messages.length?data.session.messages:[{role:'assistant',content:OPENING}]);setDiscovery(data.session.discovery);setChoices(choicesFor(data.session.discovery));setReview(data.session.status==='gate_ready');setResumed(true);
        if(saved?.id===resumeId){setInput(saved.draft||'');pending.current=saved.pending||null;}
      }else{
        const visibility=new URLSearchParams(window.location.search).get('visibility');
        const data=await request('/api/hire/session',{source:'ai_opportunity_audit_page',...(visibility?{visibilitySessionId:visibility}:{})});
        setId(data.sessionId);setRevision(data.revision);setMessages([{role:'assistant',content:data.opening}]);setDiscovery(data.discovery);setChoices(data.choices||choicesFor(data.discovery));setInput('');setReview(false);setResumed(false);pending.current=null;
        store({id:data.sessionId,draft:'',pending:null});
        if(force){const url=new URL(window.location.href);url.searchParams.delete('resume');url.searchParams.delete('new');window.history.replaceState(null,'',url);}
        trackSiteEvent({eventName:'hire_session_started',source:'ai_opportunity_audit_page',sessionId:data.sessionId});
      }
    }catch(e){setError(e instanceof Error?e.message:'Unable to load. Please retry.');}
    finally{setLoading(false);}
  },[router]);
  useEffect(()=>{if(!initialized.current){initialized.current=true;void boot();}},[boot]);
  useEffect(()=>{if(id)store({id,draft:input,pending:pending.current});},[id,input]);
  useEffect(()=>{log.current?.scrollTo({top:log.current.scrollHeight,behavior:'auto'});},[messages,busy]);
  useEffect(()=>{if(review)reviewRef.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});},[review]);
  useEffect(()=>{if(!busy){setSlow(false);return;}const t=setTimeout(()=>setSlow(true),5000);return()=>clearTimeout(t);},[busy]);
  async function send(e?:FormEvent,textOverride?:string){
    e?.preventDefault();const text=(textOverride??input).trim();if(!id||lock.current||!text||loading)return;
    lock.current=true;setBusy(true);setError('');setReview(false);
    const item=pending.current?.text===text?pending.current:{text,requestId:crypto.randomUUID()};pending.current=item;setInput(text);store({id,draft:text,pending:item});
    try{
      const data=await request('/api/hire/chat',{sessionId:id,message:text,requestId:item.requestId,revision});
      // Read back on a replay so a dropped response never duplicates a bubble.
      if(data.replayed){const saved=await request(`/api/hire/${id}?resume=1`);setMessages(saved.session.messages);}
      else setMessages(prev=>[...prev,{role:'user',content:text},{role:'assistant',content:data.reply}]);
      setRevision(data.revision);setDiscovery(data.discovery);setChoices(data.choices||choicesFor(data.discovery));setGuided(data.mode==='guided');setReview(Boolean(data.readyForGate));pending.current=null;setInput('');store({id,draft:'',pending:null});
      trackSiteEvent({eventName:'hire_chat_message_sent',source:'ai_opportunity_audit_page',sessionId:id,metadata:{phase:data.phase}});
    }catch(e){setError(e instanceof Error && e.name!=='TimeoutError'?e.message:'That took too long. Your answer is still here—retry safely.');}
    finally{lock.current=false;setBusy(false);}
  }
  async function finish(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!id||lock.current)return;lock.current=true;setBusy(true);setError('');
    const values=new FormData(e.currentTarget);const rawHours=String(values.get('hours')||'').trim();
    try{
      const data=await request(`/api/hire/${id}`,{confirmed:true,revision,correction:{businessType:values.get('businessType'),title:values.get('title'),process:values.get('process'),tools:values.get('tools'),hours:rawHours===''?null:Number(rawHours),automatable:values.get('automatable')==='unknown'?null:values.get('automatable')==='yes'}});
      trackSiteEvent({eventName:'hire_report_created',source:'ai_opportunity_audit_page',sessionId:id});
      router.push(`/ai-opportunity-audit/${data.sessionId}`);
    }catch(e){setError(e instanceof Error?e.message:'Could not save. Please retry.');}
    finally{lock.current=false;setBusy(false);}
  }
  const step=nextDiscoveryStep(discovery),p=primaryPain(discovery);
  const stages=['Your work','The bottleneck','Your plan'];const current=!discovery.businessType?0:step==='review'?2:1;
  return <div className="min-h-screen bg-zinc-950 text-zinc-100"><Navbar/><main id="audit" className="mx-auto max-w-5xl px-4 pb-12 pt-24 sm:px-6 sm:pt-28">
    <header className="mb-5 max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-orange-400">AI Opportunity Audit</p>
      <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-5xl">Get the busywork off your plate.</h1>
      <p className="mt-3 text-base text-zinc-400">A few focused answers. One practical first move. Your plan is yours—no phone number required.</p>
    </header>
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section aria-label="Audit conversation" className="min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-zinc-900/40">
        <ol aria-label="Audit progress" className="flex gap-2 border-b border-white/10 px-4 py-3">{stages.map((s,i)=><li key={s} aria-current={i===current?'step':undefined} className={`flex flex-1 items-center gap-2 text-xs ${i===current?'text-orange-300':'text-zinc-400'}`}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current">{i<current?<Check size={12}/>:i+1}</span>{s}</li>)}</ol>
        {resumed&&<p className="px-4 pt-3 text-xs text-emerald-300">Your saved conversation is back. Pick up where you left off.</p>}
        <div ref={log} role="log" aria-label="Conversation messages" aria-live="polite" aria-relevant="additions" className="max-h-[42svh] min-h-28 space-y-4 overflow-y-auto overscroll-contain p-4 sm:max-h-[440px] sm:p-5">
          {messages.map((m,i)=><div key={i} className={`flex ${m.role==='user'?'justify-end':''}`}><div className={`max-w-[95%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-base leading-relaxed ${m.role==='user'?'bg-orange-500 text-black':'bg-white/[.06] text-zinc-100'}`}><span className="sr-only">{m.role==='user'?'You: ':'247ROI: '}</span>{m.content}</div></div>)}
          {busy&&<p role="status" className="flex items-center gap-2 text-sm text-zinc-400"><Loader2 size={16} className="animate-spin"/>{slow?'Still working—your answer is retained.':'Working on your answer…'}</p>}
        </div>
        {!review&&<form onSubmit={send} className="border-t border-white/10 p-3 sm:p-4">
          <label htmlFor="hire-answer" className="sr-only">Your answer</label>
          <div className="flex items-end gap-2"><textarea id="hire-answer" ref={inputRef} rows={2} maxLength={2000} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send();}}} placeholder="Tell me in your own words…" disabled={busy||loading||!id} className={`${field} min-w-0 resize-y`}/><button type="submit" aria-label="Send answer" disabled={busy||loading||!id||!input.trim()} className={`${action} h-12 w-12 shrink-0 border-orange-500 bg-orange-500 text-black`}><ArrowUp size={20}/></button></div>
          {choices.length>0&&<div aria-label="Suggested answers" className="mt-3 flex flex-wrap gap-2">{choices.map(c=><button key={c.id} type="button" disabled={busy||loading||!id} className={`${action} bg-white/[.03] text-zinc-300 hover:border-orange-400`} onClick={()=>void send(undefined,c.value)}>{c.label}</button>)}</div>}
          <p className="mt-3 text-xs text-zinc-400">Use a suggestion or type. Don’t include customer records, passwords or private financial details.</p>
        </form>}
        {loading&&<p role="status" className="p-4 text-sm text-zinc-400">Opening your saved workspace…</p>}
        {error&&<div role="alert" className="m-4 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200"><p>{error}</p><div className="mt-3 flex flex-wrap gap-2"><button className={action} disabled={busy||loading} onClick={()=>void (id&&input?send():boot())}>{id&&input?'Retry answer':'Retry loading'}</button>{id&&<button className={action} disabled={busy} onClick={()=>void boot()}>Reload saved conversation</button>}</div></div>}
      </section>
      <aside className="min-w-0 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><h2 className="font-semibold">What we’ve found</h2>{discovery.businessType||p?<dl className="mt-4 space-y-3">{discoverySummary(discovery).slice(0,4).map(s=><div key={s.label}><dt className="text-xs text-zinc-400">{s.label}</dt><dd className="mt-1 break-words text-sm">{s.value}</dd></div>)}</dl>:<p className="mt-3 text-sm leading-relaxed text-zinc-400">We’ll turn your answers into a clear priority, a possible time-saving range and a first step you can actually use.</p>}
          {canProduceBrief(discovery)&&!review&&<button disabled={busy} className={`${action} mt-4 w-full border-orange-400/50 text-orange-300`} onClick={()=>setReview(true)}>Review my summary</button>}
        </div>
        <p className="flex gap-2 text-xs leading-relaxed text-zinc-400"><ShieldCheck size={18} className="shrink-0 text-orange-400"/>Human judgment stays in control. If a simpler fix makes more sense than AI, we’ll say so.</p>
        {guided&&<p role="status" className="text-xs text-amber-200">Guided mode: AI is temporarily unavailable. You can still finish and edit your plan.</p>}
      </aside>
    </div>
    {review&&p&&<section ref={reviewRef} aria-label="Confirm your summary" className="scroll-mt-24 mt-5 rounded-2xl border border-orange-400/40 bg-orange-500/[.05] p-4 sm:p-6"><h2 className="font-display text-2xl font-bold">Did we get this right?</h2><p className="mt-2 text-sm text-zinc-400">Edit anything below. Unknown hours stay blank—we won’t make them up.</p><form onSubmit={finish} className="mt-4 grid gap-4 sm:grid-cols-2" key={`${revision}-review`}>
      <label className="text-sm">Business type<input name="businessType" required maxLength={80} defaultValue={discovery.businessType||''} className={`${field} mt-1`}/></label>
      <label className="text-sm">First priority<input name="title" required maxLength={100} defaultValue={p.title} className={`${field} mt-1`}/></label>
      <label className="text-sm sm:col-span-2">How the work happens today<textarea name="process" required minLength={10} maxLength={1000} rows={3} defaultValue={p.processSteps.join('\n')} className={`${field} mt-1`}/></label>
      <label className="text-sm">Tools you use (optional)<input name="tools" maxLength={200} defaultValue={p.tools.join(', ')} className={`${field} mt-1`}/></label>
      <label className="text-sm">Hours/week on this task (optional)<input name="hours" type="number" min="0" max="168" step="0.1" placeholder="Not sure yet" defaultValue={p.time.statedHoursPerWeek??''} className={`${field} mt-1`}/></label>
      <label className="text-sm sm:col-span-2">Is this mainly repeatable computer or paperwork activity?<select name="automatable" defaultValue={p.automatable==null?'unknown':p.automatable?'yes':'no'} className={`${field} mt-1`}><option value="yes">Yes — with human review where needed</option><option value="no">No — mainly hands-on work or professional judgment</option><option value="unknown">Not sure yet</option></select></label>
      <div className="flex flex-wrap gap-3 sm:col-span-2"><button type="submit" disabled={busy} className={`${action} border-orange-500 bg-orange-500 text-black`}>{busy?'Saving your plan…':'That’s right — show my plan'}</button><button type="button" disabled={busy} onClick={()=>{setReview(false);inputRef.current?.focus();}} className={action}>Keep talking</button></div>
    </form></section>}
    <footer className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-zinc-400">
      {id&&<button className="min-h-11 underline" onClick={async()=>{try{await navigator.clipboard.writeText(`${window.location.origin}/ai-opportunity-audit?step=opportunity&resume=${id}`);setCopyStatus('Resume link copied. Keep it private.');}catch{setCopyStatus('Use your browser’s address bar or Share menu to keep this page.');const u=new URL(window.location.href);u.searchParams.set('resume',id);window.history.replaceState(null,'',u);}}}>Copy resume link</button>}
      <button disabled={busy||loading} className="flex min-h-11 items-center gap-1 underline" onClick={()=>{if(window.confirm('Start a new audit? Your previous audit still exists at its saved link.'))void boot(true);}}><RotateCcw size={12}/>Start a new audit</button>
      <Link href="/privacy-policy" className="min-h-11 content-center underline">Privacy</Link><p role="status">{copyStatus}</p>
    </footer>
  </main></div>;
}
