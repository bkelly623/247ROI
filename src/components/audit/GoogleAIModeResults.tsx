import type { GoogleAIModeEvidence } from "@/lib/audit/probes/google-ai-mode";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
export function GoogleAIModeResults({ evidence }: { evidence?: GoogleAIModeEvidence }) {
  if (!evidence) return null;
  return <Card className="min-w-0 border-zinc-800">
    <CardHeader><CardTitle>Google AI Mode — actual answer sample</CardTitle><p className="text-sm text-zinc-400">{evidence.query}</p></CardHeader>
    <CardContent className="space-y-4 text-sm">
      <p className="text-zinc-400">SerpAPI collection · {evidence.location} · {evidence.observedAt}</p>
      {evidence.state === "observed" ? <>
        <p className="font-semibold">Brand mentioned: {evidence.mentioned ? "Yes" : "No"} · Website cited: {evidence.cited ? "Yes" : "No"}</p>
        <p className="text-zinc-400">This describes one captured answer, not all users or all searches. Mentions are not necessarily endorsements; citations are not traffic.</p>
        <details open><summary className="cursor-pointer text-primary">Read the answer</summary><p className="mt-3 whitespace-pre-wrap break-words text-zinc-200">{evidence.answer}</p></details>
        <h3 className="font-semibold">Sources returned with the answer</h3>
        {evidence.citations.length ? evidence.citations.map((c,i)=><p key={i}><a href={c.url} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline">{c.title || c.url}</a></p>) : <p className="text-zinc-400">No source links were retained in this response.</p>}
        <p className="text-zinc-400">Next step: compare the cited pages’ relevance, service detail and corroborating evidence with your own. Improve substantive gaps, then repeat the same buyer question to measure changes.</p>
      </> : <p className="text-amber-200">No usable answer was collected. This is a measurement gap, not evidence that your business is absent from AI answers.</p>}
    </CardContent>
  </Card>;
}
