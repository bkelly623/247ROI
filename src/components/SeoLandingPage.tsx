import Link from "next/link";
import { ArrowRight, BadgeCheck, SearchCheck, Sparkles, Target } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SEO_LANDING_PAGES, type SeoLandingPage as SeoLandingPageType } from "@/lib/seoLandingPages";
import { HERO_PRIMARY_CTA_LABEL } from "@/app/components/cta";

export default function SeoLandingPage({ page }: { page: SeoLandingPageType }) {
  const relatedPages = SEO_LANDING_PAGES.filter((candidate) => page.relatedPageSlugs?.includes(candidate.slug));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-border/40 pb-16 pt-32 md:pb-20 md:pt-40">
          <div className="absolute inset-0 hero-gradient" />
          <div className="container relative z-10 mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
              <div>
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <SearchCheck className="h-4 w-4" aria-hidden />
                  {page.eyebrow}
                </span>
                <h1 className="max-w-4xl font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  {page.headline}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{page.subheadline}</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                    <Link href="/hire">
                      {HERO_PRIMARY_CTA_LABEL} <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]">
                    <Link href="/articles">See Use Cases</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">Search focus</p>
                <h2 className="mt-3 font-display text-2xl font-bold">{page.primaryKeyword}</h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  {page.relatedKeywords.map((keyword) => (
                    <span key={keyword} className="rounded-full border border-white/10 bg-background/45 px-3 py-1 text-xs text-muted-foreground">
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/10 p-4">
                  <p className="text-sm leading-relaxed text-foreground/85">
                    247ROI builds custom automations, dashboards, internal apps, and AI agents for businesses that need
                    practical, inspectable output instead of generic AI hype.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Buyer problem</span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">The value is in the workflow, not the novelty.</h2>
                <p className="mt-4 text-muted-foreground">
                  AI earns its keep when it captures revenue, saves labor, speeds up response, prepares work product, or
                  prevents important handoffs from disappearing.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {page.buyerProblems.map((problem) => (
                  <div key={problem} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <Target className="mb-4 h-5 w-5 text-primary" aria-hidden />
                    <p className="text-sm leading-relaxed text-foreground/85">{problem}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">What 247ROI builds</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Practical systems with clear inputs, controls, and useful output.</h2>
              <p className="mt-4 text-muted-foreground">
                The build starts with connected inputs, handoff rules, approval points, and the practical evidence that
                tells us whether the workflow is getting better.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {page.systemBuilds.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <BadgeCheck className="mb-4 h-5 w-5 text-primary" aria-hidden />
                  <p className="text-sm font-medium leading-relaxed text-foreground/90">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Answers</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Questions buyers and AI answer engines both ask.</h2>
            </div>
            <div className="mx-auto grid max-w-5xl gap-4">
              {page.faqs.map((faq) => (
                <div key={faq.question} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                  <h3 className="font-display text-xl font-bold">{faq.question}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {relatedPages.length > 0 ? (
          <section className="border-b border-border/40 py-16 md:py-20">
            <div className="container mx-auto px-6">
              <div className="mx-auto max-w-5xl">
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Related pages</span>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {relatedPages.map((relatedPage) => (
                    <Link
                      key={relatedPage.slug}
                      href={`/${relatedPage.slug}`}
                      className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-primary/40 hover:bg-primary/10"
                    >
                      <p className="text-sm font-semibold text-primary">{relatedPage.primaryKeyword}</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{relatedPage.description}</p>
                      <span className="mt-4 inline-flex items-center text-sm font-semibold text-foreground">
                        Read page <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-5xl rounded-3xl border border-primary/25 bg-primary/10 p-8 text-center sm:p-12">
              <Sparkles className="mx-auto mb-5 h-8 w-8 text-primary" aria-hidden />
              <h2 className="font-display text-3xl font-bold sm:text-5xl">See what AI can do inside your business.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Bring the computer work people are still doing by hand. 247ROI will identify what can be automated,
                what should stay human, and what is worth building first.
              </p>
              <Button asChild size="lg" className="mt-8 rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                <Link href="/hire">{HERO_PRIMARY_CTA_LABEL}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
