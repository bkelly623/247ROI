"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ClipboardCheck,
  FileSearch,
  MessageSquareText,
  PhoneCall,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const examples = [
  {
    icon: MessageSquareText,
    title: "Lead response employee",
    trigger: "A roofing lead comes in from a form at 9:47 PM.",
    output: "The AI sends the first reply, asks qualifying questions, offers inspection windows, tags urgency, and sends the team a clean handoff.",
    scorecard: ["First touch time", "Replies", "Booked inspections", "Revived estimates"],
  },
  {
    icon: ClipboardCheck,
    title: "Estimator assistant",
    trigger: "A contractor receives a job request with scattered photos and missing scope details.",
    output: "The AI requests missing inputs, organizes photos, drafts scope notes, and prepares a review packet before pricing.",
    scorecard: ["Packets prepared", "Missing inputs found", "Quote turnaround", "Owner hours saved"],
  },
  {
    icon: FileSearch,
    title: "Bid assistant",
    trigger: "Bid invites arrive across email, portals, and shared folders.",
    output: "The AI extracts deadlines, requirements, location, trade fit, risks, and a go/no-go checklist for the team.",
    scorecard: ["Qualified bids", "Deadlines protected", "Poor-fit jobs skipped", "Prep time reduced"],
  },
  {
    icon: PhoneCall,
    title: "AI receptionist",
    trigger: "A service call hits after-hours or during a dispatch rush.",
    output: "The AI answers, captures job details, checks urgency, summarizes the call, and routes the next step.",
    scorecard: ["Answered calls", "Qualified jobs", "Urgent handoffs", "Booked opportunities"],
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
                See what an AI employee actually produces.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                The value is not a chat bubble. It is the handoff: the prepared estimate packet, the revived lead,
                the bid checklist, the urgent call summary, and the weekly scorecard.
              </p>
              <div className="mt-8 flex justify-center">
                <Button asChild size="lg" className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href="/contact">Book AI Audit</Link>
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
                      {item.scorecard.map((metric) => (
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

        <section className="py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-5xl rounded-3xl border border-primary/25 bg-primary/10 p-8 sm:p-12">
              <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">What happens next</p>
                  <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Pick one workflow. Build one employee. Measure it brutally.</h2>
                  <p className="mt-4 text-muted-foreground">
                    The first build should be narrow enough to launch quickly and valuable enough to keep.
                  </p>
                </div>
                <div className="space-y-3">
                  {["Inputs defined", "Human approvals clear", "Weekly scorecard live"].map((text) => (
                    <div key={text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/35 p-4 text-sm font-semibold">
                      <TimerReset className="h-4 w-4 text-primary" aria-hidden />
                      {text}
                    </div>
                  ))}
                  <Link href="/contact" className="inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4">
                    Book AI Audit <ArrowRight className="h-4 w-4" aria-hidden />
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
