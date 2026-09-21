import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type ChatGPTEvidenceView = {
  state: string; query: string; observedAt: string; location: string;
  answer?: string; citations: { title: string; url: string }[];
  mentioned: boolean | null; cited: boolean | null; error?: string;
};

export function ChatGPTResults({ evidence }: { evidence?: ChatGPTEvidenceView }) {
  if (!evidence) return null;
  const observed = evidence.state === "observed";
  return <Card className="min-w-0 border-zinc-800 bg-zinc-950">
    <CardHeader><CardTitle>ChatGPT search — captured answer sample</CardTitle></CardHeader>
    <CardContent className="space-y-3 break-words text-sm text-zinc-300">
      <p>{observed ? "A consumer ChatGPT search response collected through DataForSEO—not an OpenAI model completion." : "No usable ChatGPT answer was collected. This is a measurement gap, not proof your business is absent."}</p>
      <p><strong>Buyer question:</strong> {evidence.query}</p>
      <p className="text-xs text-zinc-500">Collection location: {evidence.location} · {evidence.observedAt} · One sample, not an overall visibility score.</p>
      {observed && <p><strong>Business mentioned:</strong> {evidence.mentioned === null ? "Unknown" : evidence.mentioned ? "Yes" : "No"} · <strong>Website cited:</strong> {evidence.cited === null ? "Unknown" : evidence.cited ? "Yes" : "No"}</p>}
      {evidence.answer && <details><summary className="cursor-pointer text-cyan-300">Read the captured ChatGPT answer</summary><p className="mt-3 whitespace-pre-wrap">{evidence.answer}</p></details>}
      {evidence.citations.length > 0 && <div><p className="font-medium">Sources in this answer</p><ul className="list-inside list-disc space-y-1">{evidence.citations.map(c => <li key={c.url}><a className="break-all text-cyan-300 underline" href={c.url} target="_blank" rel="noopener noreferrer">{c.title || c.url}</a></li>)}</ul></div>}
      {observed && !evidence.mentioned && !evidence.cited && <p>Next: compare the cited providers’ relevant service pages, specific proof and public business information with yours. Improve demonstrated gaps first; this single answer does not establish an overall ranking or guarantee future recommendations.</p>}
      {!observed && evidence.error && <p className="text-xs text-amber-300">{evidence.error}</p>}
    </CardContent>
  </Card>;
}
