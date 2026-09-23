"use client";
import Link from "next/link";
import { TrafficMixChart } from "./TrafficMixChart";
import type { AuditReport, ScanSession } from "@/lib/audit/types";
import { buildReportPresentation, type ReportPresentation } from "@/lib/audit/report-presentation";
import { buildVisualBrief, rankLabel, safePagePath } from "@/lib/audit/visual-brief";

function Step({ now, goal }: { now: string; goal: string }) {
  return <div className="brief-step"><div><span>NOW</span><p>{now}</p></div><b aria-hidden>→</b><div><span>GOAL · NOT A FORECAST</span><p>{goal}</p></div></div>;
}
export function ReportSummary({ session, report, sessionId, presentation: provided, onCtaClick }: {
  session: ScanSession; report: AuditReport; sessionId: string; presentation?: ReportPresentation; onCtaClick?: (action: string) => void;
}) {
  const presentation = provided ?? buildReportPresentation(session, report, sessionId);
  const b = buildVisualBrief(report);
  const selected = new Set(b.opportunities.map(o => o.query));
  const ranks = [...b.checks.filter(c => selected.has(c.query)), ...b.checks.filter(c => !selected.has(c.query))];
  const rankRows = (rows: typeof ranks) => rows.map(c => <div className="brief-rank" key={c.key}>
    <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-medium">{c.query}</p><strong className="text-cyan-200">{rankLabel(c)}</strong></div>
    <div className="rank-track" aria-label={`Inspected organic positions for ${c.query}`}>
      {Array.from({length: Math.max(20, ...c.hits.map(h=>h.position))},(_,i)=>i+1).map(n=><span key={n} title={`Position ${n}: ${c.hits.some(h=>h.position===n) ? c.hits.find(h=>h.position===n)?.isTarget ? "your site" : "another result" : "not inspected"}`} className={c.hits.some(h=>h.position===n && h.isTarget) ? "rank-you" : c.hits.some(h=>h.position===n) ? "rank-observed" : "rank-unknown"}>{n===1 || n===10 || n===20 ? n : ""}</span>)}
    </div>
    <details className="brief-more"><summary>Search scope & date</summary><p className="brief-note">{c.checkedDepth ? `Contiguous positions 1–${c.checkedDepth}` : "No complete contiguous window"} · {c.completeTop20Window ? "complete top-20 window" : "top-20 absence not established"} · {c.providerLocation} · {c.device} · {c.observedAt?.slice(0,10) ?? "date unknown"}</p></details>
  </div>);
  return <section className="visual-brief" data-testid="report-summary" aria-labelledby="report-summary-headline">
    <div className="brief-cover">
      <p className="brief-eyebrow">247ROI / THE ONE-MINUTE BRIEF</p>
      <h1 id="report-summary-headline">{presentation.headline}</h1>
      <p className="mt-3 text-zinc-300">{session.business_name} <span className="text-zinc-500">· {presentation.geographyNote}</span></p>
      <div className="brief-standings">
        <article data-testid="report-seo-card"><span className="brief-eyebrow">GOOGLE SEARCH / SEO</span><strong data-testid="report-seo-card-value">{b.seoStanding}</strong><p>{b.seoDetail}</p></article>
        <article data-testid="report-ai-card"><span className="brief-eyebrow">AI ANSWERS</span><strong data-testid="report-ai-card-value">{b.aiStanding}</strong><p>{b.aiUsable.length ? `Mentioned your business. ${b.citations.filter(s=>s.evidence.cited).length}/${b.citations.length} measured answers linked to your site.` : presentation.aiCard.detail}</p></article>
      </div>
      <p className="brief-note mt-3">Saved search & AI samples. {report.aiSampling?.scopeWarnings?.length ? "Some US-wide AI answers included local results; not a national standing." : "Search positions and AI answers can change."}</p>
    </div>
    <TrafficMixChart />
    <section className="brief-panel" aria-labelledby="brief-google">
      <div className="brief-section-heading"><span>01 / GET FOUND</span><h2 id="brief-google">Turn the right search into a conversation.</h2></div>
      <div className="brief-page-targets" data-testid="current-page-targets"><h3>Your pages already talk about</h3>
        {b.opportunities.length ? <div className="flex flex-wrap gap-2 mt-2">{b.opportunities.map(o=><a key={o.query} href={o.support!.url} target="_blank" rel="noopener noreferrer" className="brief-chip">{o.support!.title?.split("|")[0].trim() || safePagePath(o.support!.url)} ↗</a>)}</div> : <p>{b.pages.length ? b.pages.slice(0,3).map(page=>page.title || page.url).join(" · ") : "Page topics were not retained in this saved report."}</p>}
        <p className="brief-note mt-2">Current page topics, separate from the rankings below.</p>
      </div>
      <div data-testid="measured-rankings" className="mt-5"><h3>Where you actually showed up</h3><p className="brief-note">Each block is an organic position: teal = your site, gray = another result, outline = not inspected.</p>
        {ranks.length ? rankRows(ranks.slice(0,3)) : <p className="py-4 text-zinc-400">Rankings not measured. Available older search samples remain in the full report.</p>}
        {ranks.length>3 && <details className="brief-more"><summary>See all {ranks.length} checked searches</summary>{rankRows(ranks.slice(3))}</details>}
        {ranks.length>0 && <p className="brief-note">Saved third-party search captures; later results may drift off topic. Inspected depth is not search demand. Provider, URLs and raw evidence references are in the full report.</p>}
      </div>
    </section>
    <section className="brief-panel" data-testid="keyword-opportunities"><div className="brief-section-heading"><span>02 / PICK YOUR NEXT WINS</span><h2>Start with pages you already have.</h2></div>
      <p className="brief-note mb-4">Build on an existing service page first. The goal is first-page visibility; the work starts with useful content and real proof.</p><details className="brief-more"><summary>How these suggestions were chosen</summary><p>Service fit, buyer intent, existing page support and returned competition. Demand, difficulty and likely returns are unmeasured. Goals are not forecasts or guarantees.</p></details>
      <div className="brief-opportunities">{b.opportunities.map((o,i)=><article key={o.query} className="brief-opportunity">
        <span className="brief-eyebrow">{String(i+1).padStart(2,"0")} / {i===0 ? "START HERE" : "BUILD ON AN EXISTING PAGE"}</span><h3>{o.query}</h3>
        <Step now={o.check ? rankLabel(o.check) : "Not measured"} goal="First page for this buyer search"/>
        <p>{i===0 ? "Add one real work example, who it helps, scope and a clear next step." : i===1 ? "Show the before-and-after workflow, delivery steps and what the buyer needs to provide." : "Build a detailed buyer guide and attributable case proof; link it to this service page."}</p>
        <details className="brief-more"><summary>Why this keyword?</summary><p>Service-provider intent in the saved query plan; wording overlaps an <a href={o.support!.url} target="_blank" rel="noopener noreferrer">observed page ↗</a>. This supports content fit, not easy rankings.</p><p className="mt-2">Returned search competition: {o.rivals.slice(0,2).map((r,j)=><span key={r.url}>{j>0 ? "; " : ""}<a href={r.url} target="_blank" rel="noopener noreferrer">#{r.position} {r.hostname}</a></span>)}. These are search results, not verified peer businesses. Confirm demand and service capacity before expanding.</p></details>
      </article>)}</div>
      {b.broader && <article className="brief-page-targets mt-4" data-testid="broader-target"><span className="brief-eyebrow">PROPOSED EXPANSION · VALIDATE FIRST</span><h3>{b.broader.query}</h3><p>A separate target from your saved service plan. Confirm buyer demand and delivery fit, then decide whether to expand an existing page or create a dedicated page with real work examples.</p><details className="brief-more"><summary>Proposal basis</summary><p>From the saved service-provider query plan. Not a measured demand estimate or a ranking forecast; an uninspected page may already cover this topic.</p></details></article>}
      {!b.opportunities.length && <div className="brief-page-targets"><h3>A shortlist needs more evidence.</h3><p>No saved buyer queries could be matched to inspected service pages. Confirm your main service, match a real landing page, then check buyer searches. We have not invented three targets.</p></div>}
    </section>
    <section className="brief-panel brief-ai" data-testid="ai-buyer-questions"><div className="brief-section-heading"><span>03 / BECOME AN ANSWER</span><h2>Give AI a reason to name you.</h2></div>
      <div className="space-y-3">{b.questions.slice(0,3).map(q=><article key={q.query} className="brief-question"><h3>“{q.query}”</h3><div className="flex flex-wrap gap-2 mt-2">{q.samples.map(s=><span className="brief-chip" key={s.key}>{s.engine === "chatgpt" ? "ChatGPT" : "Google AI Mode"} · {s.evidence.state!=="observed" || s.evidence.error ? "Unknown" : `${s.evidence.mentioned === true ? "Mentioned" : s.evidence.mentioned === false ? "No mention" : "Mention unknown"} / ${s.evidence.cited === true ? "Linked" : s.evidence.cited === false ? "No link" : "Link unknown"}`}</span>)}</div></article>)}</div>
      {!b.questions.length && <p className="text-zinc-400">No buyer-question set retained. Any available older AI answers remain in the full report; missing evidence is not absence.</p>}
      <Step now={b.aiStanding === "Not measured" ? "Presence unknown" : `${b.aiStanding} mention you`} goal="Named and linked for relevant buyer questions"/>
      <div className="brief-proof"><p><strong>Make the service specific.</strong> Answer who you help, where you work, how delivery works and what makes a good fit.</p><p><strong>Make the proof checkable.</strong> Publish real examples with permission. Ask for honest reviews only from genuine customers.</p><p><strong>Check the same questions again.</strong> Compare mentions and links after improvements; neither is guaranteed or a visit.</p></div>
      <details className="brief-more"><summary>AI sources & competitive context</summary><p>Saved consumer-product captures, not generated audit answers. {b.aiUsable.map(s=>`${s.engine}: ${s.evidence.observedAt?.slice(0,10) ?? "date unknown"}, ${s.evidence.location}`).filter((s,i,a)=>a.indexOf(s)===i).join(" · ")}</p><p className="mt-2">{report.assessment?.competitors.filter(c=>c.status==="verified").map(c=><span key={c.domain}><a href={c.sourceUrls[0]} target="_blank" rel="noopener noreferrer">{c.domain}</a>: published service/market overlap verified; not delivery quality. </span>)}Broad answers can name software platforms rather than service businesses. Full report retains answers and provider-listed sources.</p></details>
    </section>
    <section className="brief-close" data-testid="report-consultation-cta"><div><p className="brief-eyebrow">ONE PRACTICAL NEXT STEP</p><h2>{b.opportunities.length ? "Improve one page. Add real proof. Then compare." : "Confirm the service. Fill the evidence gaps first."}</h2><p>Useful for Google. Useful for buyers. Easier for AI to understand. Each result still needs its own measurement.</p></div><Link className="brief-button print:hidden" data-testid="consultation-link" href={presentation.consultationHref} onClick={()=>onCtaClick?.("discuss_priorities")}>Discuss my priorities ↗</Link></section>
  </section>;
}
