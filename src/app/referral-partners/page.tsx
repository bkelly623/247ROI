import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Handshake, Network, ShieldCheck, Workflow } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Referral Partners | 247ROI Business Systems & AI Consulting",
  description:
    "A practical referral guide for web, CRM, marketing, bookkeeping, IT, and operations partners who meet business owners with workflow bottlenecks.",
  alternates: { canonical: "/referral-partners" },
  openGraph: {
    title: "Referral Partners | 247ROI Business Systems & AI Consulting",
    description:
      "A practical referral guide for partners who meet business owners with messy admin, reporting, lead response, or workflow bottlenecks.",
    url: "/referral-partners",
  },
};

const partnerTypes = [
  "Web designers and marketers who do not build custom internal systems.",
  "CRM consultants, IT providers, and MSPs who hear operational pain after tools are installed.",
  "Bookkeepers, fractional CFOs, and ops consultants who see messy reporting and repeated admin work.",
  "Local business coaches, peer groups, and networking leaders who know owner-led firms.",
];

const goodFits = [
  ["Scattered reporting", "Numbers live across spreadsheets, inboxes, CRMs, and memory."],
  ["Slow lead response", "New inquiries depend on one person noticing, replying, and following up."],
  ["Admin handoffs", "Approvals, documents, tasks, and updates get chased manually."],
  ["Workflow gaps", "The business has software, but the actual process still runs around the software."],
];

const notFits = [
  "They want a generic chatbot or tool subscription without changing the workflow.",
  "They need paid ads, SEO content, design, bookkeeping, or CRM setup only.",
  "They want AI to make judgment calls on pricing, sensitive replies, legal issues, or hiring without review.",
  "They cannot name one workflow that wastes time, loses money, or blocks visibility.",
];

export default function ReferralPartnersPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "247ROI Referral Partners",
      url: `${SITE_URL}/referral-partners`,
      description:
        "A referral guide for partners who serve SMB owners and meet workflow bottlenecks that need AI, automation, dashboards, internal apps, or business systems.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Business systems and AI automation referral support",
      provider: {
        "@type": "Organization",
        name: "247ROI",
        url: SITE_URL,
      },
      areaServed: "US",
      serviceType: "Business systems consulting, workflow automation, custom AI agents, dashboards, and internal apps",
      audience: {
        "@type": "BusinessAudience",
        audienceType: "Referral partners serving owner-led businesses and SMB operators",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 md:pt-32">
        {jsonLd.map((item, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
          />
        ))}

        <section className="relative overflow-hidden border-b border-border/40 pb-16 md:pb-20">
          <div className="absolute inset-0 hero-gradient" />
          <div className="container relative z-10 mx-auto px-6">
            <div className="mx-auto max-w-4xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Referral partners</span>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Send the workflow bottlenecks your service does not solve.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                247ROI works well beside web, CRM, marketing, bookkeeping, IT, and ops providers when a business needs a
                practical system around messy computer-based work.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href="/hire">
                    Start with an audit <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]">
                  <Link href="/what-should-my-business-automate-first">Share the checklist</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Where 247ROI fits</span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                  Keep your core service. Add a trusted systems path.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  A referral makes sense when the client already has tools or advice, but the work still gets delayed,
                  copied, chased, or hidden across software. 247ROI maps the bottleneck first, then builds the practical
                  layer: automation, AI agent, dashboard, internal app, integration, or process cleanup.
                </p>
              </div>
              <div className="grid gap-4">
                {partnerTypes.map((type) => (
                  <div key={type} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <Handshake className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                    <p className="text-sm leading-relaxed text-foreground/85">{type}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Best referral signals</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                Listen for bottlenecks close to money, time, or visibility.
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {goodFits.map(([title, body]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                  <Workflow className="mb-5 h-7 w-7 text-primary" aria-hidden />
                  <h3 className="font-display text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Simple share note</span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                  A plain-English way to introduce 247ROI.
                </h2>
              </div>
              <div className="rounded-3xl border border-primary/20 bg-primary/10 p-6">
                <p className="text-base leading-8 text-foreground/90">
                  I know Brendan at 247ROI. He helps owners find the operational bottleneck worth fixing first, then
                  builds the practical system around it: automation, AI agents, dashboards, internal apps, integrations,
                  or process cleanup. If you have a workflow that keeps getting chased by hand, the AI Opportunity Audit
                  is a useful first step.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Not every lead fits</span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                  The strongest referrals are specific.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  247ROI is for business-system gaps, not broad AI curiosity. A good referral starts with one workflow
                  that needs clearer ownership, faster movement, better visibility, or less manual work.
                </p>
              </div>
              <div className="space-y-4">
                {notFits.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                    <p className="text-sm leading-relaxed text-foreground/85">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center sm:p-10">
              <Network className="mx-auto mb-5 h-8 w-8 text-primary" aria-hidden />
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Have one messy workflow in mind?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Send the audit link first. It gives the owner a practical way to describe the bottleneck before anyone
                talks about tools.
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
