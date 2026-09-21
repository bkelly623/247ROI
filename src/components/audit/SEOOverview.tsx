import type { AuditReport } from '@/lib/audit/types';
import { seoOverview } from '@/lib/audit/seo-overview';
import { PageSpeedVitals } from './PageSpeedVitals';

export function SEOOverview({report}:{report:AuditReport}) {
  const seo=seoOverview(report);
  return <section id="website-seo" data-testid="seo-overview" className="min-w-0 space-y-5 rounded-2xl border border-cyan-500/30 bg-zinc-950 p-5 sm:p-6">
    <div><h2 className="text-2xl font-bold text-zinc-100">Website SEO results</h2>
      <p className="mt-2 text-sm text-zinc-400">Your website checks and SEO fixes are shown here, separately from keyword-database coverage and AI visibility.</p></div>
    <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
      <PageSpeedVitals report={report}/>
      <div className="min-w-0 rounded-xl border border-zinc-800 p-4">
        <h3 className="font-semibold text-zinc-100">On-page SEO checks</h3>
        {seo.pages.length ? <><p className="mt-1 text-sm text-zinc-400">{seo.pages.length} fetched pages inspected. These are HTML checks, not proof of Google indexing.</p>
          <dl className="mt-4 space-y-3">{seo.checks.map(c=><div key={c.label} className="flex flex-wrap justify-between gap-2 text-sm"><dt className="text-zinc-300">{c.label}</dt><dd className="font-semibold text-cyan-300">{c.passed} / {seo.pages.length} pages</dd></div>)}</dl>
          <p className="mt-4 text-sm text-zinc-400">Noindex directives found: {seo.noindex}.{seo.unknownIndexability>0?` ${seo.unknownIndexability} pages have unknown directive status.`:''} Broken internal links observed: {seo.brokenLinks ?? 'not measured'}.</p>
        </>:<p className="mt-3 text-sm text-amber-300">Page-level inspection was unavailable. Available Lighthouse and search results remain shown separately; this is not a zero SEO score.</p>}
      </div>
    </div>
    <div><h3 className="font-semibold text-zinc-100">SEO improvement priorities</h3>
      {seo.fixes.length ? <ol className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">{seo.fixes.map((f,i)=><li key={f.finding} className="min-w-0 rounded-xl border border-zinc-800 p-4 text-sm"><p className="font-medium text-zinc-100">{i+1}. {f.finding}</p><p className="mt-2 text-zinc-400">{f.fix}</p>{f.evidenceUrl&&<a href={f.evidenceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block break-all text-xs text-cyan-300 underline">Source: {f.evidenceUrl}</a>}</li>)}</ol>:<p className="mt-2 text-sm text-zinc-400">No specific SEO defect was established by the available checks. This does not establish ranking or traffic performance.</p>}
    </div>
    {seo.pages.length>0&&<details className="text-sm text-zinc-400"><summary className="cursor-pointer text-cyan-300">Page-by-page SEO evidence</summary><ul className="mt-3 space-y-3">{seo.pages.map(page=><li key={page.url} className="min-w-0 rounded-lg border border-zinc-800 p-3"><a className="break-all text-cyan-300 underline" href={page.finalUrl??page.url} target="_blank" rel="noopener noreferrer">{page.finalUrl??page.url}</a><p className="mt-2">Title: {page.title||'Not detected in fetched HTML'}</p><p className="mt-1">Description: {page.metaDescription||'Not detected in fetched HTML'}</p><p className="mt-1 break-all">Canonical: {page.canonical||'Not detected in fetched HTML'}</p></li>)}</ul></details>}
    <p className="text-xs text-zinc-500">The headline score is Google&apos;s mobile Lighthouse SEO score for the tested page. It is not an overall visibility, keyword-ranking, traffic, or AI recommendation score. A high score can coexist with performance or content improvements.</p>
  </section>;
}
