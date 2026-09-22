import {pieSlice,trafficMix,TRAFFIC_BENCHMARK as benchmark} from '@/lib/audit/traffic-mix';

export function TrafficMixChart(){
 const mix=trafficMix();let angle=-90;
 const slices=mix.rows.map(row=>{const path=pieSlice(angle,row.percent);angle+=row.percent*3.6;return {...row,path};});
 return <section data-testid="traffic-mix" className="overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-slate-900 to-zinc-950 p-5 sm:p-7">
   <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-widest text-orange-300">How customers discover businesses</p><span className="rounded-full border border-amber-300/30 px-3 py-1 text-[11px] text-amber-200">Estimated · regional benchmark</span></div>
   <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Estimated search traffic mix</h2>
   <p className="mt-1 text-xs text-slate-400">Search &amp; AI visits only · not measured traffic for your business</p>
   <div className="grid min-w-0 items-center gap-4 sm:grid-cols-[1fr_1fr]">
     <svg data-testid="traffic-pie" viewBox="0 0 300 300" role="img" aria-label={slices.map(s=>`${s.label}: ${s.percent.toFixed(1)} percent`).join('; ')} className="mx-auto w-full max-w-[290px] drop-shadow-2xl">
       <title>Estimated search and AI referral mix — North America benchmark, August 2026</title>
       {slices.map(s=><path key={s.key} d={s.path} fill={s.color}><title>{s.label}: {s.percent.toFixed(1)}%</title></path>)}
     </svg>
     <div className="space-y-4">{slices.map(s=><div key={s.key} className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{background:s.color}}/><span className="text-sm font-medium text-slate-200">{s.label}</span></div><strong className="text-3xl tabular-nums text-white">{s.percent.toFixed(1)}<span className="text-base text-slate-400">%</span></strong></div>)}
       <p className="border-t border-white/10 pt-3 text-xs text-slate-400">AI includes ChatGPT, Meta AI and Gemini in this benchmark.</p>
     </div>
   </div>
   <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl border border-orange-400/25 bg-orange-400/5 p-3"><p className="text-xs font-semibold text-orange-300">GOOGLE &amp; SEARCH</p><p className="mt-1 text-sm font-bold text-white">Win the searches happening now.</p></div><div className="rounded-xl border border-emerald-400/25 bg-emerald-400/5 p-3"><p className="text-xs font-semibold text-emerald-300">AI ANSWERS</p><p className="mt-1 text-sm font-bold text-white">Build another way to be found.</p></div></div>
   <details className="mt-4 text-xs text-slate-400"><summary className="w-fit cursor-pointer rounded px-1 py-2 underline underline-offset-4 focus-visible:outline" aria-label="How this traffic estimate is calculated">ⓘ How we estimated this</summary>
     <div className="mt-2 space-y-2 leading-relaxed"><p>Starting assumption: use the published North America referral mix as a regional prior for a US-focused audit. This is not a business-specific forecast, trades-only study or a measurement of your visitors. Business size, industry and actual traffic have not been fitted.</p>
     <p>We normalize the listed search engines and AI assistants to 100%. Direct, social, other channels and unlisted sources are excluded. Search referrals may include paid visits. Google AI features remain within Google; they are not counted again as separate AI traffic. AI recommendations without a website click are not captured.</p>
     <p>We do not turn ranking positions or AI mentions into invented traffic percentages. The larger search group places SEO first for this starting model; traffic share alone is not a forecast of sales or ROI.</p>
     <p><a href={benchmark.source} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline">{benchmark.sourceName} · {benchmark.region} · {benchmark.period}</a></p>
     <ul className="grid grid-cols-2 gap-x-4 gap-y-1">{benchmark.sources.map(s=><li key={s.name}>{s.name}: {s.share.toFixed(2)}% of source study traffic</li>)}</ul>
     </div>
   </details>
 </section>;
}
