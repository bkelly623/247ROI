"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Mail,
  MessageSquareText,
  Phone,
  PhoneCall,
  ShieldCheck,
  TimerReset,
  Workflow,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeSetupCallSection from "@/components/HomeSetupCallSection";
import { Button } from "@/components/ui/button";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";

const aiEmployeeRoles = [
  {
    title: "AI Receptionist",
    route: "/ai-employees/ai-receptionist",
    icon: PhoneCall,
    body: "Answers overflow and after-hours calls, captures job details, tags urgency, and routes the next step.",
  },
  {
    title: "AI Follow-Up Agent",
    route: "/ai-employees/ai-follow-up-agent",
    icon: MessageSquareText,
    body: "Replies quickly, revives old estimates, confirms appointments, and keeps warm leads from going cold.",
  },
  {
    title: "AI Estimator Assistant",
    route: "/ai-employees/ai-estimator",
    icon: ClipboardCheck,
    body: "Collects photos, scope notes, missing details, and quote packets so a human can approve faster.",
  },
  {
    title: "AI Bid Assistant",
    route: "/ai-employees/ai-job-bidding-agent",
    icon: FileSearch,
    body: "Reviews opportunities, extracts requirements, tracks deadlines, and prepares cleaner bid checklists.",
  },
];

const proofPoints = [
  ["70-80%", "of repetitive workflow targeted for AI assistance"],
  ["90%", "time savings target on well-scoped admin and prep work"],
  ["30 days", "to test one role before expanding the system"],
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-border/40 pb-16 pt-32 md:pb-20 md:pt-40">
          <div className="absolute inset-0 hero-gradient" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(174_72%_56%/0.16),transparent_45%),radial-gradient(ellipse_at_bottom_right,hsl(38_90%_55%/0.1),transparent_45%)]" />
          <div className="container relative z-10 mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
              >
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <Workflow className="h-4 w-4" aria-hidden />
                  AI employees for SMB operations
                </span>
                <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  Put an AI employee inside the workflow that is costing you money.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  247ROI builds managed AI employees for small and medium-sized businesses: lead response,
                  follow-up, estimating support, bid prep, inbox/SMS handling, and operational coordination.
                  Start with one role, prove the ROI, then expand.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <a href={PRIMARY_PHONE_HREF}>
                      <Phone className="mr-2 h-4 w-4" aria-hidden />
                      Call {PRIMARY_PHONE_DISPLAY}
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]"
                  >
                    <a href="mailto:contact@247roi.com?subject=AI%20employee%20workflow%20map">
                      <Mail className="mr-2 h-4 w-4" aria-hidden />
                      Email workflow map
                    </a>
                  </Button>
                </div>
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  AI-assisted, not fake autonomy. Humans keep approval on pricing, bids, exceptions, and sensitive decisions.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.65)]"
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary">First workflow map</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">What we look for</h2>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" aria-hidden />
                </div>
                <div className="space-y-3">
                  {[
                    "Repetitive work that slows revenue or customer response",
                    "Clear human approval points for quotes, bids, and exceptions",
                    "A measurable scorecard: hours saved, leads captured, quotes prepared, or follow-ups completed",
                    "Enough volume to make the first AI employee worth maintaining",
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-background/40 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                      <p className="text-sm leading-relaxed text-foreground/85">{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-16 md:py-20">
          <div className="container mx-auto px-6">
            <div className="grid gap-4 md:grid-cols-3">
              {proofPoints.map(([metric, label]) => (
                <div key={metric} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="font-display text-4xl font-bold text-primary">{metric}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                We do not sell generic automation. We install one job role.
              </h2>
              <p className="mt-4 text-muted-foreground">
                The first AI employee should be boringly useful: clear inputs, clear output, clear handoff, and a scorecard.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-4">
              {[
                ["1", "Find the bottleneck", "Missed calls, slow lead response, estimate prep, inbox routing, bid review, or stale follow-up."],
                ["2", "Map the workflow", "Tools, scripts, rules, edge cases, approval points, and what the human receives."],
                ["3", "Launch the assistant", "The AI handles the repeatable 70-80% and routes the rest to the right person."],
                ["4", "Measure the scorecard", "Track hours saved, response speed, captured leads, prepared packets, and revenue opportunities."],
              ].map(([number, title, body]) => (
                <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                    {number}
                  </div>
                  <h3 className="font-display text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">AI employee roles</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                Start with the role closest to revenue.
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {aiEmployeeRoles.map((role) => {
                const Icon = role.icon;
                return (
                  <Link
                    key={role.title}
                    href={role.route}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-transform hover:-translate-y-1"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/15">
                      <Icon className="h-6 w-6 text-primary" aria-hidden />
                    </div>
                    <h3 className="flex items-center gap-2 font-display text-xl font-bold">
                      {role.title}
                      <ArrowRight className="h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{role.body}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Credibility</span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                  The AI receptionist is still valid. It is just one employee, not the whole company.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Missed-call capture remains a strong wedge for trades and local service businesses. The homepage now
                  positions 247ROI around the broader offer: managed AI employees that remove specific operational bottlenecks.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  [PhoneCall, "Lead capture", "Overflow, after-hours, and urgent handoff workflows."],
                  [MessageSquareText, "Follow-up", "SMS/email follow-up for new leads, old estimates, and no-shows."],
                  [TimerReset, "Workflow speed", "Faster prep before a human reviews, prices, or approves."],
                  [ShieldCheck, "Human control", "Clear approval boundaries for pricing, bidding, and exceptions."],
                ].map(([Icon, title, body]) => {
                  const CardIcon = Icon as typeof PhoneCall;
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

        <HomeSetupCallSection />
      </main>
      <Footer />
    </div>
  );
}
