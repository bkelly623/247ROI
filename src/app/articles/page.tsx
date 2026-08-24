import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, SearchCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ARTICLES } from "@/lib/articles";

export const metadata: Metadata = {
  title: "AI Workflow Use Cases and Articles | 247ROI",
  description:
    "Realistic examples of how custom AI employees and workflow automation can reduce screen work, clean up handoffs, and prepare useful business output.",
  alternates: { canonical: "/articles" },
  openGraph: {
    title: "AI Workflow Use Cases and Articles | 247ROI",
    description:
      "Realistic examples of how custom AI employees and workflow automation can reduce screen work, clean up handoffs, and prepare useful business output.",
    url: "/articles",
  },
};

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-border/40 pb-16 pt-32 md:pb-20 md:pt-40">
          <div className="absolute inset-0 hero-gradient" />
          <div className="container relative z-10 mx-auto px-6">
            <div className="mx-auto max-w-4xl text-center">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <SearchCheck className="h-4 w-4" aria-hidden />
                Use cases
              </span>
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Realistic ways custom AI software can take work off your plate.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                These are not fake case studies or fixed packages. They are realistic workflow examples showing what AI
                can handle, what humans still approve, and where custom software can save time.
              </p>
              <Button asChild size="lg" className="mt-8 rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                <Link href="/hire">
                  Find My First AI Employee <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {ARTICLES.map((article) => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.035] p-7 transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <FileText className="h-3.5 w-3.5" aria-hidden />
                      {article.eyebrow}
                    </span>
                    <span className="text-xs text-muted-foreground">{article.readTime}</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold leading-tight text-foreground">
                    {article.title}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{article.description}</p>
                  <div className="mt-6 rounded-xl border border-white/10 bg-background/35 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Target keyword</p>
                    <p className="mt-2 text-sm font-medium text-foreground/90">{article.primaryKeyword}</p>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Read use case <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
