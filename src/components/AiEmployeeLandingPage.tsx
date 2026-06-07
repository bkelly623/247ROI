"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Megaphone,
  MessageSquareText,
  PhoneCall,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeSetupCallSection from "@/components/HomeSetupCallSection";
import { Button } from "@/components/ui/button";
import type { AiEmployeeOffer } from "@/lib/aiEmployees";
import { PRIMARY_PHONE_HREF } from "@/app/components/cta";

const iconMap = {
  phone: PhoneCall,
  message: MessageSquareText,
  calculator: Calculator,
  fileSearch: FileSearch,
  megaphone: Megaphone,
  clipboard: ClipboardCheck,
};

const proofBySlug: Record<
  string,
  {
    metric: string;
    metricLabel: string;
    snapshot: string;
    workflow: string[];
    deliverables: string[];
    objections: string[];
    scorecard: string[];
  }
> = {
  "ai-receptionist": {
    metric: "0",
    metricLabel: "missed calls tolerated",
    snapshot: "Caller name, service need, urgency, address, preferred time, and booked-or-needs-callback status.",
    workflow: ["Customer calls after hours", "AI answers and qualifies the job", "Urgent calls route to the right person", "Summary lands in your inbox or CRM"],
    deliverables: ["Call transcript and summary", "Urgency tag", "Booking request", "Weekly recovered-call report"],
    objections: ["Uses your service area and job rules", "Hands off when a human should take over", "Can run as overflow, after-hours, or a dedicated line"],
    scorecard: ["Answered calls", "Qualified jobs", "Urgent handoffs", "Booked opportunities"],
  },
  "ai-follow-up-agent": {
    metric: "<60s",
    metricLabel: "first-touch target",
    snapshot: "New lead receives a text/email, gets qualified, is nudged to book, and keeps getting contacted until they reply or opt out.",
    workflow: ["Lead comes from form, call, ad, or old estimate", "AI sends the first touch instantly", "Prospect answers questions or books", "Human gets the clean handoff"],
    deliverables: ["SMS/email sequences", "Qualification notes", "No-show reminders", "Reactivation campaign"],
    objections: ["Includes opt-out language", "Stops when a human takes over", "Works with CRM, spreadsheet, inbox, or calendar workflows"],
    scorecard: ["Replies", "Booked appointments", "Revived estimates", "No-shows reduced"],
  },
  "ai-estimator": {
    metric: "24h",
    metricLabel: "quote-packet target",
    snapshot: "Job photos, scope notes, measurements, customer constraints, and missing details organized into one review-ready estimate packet.",
    workflow: ["Customer submits job details", "AI requests missing photos or measurements", "Scope gets organized by line item", "Estimator reviews and sends final quote"],
    deliverables: ["Scope summary", "Photo checklist", "Quote draft", "Follow-up reminders"],
    objections: ["Human approves final pricing", "Uses your templates and pricing logic", "Flags missing inputs before the estimator wastes time"],
    scorecard: ["Packets prepared", "Turnaround time", "Follow-ups sent", "Owner hours saved"],
  },
  "ai-job-bidding-agent": {
    metric: "Go/no-go",
    metricLabel: "before your team digs in",
    snapshot: "Opportunity source, deadline, location, trade fit, requirements, documents, and risks summarized before anyone burns estimating time.",
    workflow: ["Opportunity appears in email or portal", "AI extracts requirements and deadlines", "Fit score is created", "Team gets a bid checklist"],
    deliverables: ["Bid fit summary", "Requirement checklist", "Deadline reminders", "Document tracker"],
    objections: ["You keep final bid control", "Uses your margin and job-fit rules", "Designed to avoid low-quality bid volume"],
    scorecard: ["Qualified bids", "Deadlines protected", "Poor-fit jobs skipped", "Prep time reduced"],
  },
  "ai-takeoff-assistant": {
    metric: "Cleaner",
    metricLabel: "takeoff prep before review",
    snapshot: "Plans, specs, addenda, exclusions, and measurement notes organized so the estimator starts from a cleaner packet.",
    workflow: ["Plans/specs arrive", "AI organizes documents and revisions", "Requirements and misses are flagged", "Estimator reviews the prepared notes"],
    deliverables: ["Plan index", "Spec highlights", "Addenda checks", "Measurement prep notes"],
    objections: ["Human verifies final quantities", "Best for repeat plan-review workflows", "Built to reduce prep time, not remove estimator judgment"],
    scorecard: ["Packets organized", "Issues flagged", "Review time reduced", "Bid readiness"],
  },
  "ai-content-employee": {
    metric: "Daily",
    metricLabel: "sales assets from real proof",
    snapshot: "Jobs, FAQs, objections, reviews, photos, and offers turned into posts, scripts, nurture copy, and campaign angles.",
    workflow: ["Proof and offers are collected", "AI turns them into reusable assets", "Owner approves", "Content feeds outreach and follow-up"],
    deliverables: ["Social posts", "Short scripts", "Offer copy", "Review-led campaigns"],
    objections: ["Uses proof you already have", "Approval stays with your team", "Tied to offers instead of random posting"],
    scorecard: ["Assets created", "Campaigns launched", "Approval time", "Offer engagement"],
  },
};

function getProof(offer: AiEmployeeOffer) {
  return proofBySlug[offer.slug] ?? proofBySlug["ai-receptionist"];
}

export default function AiEmployeeLandingPage({ offer }: { offer: AiEmployeeOffer }) {
  const Icon = iconMap[offer.icon];
  const proof = getProof(offer);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-border/40 pb-14 pt-24 md:pb-20 md:pt-32">
          <div className="absolute inset-0 hero-gradient" />
          <div className="container relative z-10 mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
              >
                <Link
                  href="/ai-employees"
                  className="mb-6 inline-flex text-sm font-semibold text-primary underline underline-offset-4"
                >
                  AI Employees
                </Link>
                <span className="mb-5 flex w-fit rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  {offer.eyebrow}
                </span>
                <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  {offer.headline}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{offer.subheadline}</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Link href="/contact">Book AI Audit</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]"
                  >
                    <a href={PRIMARY_PHONE_HREF}>Call 247ROI</a>
                  </Button>
                </div>
                <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                  {offer.outcomes.slice(0, 3).map((outcome) => (
                    <div key={outcome} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm font-semibold leading-snug text-foreground/90">{outcome}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="glass rounded-2xl p-7"
              >
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/15">
                    <Icon className="h-7 w-7 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dedicated offer page</p>
                    <h2 className="font-display text-2xl font-bold">{offer.title}</h2>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-primary/25 bg-primary/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Primary score</p>
                    <p className="mt-2 font-display text-4xl font-bold">{proof.metric}</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/85">{proof.metricLabel}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Best for</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/85">{offer.bestFor}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Commercial model</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/85">{offer.priceHint}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Proof of work</span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                  Make the invisible labor visible before you buy.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  You should see the operational output before trusting the automation: what gets captured, what gets
                  handed off, and how performance gets measured.
                </p>
              </div>
              <div className="grid gap-4">
                <div className="glass rounded-2xl p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
                    <h3 className="font-display text-xl font-bold">Sample output</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85">{proof.snapshot}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {proof.deliverables.map((item) => (
                    <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <CheckCircle2 className="mb-3 h-5 w-5 text-primary" aria-hidden />
                      <p className="text-sm font-medium text-foreground/90">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Pain points</span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                  Fix the work that keeps slipping.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Each AI employee is built around a specific leak in your operation, then tuned to your tools,
                  workflow, and real customer handoffs.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {offer.painPoints.map((pain) => (
                  <div key={pain} className="glass rounded-2xl p-5">
                    <p className="text-sm leading-relaxed text-foreground/85">{pain}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Workflow example</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                A concrete path from trigger to handoff
              </h2>
            </div>
            <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-4">
              {proof.workflow.map((item, index) => (
                <div key={item} className="glass rounded-2xl p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">What it handles</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                The actual work this employee does
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {offer.handles.map((item) => (
                <div key={item} className="glass rounded-2xl p-5">
                  <CheckCircle2 className="mb-4 h-5 w-5 text-primary" aria-hidden />
                  <p className="text-sm font-medium text-foreground/90">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
              {offer.steps.map((step, index) => (
                <div key={step.title} className="glass rounded-2xl p-8">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <h3 className="mb-3 font-display text-xl font-bold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="glass rounded-2xl p-8">
                <div className="mb-5 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
                  <h2 className="font-display text-2xl font-bold">Control and trust</h2>
                </div>
                <ul className="space-y-3">
                  {proof.objections.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass rounded-2xl p-8">
                <div className="mb-5 flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-primary" aria-hidden />
                  <h2 className="font-display text-2xl font-bold">Weekly scorecard</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {proof.scorecard.map((item) => (
                    <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm font-medium text-foreground/90">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
              <div className="glass rounded-2xl p-8">
                <div className="mb-5 flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary" aria-hidden />
                  <h2 className="font-display text-2xl font-bold">Good fit</h2>
                </div>
                <ul className="space-y-3">
                  {offer.goodFit.map((item) => (
                    <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                      - {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass rounded-2xl p-8">
                <div className="mb-5 flex items-center gap-3">
                  <Ban className="h-5 w-5 text-muted-foreground" aria-hidden />
                  <h2 className="font-display text-2xl font-bold">Not a fit</h2>
                </div>
                <ul className="space-y-3">
                  {offer.notFit.map((item) => (
                    <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                      - {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-16">
          <div className="container mx-auto px-6">
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 rounded-2xl border border-primary/25 bg-primary/10 p-7 text-center sm:flex-row sm:text-left">
              <div>
                <h2 className="font-display text-2xl font-bold">Want this role built for your business?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Book a short audit and we will map the role, the handoffs, and the scorecard before anything goes live.
                </p>
              </div>
              <Link href="/contact" className="inline-flex shrink-0 items-center gap-2 font-semibold text-primary underline underline-offset-4">
                Book AI Audit <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <HomeSetupCallSection />
      </main>
      <Footer />
    </div>
  );
}
