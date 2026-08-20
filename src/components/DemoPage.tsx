"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, ClipboardCheck, DatabaseZap, FileSearch, PanelsTopLeft, ShieldCheck, TimerReset } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { HERO_PRIMARY_CTA_LABEL } from "@/app/components/cta";

const examples = [
  {
    icon: DatabaseZap,
    title: "Owner dashboard",
    trigger: "Revenue, jobs, tasks, messages, and reports live across several apps and spreadsheets.",
    output: "The system pulls the important signals into one operating view so the owner can see what needs attention.",
    checks: ["Data unified", "Stale items visible", "Manual reporting reduced", "Next actions clear"],
  },
  {
    icon: PanelsTopLeft,
    title: "Internal workflow app",
    trigger: "The team tracks a workflow through texts, spreadsheets, emails, and memory because no off-the-shelf tool fits.",
    output: "A simple app gives everyone one place to submit, review, approve, and track the work.",
    checks: ["One intake path", "Approvals tracked", "Status visible", "Less chasing"],
  },
  {
    icon: ClipboardCheck,
    title: "Estimator assistant",
    trigger: "A contractor receives a job request with scattered photos and missing scope details.",
    output: "The AI requests missing inputs, organizes photos, drafts scope notes, and prepares a review packet before pricing.",
    checks: ["Packets prepared", "Missing inputs found", "Quote turnaround", "Owner review time reduced"],
  },
  {
    icon: FileSearch,
    title: "Bid assistant",
    trigger: "Bid invites arrive across email, portals, and shared folders.",
    output: "The AI extracts deadlines, requirements, location, trade fit, risks, and a go/no-go checklist for the team.",
    checks: ["Qualified bids", "Deadlines protected", "Poor-fit jobs skipped", "Prep time reduced"],
  },
  {
    icon: Bot,
    title: "Operations agent",
    trigger: "The owner is the glue between inboxes, calendars, CRMs, shared docs, and internal reminders.",
    output: "The AI builds the daily queue, prepares summaries, routes exceptions, updates records, and flags work waiting on a person.",
    checks: ["Queues cleared", "Records updated", "Handoffs completed", "Fewer owner bottlenecks"],
  },
];

const sampleOutputs = [
  {
    label: "Estimator packet",
    lines: ["Customer: Hillcrest HOA", "Scope: gutter replacement plus fascia review", "Missing: north elevation photos", "Human approval: final price and warranty language"],
  },
  {
    label: "Bid intake summary",
    lines: ["Deadline: Friday 2:00 PM", "Fit: service area match, margin unknown", "Risks: alternate spec, insurance certificate", "Next step: estimator review before noon"],
  },
  {
    label: "Daily ops queue",
    lines: ["4 replies need approval", "3 CRM records updated", "2 estimate follow-ups drafted", "1 billing handoff waiting on owner"],
  },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 md:pt-32">
        <section className="relative overflow-hidden border-b border-border/40 pb-16 md:pb-20">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/15 via-transparent to-transparent pointer-events-none" />
          <div className="container relative z-10 mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mx-auto max-w-4xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Example workflows</span>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                See what a practical business system can produce.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                The value is not a chat bubble. It is the useful output: the dashboard, internal app, prepared estimate
                packet, bid checklist, cleaned-up operating queue, and approval-ready summary.
              </p>
              <div className="mt-8 flex justify-center">
                <Button asChild size="lg" className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href="/hire">{HERO_PRIMARY_CTA_LABEL}</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-5 lg:grid-cols-2">
              {examples.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: index * 0.04 }}
                    className="rounded-3xl border border-white/10 bg-white/[0.035] p-7"
                  >
                    <div className="mb-5 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/15">
                        <Icon className="h-6 w-6 text-primary" aria-hidden />
                      </div>
                      <h2 className="font-display text-2xl font-bold">{item.title}</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Trigger</p>
                        <p className="mt-2 text-sm leading-relaxed text-foreground/85">{item.trigger}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Output</p>
                        <p className="mt-2 text-sm leading-relaxed text-foreground/85">{item.output}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      {item.checks.map((metric) => (
                        <div key={metric} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                          {metric}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Sample outputs</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                This is what buyers should be able to inspect.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every system should leave behind useful artifacts: dashboards, apps, summaries, packets, queues, drafts,
                and decisions waiting on human approval.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {sampleOutputs.map((sample) => (
                <div key={sample.label} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">{sample.label}</p>
                  <div className="mt-5 space-y-3">
                    {sample.lines.map((line) => (
                      <div key={line} className="rounded-2xl border border-white/10 bg-background/40 p-4 text-sm leading-relaxed text-foreground/85">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-5xl rounded-3xl border border-primary/25 bg-primary/10 p-8 sm:p-12">
              <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">What happens next</p>
                  <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Pick one workflow. Build one useful system. Inspect the output.</h2>
                  <p className="mt-4 text-muted-foreground">
                    The first build should be narrow enough to launch quickly and valuable enough to keep.
                  </p>
                </div>
                <div className="space-y-3">
                  {["Inputs defined", "Human approvals clear", "Useful output visible"].map((text) => (
                    <div key={text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/35 p-4 text-sm font-semibold">
                      <TimerReset className="h-4 w-4 text-primary" aria-hidden />
                      {text}
                    </div>
                  ))}
                  <Link href="/hire" className="inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4">
                    Start Audit <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
