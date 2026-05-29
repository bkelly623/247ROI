import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { getTranscriptBySlug, getTranscriptsIndex } from "@/lib/transcripts";

type PageProps = { params: Promise<{ slug: string }> };

function toParagraphs(markdown: string) {
  return markdown
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.replace(/\n/g, " "));
}

export async function generateStaticParams() {
  const index = await getTranscriptsIndex();
  return index.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getTranscriptBySlug(slug);
  if (!result) return {};

  const youtubeId = result.entry.youtubeId;
  const ogImage = youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : undefined;

  return {
    title: `${result.entry.title} | Transcripts | 247ROI`,
    description: result.entry.summary,
    alternates: { canonical: `/transcripts/${slug}` },
    openGraph: {
      title: `${result.entry.title} | 247ROI`,
      description: result.entry.summary,
      url: `${SITE_URL}/transcripts/${slug}`,
      type: "article",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

export default async function TranscriptPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getTranscriptBySlug(slug);
  if (!result) notFound();

  const { entry, body } = result;
  const paragraphs = toParagraphs(body);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Transcripts", item: `${SITE_URL}/transcripts` },
      { "@type": "ListItem", position: 3, name: entry.title, item: `${SITE_URL}/transcripts/${slug}` },
    ],
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    datePublished: entry.publishedAt,
    dateModified: entry.publishedAt,
    description: entry.summary,
    mainEntityOfPage: `${SITE_URL}/transcripts/${slug}`,
    publisher: { "@type": "Organization", name: "247ROI", url: SITE_URL },
  };

  const videoJsonLd = entry.youtubeId
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: entry.title,
        description: entry.summary,
        uploadDate: entry.publishedAt,
        embedUrl: `https://www.youtube.com/embed/${entry.youtubeId}`,
        contentUrl: `https://www.youtube.com/watch?v=${entry.youtubeId}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${entry.youtubeId}/hqdefault.jpg`,
        publisher: { "@type": "Organization", name: "247ROI", url: SITE_URL },
      }
    : null;

  const faqJsonLd =
    entry.faqs?.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: entry.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {videoJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
        />
      ) : null}
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}

      <div className="text-sm text-muted-foreground">
        <Link href="/transcripts" className="hover:underline">
          ← All transcripts
        </Link>
      </div>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">{entry.title}</h1>
      <div className="mt-2 text-sm text-muted-foreground">{entry.publishedAt}</div>

      {entry.youtubeId ? (
        <section className="mt-8 overflow-hidden rounded-xl border border-border/70 bg-black/20">
          <div className="aspect-video w-full">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${entry.youtubeId}`}
              title={entry.title}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-xl border border-border/70 p-6">
        <h2 className="text-base font-semibold">Executive summary</h2>
        <p className="mt-2 text-sm text-muted-foreground">{entry.summary}</p>

        {entry.primaryCta ? (
          <div className="mt-5">
            <Link
              href={entry.primaryCta.href}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm font-semibold"
            >
              {entry.primaryCta.label}
            </Link>
          </div>
        ) : null}
      </section>

      {entry.keyTakeaways?.length ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Key takeaways</h2>
          <ul className="mt-3 list-disc pl-5 text-muted-foreground">
            {entry.keyTakeaways.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {entry.faqs?.length ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <div className="mt-4 grid gap-4">
            {entry.faqs.map((f) => (
              <div key={f.q} className="rounded-xl border border-border/70 p-5">
                <h3 className="font-semibold">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Transcript</h2>
        <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
          {paragraphs.map((p, idx) => (
            <p key={`${idx}-${p.slice(0, 16)}`}>{p}</p>
          ))}
        </div>
      </section>
    </main>
  );
}
