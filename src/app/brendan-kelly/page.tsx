import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Workflow } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { HERO_PRIMARY_CTA_LABEL } from "@/app/components/cta";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Brendan Kelly | Business Systems & AI Consultant",
  description:
    "Brendan Kelly leads 247ROI, helping owner-led businesses find bottlenecks worth fixing and build practical systems with automation, dashboards, internal apps, and AI agents.",
  alternates: { canonical: "/brendan-kelly" },
  openGraph: {
    title: "Brendan Kelly | Business Systems & AI Consultant",
    description:
      "Brendan Kelly leads 247ROI, helping owner-led businesses find bottlenecks worth fixing and build practical systems with automation, dashboards, internal apps, and AI agents.",
    url: "/brendan-kelly",
  },
};

const focusAreas = [
  "Business systems consulting for owner-led companies and SMB operators",
  "Workflow automation for repeated computer work, handoffs, and reporting",
  "Custom AI agents for inbox triage, research, drafting, follow-up, and summaries",
  "Dashboards and internal tools for cleaner visibility and approval control",
];

const operatingRules = [
  ["Bottleneck first", "The right project starts with the workflow that is closest to money, labor, owner attention, or operating visibility."],
  ["Practical system", "The fix may be automation, a dashboard, an internal app, an AI agent, an integration, or process cleanup."],
  ["Human control", "Pricing, sensitive replies, unusual exceptions, customer commitments, and final judgment stay visible to humans."],
  ["Measured proof", "Each build needs a success metric such as saved hours, faster response, cleaner handoffs, or better reporting."],
];

export default function BrendanKellyPage() {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Brendan Kelly",
    jobTitle: "Business Systems & AI Consultant",
    url: `${SITE_URL}/brendan-kelly`,
    worksFor: {
      "@type": "Organization",
      name: "247ROI",
      url: SITE_URL,
    },
    knowsAbout: [
      "business systems consulting",
      "workflow automation",
      "business process automation",
      "custom AI agents",
      "custom business dashboards",
      "internal tools",
      "AI Opportunity Audit",
      "AI visibility",
    ],
    description:
      "Brendan Kelly leads 247ROI, a business systems consultancy that helps owners and operators find bottlenecks worth fixing and build practical systems with automation, dashboards, internal apps, and AI agents.",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 md:pt-32">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />

        <section className="relative overflow-hidden border-b border-border/40 pb-16 md:pb-20">
          <div className="absolute inset-0 hero-gradient" />
          <div className="container relative z-10 mx-auto px-6">
            <div className="mx-auto max-w-4xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Founder profile</span>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Brendan Kelly builds business systems around the bottlenecks worth fixing first.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                Brendan leads 247ROI as a Business Systems & AI Consultant for owner-led businesses, service firms,
                professional offices, contractors, and SMB operators that need cleaner workflows before they need
                another tool subscription.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href="/hire">
                    {HERO_PRIMARY_CTA_LABEL} <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]">
                  <Link href="/services">See Systems Work</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">What he works on</span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                  Systems for messy computer-based business work.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  The work usually starts where revenue, labor, follow-up, reporting, or owner attention gets stuck:
                  inboxes, spreadsheets, CRMs, portals, documents, dashboards, approvals, and handoffs between people
                  and software.
                </p>
              </div>
              <div className="grid gap-4">
                {focusAreas.map((area) => (
                  <div key={area} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                    <p className="text-sm leading-relaxed text-foreground/85">{area}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Operating philosophy</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                AI is useful only when the workflow is clear.
              </h2>
              <p className="mt-4 text-muted-foreground">
                247ROI treats AI employees as one possible system shape, not the whole category. The point is to build
                controlled work product the business can inspect, improve, and measure.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {operatingRules.map(([title, body]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                  <Workflow className="mb-5 h-7 w-7 text-primary" aria-hidden />
                  <h3 className="font-display text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-5xl rounded-3xl border border-primary/25 bg-primary/10 p-8 text-center sm:p-12">
              <ShieldCheck className="mx-auto mb-5 h-8 w-8 text-primary" aria-hidden />
              <h2 className="font-display text-3xl font-bold sm:text-5xl">Bring one expensive workflow.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                The AI Opportunity Audit identifies whether that workflow should become automation, a dashboard, an
                internal app, an AI agent, an integration, or a cleaner process before anything is built.
              </p>
              <Button asChild size="lg" className="mt-8 rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                <Link href="/hire">Start the AI Opportunity Audit</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
