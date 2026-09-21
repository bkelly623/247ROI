import type { SearchConsoleEvidence } from "@/lib/audit/probes/search-console";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SearchPerformance({ evidence }: { evidence?: SearchConsoleEvidence }) {
  if (!evidence || evidence.state !== "observed") return null;
  return <Card className="min-w-0 border-zinc-800">
    <CardHeader><CardTitle>Existing keywords & SEO opportunities</CardTitle>
      <p className="text-sm text-zinc-400">Google Search Console · {evidence.property} · {evidence.startDate}–{evidence.endDate}</p>
    </CardHeader>
    <CardContent className="space-y-5">
      <p className="text-lg text-zinc-100">{evidence.impressions ?? "—"} impressions · {evidence.clicks ?? "—"} clicks</p>
      <p className="text-sm text-zinc-400">These are actual recorded queries and matched pages, not generated keyword suggestions. Average position varies by search, device and date; it is not a fixed current ranking. Google omits some query data, so rows may not sum to property totals.</p>
      <div className="space-y-3">{evidence.queries.map((r,i) => <div key={i} className="min-w-0 rounded-lg border border-zinc-800 p-3">
        <p className="break-words font-semibold text-zinc-100">{r.query}</p>
        <p className="text-sm text-zinc-400">{r.impressions} impressions · {r.clicks} clicks · {(r.ctr*100).toFixed(1)}% CTR · avg. position {r.position.toFixed(1)}</p>
        {r.page && <a className="break-all text-xs text-primary underline" href={r.page} target="_blank" rel="noopener noreferrer">{r.page}</a>}
      </div>)}</div>
      <h3 className="text-lg font-semibold">What to review first</h3>
      {evidence.opportunities.map((r,i) => <div key={i} className="rounded-lg border border-orange-500/30 p-4">
        <p className="font-semibold">{i+1}. {r.query}</p>
        <p className="mt-2 text-sm text-zinc-400">{r.rationale}</p>
        <p className="mt-2 text-sm">{r.action}</p>
        <p className="mt-2 text-sm text-primary">247ROI can improve the relevant page and internal linking, then compare impressions, clicks and position against this baseline. No uplift is guaranteed.</p>
      </div>)}
    </CardContent>
  </Card>;
}
