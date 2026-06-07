"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ClipboardCheck, FileSearch, MessageSquareText, PhoneCall, Workflow } from "lucide-react";
import Navbar from "@/components/Navbar";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const lanes = [
  {
    title: "Revenue response",
    icon: PhoneCall,
    body: "Missed calls, inbound forms, SMS, web chat, stale estimates, and speed-to-lead workflows.",
    examples: ["AI receptionist", "Follow-up agent", "Appointment reminders"],
  },
  {
    title: "Estimator support",
    icon: ClipboardCheck,
    body: "Job intake, photo requests, scope notes, quote packets, missing details, and follow-up prep.",
    examples: ["AI estimator", "Quote packet builder", "Estimate reactivation"],
  },
  {
    title: "Bid discipline",
    icon: FileSearch,
    body: "Bid invite monitoring, deadline extraction, requirements, fit scoring, and checklist prep.",
    examples: ["Bid assistant", "Takeoff prep", "Document tracker"],
  },
  {
    title: "Inbox operations",
    icon: MessageSquareText,
    body: "Customer replies, vendor messages, internal handoffs, owner bottlenecks, and daily queues.",
    examples: ["Inbox triage", "SMS response", "Ops coordinator"],
  },
];

const process = [
  ["Audit", "We inspect one workflow and decide whether an AI employee is actually worth building."],
  ["Build", "We create the scripts, prompts, tool connections, human approvals, and handoff format."],
  ["Run", "The AI employee handles repeatable work while humans stay in control of sensitive decisions."],
  ["Measure", "You get a simple scorecard: speed, volume, saved time, prepared work, and recovered opportunities."],
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 md:pt-32">
        <section className="relative overflow-hidden border-b border-border/40 pb-16 md:pb-20">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/15 via-transparent to-transparent pointer-events-none" />
          <div className="container relative z-10 mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mx-auto max-w-4xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">What 247ROI builds</span>
              <h1 className="mx-auto mt-4 max-w-4xl font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                AI employees for the work your team keeps dropping.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                We are not selling generic automation. We build constrained AI job roles that create visible output:
                replies sent, estimate packets prepared, bids screened, calls summarized, and handoffs completed.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href="/contact">Book AI Audit</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-5 lg:grid-cols-4">
              {lanes.map((lane, index) => {
                const Icon = lane.icon;
                return (
                  <motion.div key={lane.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: index * 0.04 }} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                    <Icon className="mb-5 h-7 w-7 text-primary" aria-hidden />
                    <h2 className="font-display text-xl font-bold">{lane.title}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{lane.body}</p>
                    <div className="mt-5 space-y-2">
                      {lane.examples.map((example) => (
                        <div key={example} className="flex items-center gap-2 text-sm text-foreground/85">
                          <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
                          {example}
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
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Delivery model</span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">The job spec comes before the automation.</h2>
                <p className="mt-4 text-muted-foreground">
                  If the workflow cannot be described, measured, and handed off, it is not ready for an AI employee.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {process.map(([title, body], index) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">{index + 1}</div>
                    <h3 className="font-display text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-5xl rounded-3xl border border-primary/25 bg-primary/10 p-8 sm:p-12">
              <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr] lg:items-center">
                <div className="flex items-center gap-4">
                  <Workflow className="h-10 w-10 text-primary" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary">Decision rule</p>
                    <h2 className="font-display text-2xl font-bold">One role first.</h2>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  The fastest route to ROI is not automating everything. It is choosing the bottleneck closest to revenue,
                  proving that one employee works, then expanding only after the numbers justify it.
                </p>
              </div>
            </div>
          </div>
        </section>

        <CTA />
      </main>

      <Footer />
    </div>
  );
}
