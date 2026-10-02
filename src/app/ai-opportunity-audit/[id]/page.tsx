"use client";
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { HireReport } from '@/components/hire/HireReport';
import type { HireSession } from '@/lib/hire/types';
export default function HireReportPage(){
  const {id}=useParams<{id:string}>();
  const [session,setSession]=useState<HireSession|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{const res=await fetch(`/api/hire/${encodeURIComponent(id)}`,{cache:'no-store',signal:AbortSignal.timeout(15000)});const data=await res.json();if(!res.ok)throw new Error(data.error||'Unable to load your plan.');if(!data.unlocked||!data.session.proposal)throw new Error('Your conversation is saved, but the plan is not ready yet.');setSession(data.session);}
    catch(e){setError(e instanceof Error?e.message:'Unable to load. Please retry.');}finally{setLoading(false);}
  },[id]);
  useEffect(()=>{void load();},[load]);
  return <div className="min-h-screen bg-zinc-950"><Navbar/><main className="pt-20">
    {loading?<p role="status" className="p-12 text-center text-zinc-300">Opening your saved plan…</p>:error?<div className="mx-auto max-w-lg space-y-4 px-5 py-12 text-zinc-200"><h1 className="text-2xl font-bold">Let’s get you back to your audit.</h1><p role="alert">{error}</p><button onClick={()=>void load()} className="min-h-11 rounded-lg border border-white/20 px-4">Retry loading</button><Link href={`/ai-opportunity-audit?step=opportunity&resume=${encodeURIComponent(id)}`} className="block py-3 text-orange-300 underline">Return to saved conversation</Link><Link href="/ai-opportunity-audit?step=opportunity&new=1" className="block py-3 underline">Start a new audit</Link></div>:session?.proposal?<HireReport session={session} proposal={session.proposal}/>:null}
  </main></div>;
}
