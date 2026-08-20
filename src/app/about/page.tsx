import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Workflow } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About 247ROI | Business Systems & AI Consulting",
  description:
    "247ROI builds business systems with AI agents, automation, custom software, and workflow improvement for companies that need cleaner operations.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About 247ROI | Business Systems & AI Consulting",
    description:
      "247ROI builds business systems with AI agents, automation, custom software, and workflow improvement for companies that need cleaner operations.",
    url: "/about",
  },
};

const beliefs = [
  "The business system matters more than the tool.",
  "A useful AI agent needs a job description, rules, controls, and visible output.",
  "Humans should keep control of judgment calls, pricing, bids, exceptions, and sensitive replies.",
  "Some systems create direct ROI. Others create cleaner visibility, fewer dropped handoffs, and less owner drag.",
];

const buildRules = [
  ["One system first", "Start with a valuable workflow before stacking more automation."],
  ["Useful output", "The system should produce replies, packets, summaries, queues, dashboards, or approval-ready work."],
  ["Clear controls", "Every build needs rules for what the AI can do and what must wait for a human."],
  ["Improve or stop", "If the workflow does not get cleaner, faster, or easier to manage, the build needs to change."],
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 md:pt-32">
        <section className="relative overflow-hidden border-b border-border/40 pb-16 md:pb-20">
          <div className="absolute inset-0 hero-gradient" />
          <div className="container relative z-10 mx-auto px-6">
            <div className="mx-auto max-w-4xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">About 247ROI</span>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Business systems for companies that need work to move.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                247ROI is led by Brendan Kelly, a Business Systems & AI Consultant helping local companies, service
                firms, professional offices, and SMB operators use AI, automation, and custom software to clean up real
                operational work.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href="/hire">
                    Map My Best Opportunities <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]">
                  <Link href="/demo">See Example Workflows</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Positioning</span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                  Not a chatbot vendor. Not a tool subscription.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  247ROI designs practical systems around real work: leads, estimates, bids, inboxes, documents,
                  approvals, reporting, dashboards, and follow-up. The goal is not to add another app. The goal is to
                  remove friction from the operation.
                </p>
              </div>
              <div className="grid gap-4">
                {beliefs.map((belief) => (
                  <div key={belief} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                    <p className="text-sm leading-relaxed text-foreground/85">{belief}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Build philosophy</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                Enterprise quality starts with discipline.
              </h2>
              <p className="mt-4 text-muted-foreground">
                The best business systems are not broad demos. They are narrow, controlled, observable workflows that
                earn more responsibility over time.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {buildRules.map(([title, body]) => (
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
              <h2 className="font-display text-3xl font-bold sm:text-5xl">The right first build should be obvious.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                If the map cannot identify a real workflow, clear human controls, and useful output, the project is not
                ready yet.
              </p>
              <Button asChild size="lg" className="mt-8 rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                <Link href="/hire">Start the AI Opportunity Map</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
