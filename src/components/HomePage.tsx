"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  FileSearch,
  Gauge,
  Mail,
  MessageSquareText,
  Phone,
  PhoneCall,
  Radar,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Workflow,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";

const roles = [
  {
    title: "Lead Response Agent",
    href: "/ai-follow-up-agent",
    icon: MessageSquareText,
    pain: "New leads, old estimates, no-shows, and stale opportunities stop rotting in the CRM.",
  },
  {
    title: "Estimator Assistant",
    href: "/ai-estimator",
    icon: ClipboardCheck,
    pain: "Photos, scope notes, missing details, and quote packets get organized before a human prices.",
  },
  {
    title: "Bid Assistant",
    href: "/contractor-bid-assistant",
    icon: FileSearch,
    pain: "Bid invites, requirements, addenda, deadlines, and go/no-go checks become a clean daily queue.",
  },
  {
    title: "AI Receptionist",
    href: "/ai-employees/ai-receptionist",
    icon: PhoneCall,
    pain: "Overflow and after-hours calls get captured, qualified, summarized, and routed.",
  },
];

const proofCards = [
  ["70-80%", "of the repeatable work targeted before human approval"],
  ["<60 sec", "target first-touch speed when leads hit after hours"],
  ["30 days", "to prove the role deserves to stay on payroll"],
];

const pressureCards = [
  {
    title: "The lead is warm for about five minutes.",
    body: "After that, you are not following up. You are apologizing for being late.",
  },
  {
    title: "The estimate is not stuck because nobody cares.",
    body: "It is stuck because photos, scope notes, missing details, and review steps are scattered.",
  },
  {
    title: "The bid invite is not the work.",
    body: "The work is extracting deadlines, requirements, red flags, documents, and a sane go/no-go answer.",
  },
];

const artifacts = [
  {
    label: "Lead rescue",
    title: "9:47 PM roofing lead",
    output: "Replied in 42 seconds, qualified roof age and leak location, offered two inspection windows, routed urgent summary to owner.",
    metric: "First touch protected",
  },
  {
    label: "Estimator prep",
    title: "Quote packet ready",
    output: "Collected missing photos, grouped scope notes, flagged unclear measurements, drafted review-ready estimate summary.",
    metric: "Owner review faster",
  },
  {
    label: "Bid discipline",
    title: "Commercial invite triaged",
    output: "Pulled deadline, trade fit, documents required, red flags, location, and go/no-go checklist from scattered files.",
    metric: "Bad-fit work filtered",
  },
];

const auditChecks = [
  "Where revenue leaks before a human responds",
  "Which tasks repeat enough to automate safely",
  "What the AI can prepare versus what a human must approve",
  "What numbers prove the employee is worth keeping",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative min-h-[92vh] overflow-hidden border-b border-border/40 pt-32 md:pt-40">
          <div className="absolute inset-0 hero-gradient" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_20%,hsl(174_72%_56%/0.22),transparent_38%),radial-gradient(ellipse_at_85%_15%,hsl(38_90%_55%/0.16),transparent_34%),linear-gradient(180deg,transparent,rgba(0,0,0,0.22))]" />

          <div className="container relative z-10 mx-auto px-6 pb-16">
            <div className="grid gap-10 lg:grid-cols-[1.03fr_0.97fr] lg:items-center">
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  AI employees for the work nobody owns
                </span>
                <h1 className="max-w-4xl font-display text-5xl font-bold leading-[0.98] sm:text-6xl lg:text-7xl">
                  Your next employee does not need a chair. It needs a job description.
                </h1>
                <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  247ROI builds managed AI employees for the work your team keeps meaning to do faster: lead response,
                  estimating prep, bid intake, inbox/SMS triage, and operational handoffs. Not software you remember to
                  check. Not chatbot cosplay. A defined role, a weekly scorecard, and human approval where judgment matters.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="min-h-[3.5rem] rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                    <Link href="/contact">
                      Find My First AI Employee <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="min-h-[3.5rem] rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]">
                    <a href={PRIMARY_PHONE_HREF}>
                      <Phone className="mr-2 h-4 w-4" aria-hidden />
                      {PRIMARY_PHONE_DISPLAY}
                    </a>
                  </Button>
                </div>
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Built for service businesses that need speed, discipline, and follow-through before they are ready to add another full-time seat.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }}>
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.8)]">
                  <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
                  <div className="relative">
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-primary">AI employee audit</p>
                        <h2 className="mt-2 font-display text-2xl font-bold">Find the first role worth hiring.</h2>
                      </div>
                      <Radar className="h-9 w-9 text-primary" aria-hidden />
                    </div>
                    <div className="space-y-3">
                      {auditChecks.map((item) => (
                        <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-background/45 p-4">
                          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                          <p className="text-sm leading-relaxed text-foreground/90">{item}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/10 p-4">
                      <p className="text-sm font-semibold text-primary">Output</p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                        A recommended first AI employee, the handoff rules, expected weekly scorecard, and whether the role is worth hiring.
                      </p>
                    </div>
                    <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-background/40">
                      <Image
                        src="/images/dashboard-preview.png"
                        alt="Example AI employee scorecard dashboard"
                        width={1200}
                        height={800}
                        className="h-auto w-full"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-14">
          <div className="container mx-auto px-6">
            <div className="grid gap-4 md:grid-cols-3">
              {proofCards.map(([metric, label]) => (
                <div key={metric} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="font-display text-4xl font-bold text-primary">{metric}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mb-10 max-w-3xl">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Why this pays</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">The expensive work is hiding in the gaps.</h2>
              <p className="mt-4 text-muted-foreground">
                Most businesses do not need a giant AI transformation. They need one narrow employee that attacks a leak
                everyone already knows exists.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {pressureCards.map((card) => (
                <div key={card.title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                  <h3 className="font-display text-xl font-bold leading-snug">{card.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Operating model</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">A useful AI employee is not a vague assistant.</h2>
              <p className="mt-4 text-muted-foreground">
                It is a specific role with inputs, rules, exceptions, outputs, and a scorecard. If the job cannot be
                described, it should not be automated yet.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-4">
              {[
                ["1", "Diagnose the leak", "We pick the workflow where speed, follow-up, or prep work is already costing money."],
                ["2", "Write the job spec", "Inputs, scripts, tools, approval rules, edge cases, and human handoffs get defined up front."],
                ["3", "Run the employee", "The AI handles repeatable work and escalates the sensitive decisions to a human."],
                ["4", "Keep or kill", "If the weekly scorecard does not justify the role, we do not pretend it is working."],
              ].map(([number, title, body]) => (
                <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">{number}</div>
                  <h3 className="font-display text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
              <div className="mb-12 max-w-3xl">
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">First hires</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Start with the employee that pays for itself fastest.</h2>
              <p className="mt-4 text-muted-foreground">
                The first AI employee should be painfully obvious after a short audit. These are the roles most likely to
                create visible ROI before you expand.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <Link key={role.title} href={role.href} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-transform hover:-translate-y-1">
                    <Icon className="mb-5 h-7 w-7 text-primary" aria-hidden />
                    <h3 className="flex items-center gap-2 font-display text-xl font-bold">
                      {role.title}
                      <ArrowRight className="h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{role.pain}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">What buyers see</span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                  Not AI theater. Work product.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  A useful AI employee leaves evidence behind: replies, summaries, packets, queues, scorecards, and clean
                  human handoffs. That is what gets measured.
                </p>
              </div>
              <div className="grid gap-4">
                {artifacts.map((item) => (
                  <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{item.label}</p>
                        <h3 className="mt-2 font-display text-xl font-bold">{item.title}</h3>
                      </div>
                      <span className="w-fit rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {item.metric}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.output}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Trust rules</span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Bold automation. Adult supervision.</h2>
                <p className="mt-4 text-muted-foreground">
                  The fastest way to lose trust is pretending AI should make every decision. 247ROI is built around clear control points.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  [ShieldCheck, "Human approval", "Pricing, final bids, exceptions, and sensitive replies stay under human control."],
                  [Workflow, "Operational handoffs", "Every employee produces a clean next step: summary, packet, checklist, route, or reply."],
                  [Gauge, "Scorecard first", "The role is judged by speed, saved hours, captured leads, prepared packets, or deadlines protected."],
                  [TimerReset, "Fast launch", "Start with one constrained role instead of trying to automate the whole business at once."],
                ].map(([Icon, title, body]) => {
                  const CardIcon = Icon as typeof ShieldCheck;
                  return (
                    <div key={title as string} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                      <CardIcon className="mb-4 h-6 w-6 text-primary" aria-hidden />
                      <h3 className="font-display text-lg font-bold">{title as string}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body as string}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-5xl rounded-3xl border border-primary/25 bg-primary/10 p-8 text-center sm:p-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Next step</p>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-5xl">Find the first AI employee worth hiring.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Bring the messy workflow. We will tell you the first role worth building, the scorecard, and what should stay human.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href="/audit">Start the Audit</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]">
                  <a href="mailto:contact@247roi.com">
                    <Mail className="mr-2 h-4 w-4" aria-hidden />
                    contact@247roi.com
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
