import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { DomainResearchEvidence } from "@/lib/audit/probes/domain-research";
import type { SiteReviewResult } from "@/lib/audit/probes/site-review";
import type { AISamplingReport } from "@/lib/audit/probes/ai-sampling";

export function DomainResearchResults({evidence}:{evidence?:DomainResearchEvidence}) {
  if (!evidence) return null;
  const keywords=evidence.rankedKeywords; const competitors=evidence.relatedCompetitors;
  return <Card className="min-w-0 border-zinc-800 bg-zinc-950"><CardHeader><CardTitle>Existing rankings & search competitors</CardTitle><p className="text-sm text-zinc-400">Independent domain research—not private Search Console data. US/English national database, separate from ZIP-local live samples.</p></CardHeader>
    <CardContent className="space-y-4 break-words text-sm">
      <p className="text-zinc-400">{keywords.keywords.length} ranking keywords returned in this bounded sample{keywords.totalDatabaseItems!==null ? `; ${keywords.totalDatabaseItems} matching entries reported by the provider` : ""}. Collected {evidence.collectedAt}.</p>
      {keywords.state!=="observed" && <p className="text-amber-300">{keywords.state==="no_data" ? "The database returned no usable keyword coverage. This does not establish zero rankings or zero traffic." : keywords.error || "Keyword research was unavailable."}</p>}
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">{keywords.keywords.map(k=><div key={k.keyword+k.url} className="min-w-0 rounded-lg border border-zinc-800 p-3"><p className="font-medium text-zinc-100">{k.keyword}</p><p className="mt-1 text-cyan-300">Organic position {k.rankGroup} · Estimated monthly searches: {k.monthlySearchVolumeEstimate ?? "unavailable"}</p><a href={k.url} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-xs text-zinc-400 underline">{k.url}</a><p className="mt-1 text-xs text-zinc-500">SERP updated: {k.serpUpdatedAt ?? "unknown"} · Volume updated: {k.keywordDataUpdatedAt ?? "unknown"}</p></div>)}</div>
      <h3 className="font-semibold text-zinc-100">Domains competing for overlapping searches</h3>
      <p className="text-xs text-zinc-400">These are observed keyword-overlap competitors; some may be directories or publishers rather than businesses offering the same service. Overlap does not explain the cause of their rankings.</p>
      {competitors.competitors.length ? <ul className="space-y-2">{competitors.competitors.map(c=><li key={c.domain}><a href={`https://${c.domain}`} target="_blank" rel="noopener noreferrer" className="break-all text-cyan-300 underline">{c.domain}</a><span className="text-zinc-400"> — {c.intersectingKeywords} shared keywords{c.averagePositionOnIntersectingKeywords!==null ? `; average position ${c.averagePositionOnIntersectingKeywords}` : ""}</span></li>)}</ul> : <p className="text-zinc-400">{competitors.error || "No usable competitor-overlap data returned."}</p>}
      <details className="text-xs text-zinc-500"><summary className="cursor-pointer">Data sources and limits</summary><p className="mt-2">{evidence.methodology}</p></details>
    </CardContent></Card>;
}

export function SiteReviewResults({evidence}:{evidence?:SiteReviewResult}) {
  if (!evidence) return null;
  return <Card className="min-w-0 border-zinc-800 bg-zinc-950"><CardHeader><CardTitle>Multi-page website inspection</CardTitle></CardHeader><CardContent className="space-y-3 break-words text-sm text-zinc-400">
    <p>{evidence.coverage.inspected} pages inspected / {evidence.coverage.attempted} attempted · {evidence.coverage.discovered} links discovered · Limit {evidence.coverage.limit} pages.</p>
    <p>Source HTML checks—not proof of Google indexing or a rendered-browser accessibility audit. Findings feed the prioritized plan above.</p>
    <details><summary className="cursor-pointer text-cyan-300">Inspected pages and results</summary><ul className="mt-3 space-y-3">{evidence.pages.map(p=><li key={p.url}><a className="break-all underline" href={p.url} target="_blank" rel="noopener noreferrer">{p.url}</a><p>{p.status} · HTTP {p.httpStatus ?? "unknown"} · {p.title ?? "No title detected"}</p><p className="text-xs">{p.error || (p.noindex ? "Noindex directive detected; check page purpose." : "")}</p></li>)}</ul></details>
    {evidence.errors.length>0 && <details><summary className="cursor-pointer text-amber-300">Collection limits / skipped pages</summary>{evidence.errors.map((e,i)=><p className="mt-2 break-all text-xs" key={i}>{e.url}: {e.reason}</p>)}</details>}
    <details><summary className="cursor-pointer">Methodology</summary><ul className="mt-2 list-inside list-disc text-xs">{evidence.samplingLimits.map(x=><li key={x}>{x}</li>)}</ul></details>
  </CardContent></Card>;
}

export function AISamplingResults({evidence}:{evidence?:AISamplingReport}) {
  if (!evidence) return null;
  return <Card className="min-w-0 border-zinc-800 bg-zinc-950"><CardHeader><CardTitle>AI visibility across buyer questions</CardTitle><p className="text-sm text-zinc-400">{evidence.summary.available} usable answers / {evidence.summary.total} planned samples. These counts describe this test—not overall market visibility.</p></CardHeader><CardContent className="space-y-4 break-words text-sm">
    {(["chatgpt","google_ai_mode"] as const).map(engine=>{const s=evidence.byEngine[engine];return <p key={engine} className="text-zinc-300"><strong>{engine==="chatgpt"?"Consumer ChatGPT":"Google AI Mode"}:</strong> mentioned in {s.mentions.count}/{s.mentions.denominator} measured answers; website in provider-listed sources for {s.citations.count}/{s.citations.denominator}. {s.unavailable>0?`${s.unavailable} unavailable samples excluded.`:""}</p>;})}
    {evidence.samples.map(s=><details key={s.key} className="min-w-0 rounded-lg border border-zinc-800 p-3"><summary className="cursor-pointer text-cyan-300">{s.engine==="chatgpt"?"ChatGPT":"Google AI Mode"} · {s.intent.replaceAll("_"," ")} · {s.evidence.state}</summary><p className="mt-3 font-medium text-zinc-100">{s.query}</p><p className="mt-2 text-xs text-zinc-500">{s.evidence.observedAt} · {s.evidence.location} · {s.evidence.source}</p>{s.evidence.error&&<p className="mt-2 text-amber-300">{s.evidence.error}</p>}{s.evidence.answer&&<p className="mt-3 whitespace-pre-wrap text-zinc-300">{s.evidence.answer}</p>}{s.evidence.citations.length>0&&<ul className="mt-3 space-y-2">{s.evidence.citations.map((c,i)=><li key={c.url+i}><a className="break-all text-cyan-300 underline" href={c.url} target="_blank" rel="noopener noreferrer">{c.title||c.url}</a></li>)}</ul>}</details>)}
    <p className="text-xs text-zinc-400">Source counts use the provider-listed source array only. Inline links in the retained answer text are preserved but not included in these counts.</p>
    <details className="text-xs text-zinc-500"><summary className="cursor-pointer">Sampling methodology</summary><p className="mt-2">{evidence.methodology}</p></details>
  </CardContent></Card>;
}
