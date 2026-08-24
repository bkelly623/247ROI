import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ARTICLES, getArticle } from "@/lib/articles";
import { SITE_URL } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  return {
    title: `${article.title} | 247ROI`,
    description: article.description,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      title: `${article.title} | 247ROI`,
      description: article.description,
      url: `/articles/${article.slug}`,
      type: "article",
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const articleUrl = `${SITE_URL}/articles/${article.slug}`;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE_URL}/articles` },
      { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
    ],
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: articleUrl,
    publisher: { "@type": "Organization", name: "247ROI", url: SITE_URL },
    keywords: [article.primaryKeyword, ...article.secondaryKeywords].join(", "),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Navbar />
      <main>
        <article>
          <section className="relative overflow-hidden border-b border-border/40 pb-14 pt-32 md:pb-20 md:pt-40">
            <div className="absolute inset-0 hero-gradient" />
            <div className="container relative z-10 mx-auto px-6">
              <div className="mx-auto max-w-4xl">
                <Link href="/articles" className="text-sm font-semibold text-primary underline underline-offset-4">
                  All articles
                </Link>
                <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-primary">{article.eyebrow}</p>
                <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  {article.title}
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">{article.summary}</p>
                <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>{article.readTime}</span>
                  <span>Primary keyword: {article.primaryKeyword}</span>
                </div>
                <Button asChild size="lg" className="mt-8 rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href="/hire">
                    Find My First AI Employee <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="border-b border-border/40 py-12 md:py-16">
            <div className="container mx-auto px-6">
              <div className="mx-auto max-w-4xl rounded-2xl border border-primary/25 bg-primary/10 p-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">Key takeaways</p>
                <div className="mt-5 grid gap-3">
                  {article.keyTakeaways.map((takeaway) => (
                    <div key={takeaway} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {takeaway}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 md:py-20">
            <div className="container mx-auto px-6">
              <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
                <div className="space-y-12">
                  {article.sections.map((section) => (
                    <section key={section.heading}>
                      <h2 className="font-display text-3xl font-bold leading-tight">{section.heading}</h2>
                      <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
                        {section.body.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                      {section.bullets?.length ? (
                        <ul className="mt-5 grid gap-3">
                          {section.bullets.map((bullet) => (
                            <li key={bullet} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-foreground/85">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                  ))}

                  <section>
                    <h2 className="font-display text-3xl font-bold">FAQ</h2>
                    <div className="mt-5 grid gap-4">
                      {article.faqs.map((faq) => (
                        <div key={faq.question} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                          <h3 className="font-display text-xl font-bold">{faq.question}</h3>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <aside className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 lg:sticky lg:top-28">
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">Related</p>
                  <div className="mt-5 grid gap-3">
                    {article.relatedLinks.map((link) => (
                      <Link key={link.href} href={link.href} className="text-sm font-semibold text-foreground/85 hover:text-primary">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Want to see the version of this inside your business?
                    </p>
                    <Button asChild className="mt-4 w-full rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                      <Link href="/hire">Find My First AI Employee</Link>
                    </Button>
                  </div>
                </aside>
              </div>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
