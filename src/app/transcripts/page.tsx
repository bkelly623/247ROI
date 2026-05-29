import type { Metadata } from "next";
import Link from "next/link";
import { getTranscriptsIndex } from "@/lib/transcripts";

export const metadata: Metadata = {
  title: "Video Transcripts | 247ROI",
  description:
    "Video transcripts and breakdowns for lead capture, missed calls, and 24/7 revenue systems — summaries, takeaways, and FAQs.",
  alternates: { canonical: "/transcripts" },
};

export default async function TranscriptsIndexPage() {
  const transcripts = await getTranscriptsIndex();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Video transcripts</h1>
      <p className="mt-4 text-muted-foreground max-w-3xl">
        Each transcript includes an executive summary, key takeaways, and FAQs to make the content
        easy to scan for humans and easy to parse for search engines and LLMs.
      </p>

      <div className="mt-10 grid gap-4">
        {transcripts.map((t) => (
          <Link
            key={t.slug}
            href={`/transcripts/${t.slug}`}
            className="block rounded-xl border border-border/70 p-5 hover:border-border transition-colors"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold">{t.title}</h2>
              <span className="text-sm text-muted-foreground whitespace-nowrap">{t.publishedAt}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t.summary}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
