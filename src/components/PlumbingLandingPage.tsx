"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Droplets,
  Flame,
  PhoneCall,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MissedCallCalculator from "@/app/components/MissedCallCalculator";
import { Button } from "@/components/ui/button";
import { AI_RECEPTIONIST_CTA_PHONE_HREF, BOOK_SETUP_CALL_LINK_CLASSNAME } from "@/app/components/cta";

const applyHref = "/#book-call";
const plumbingDemoHref = AI_RECEPTIONIST_CTA_PHONE_HREF;

const problemCards = [
  {
    icon: Clock3,
    title: "After-hours calls get missed",
    copy: "Emergency jobs often come in when the office is closed — nights, weekends, and early mornings.",
  },
  {
    icon: Wrench,
    title: "Techs are busy on jobs",
    copy: "Owners and dispatchers cannot always stop mid-job, drive, or estimate to answer every call.",
  },
  {
    icon: TrendingUp,
    title: "Slow follow-up loses high-intent leads",
    copy: "Plumbing customers usually choose the first qualified company that responds and sounds reliable.",
  },
];

const handles = [
  "Emergency leak calls",
  "Clogged drains",
  "Water heater issues",
  "Service area questions",
  "New customer intake",
  "Job qualification",
  "Appointment or estimate requests",
  "Urgent call escalation",
  "SMS follow-up",
  "Lead summaries to the owner/team",
];

const offerBullets = [
  "Custom AI receptionist setup",
  "Plumbing-specific call flow",
  "24/7 call answering",
  "Lead capture and qualification",
  "Follow-up workflow",
  "Result tracking",
  "No upfront setup cost",
];

const steps = [
  {
    title: "Quick setup call",
    copy: "We learn your service area, hours, services, booking process, and escalation rules.",
  },
  {
    title: "We build and test your AI receptionist",
    copy: "We customize the call flow around real plumbing calls and test it before launch.",
  },
  {
    title: "It runs for 30 days",
    copy: "It answers, qualifies, follows up, escalates urgent calls, and tracks activity.",
  },
  {
    title: "You decide whether to continue",
    copy: "If it creates value, continue monthly. If not, no pressure and no long-term contract.",
  },
];

const faq = [
  {
    question: "Is this free forever?",
    answer:
      "No. This is a 30-day case study. We waive the upfront setup cost so you can see the system work before deciding whether to continue.",
  },
  {
    question: "What happens after 30 days?",
    answer:
      "If the system creates value, you can continue on a monthly plan. If not, there is no pressure to continue.",
  },
  {
    question: "Will it replace my staff?",
    answer:
      "No. It covers the gaps: missed calls, after-hours inquiries, overflow, urgent routing, and fast follow-up.",
  },
  {
    question: "Can urgent calls reach me?",
    answer: "Yes. We can set emergency escalation rules so urgent calls get routed to the right person quickly.",
  },
  {
    question: "What do you need from us?",
    answer:
      "A short onboarding call, basic service details, service area, business hours, preferred booking process, and approval of the call flow.",
  },
];

function SectionIntro({ badge, title, copy }: { badge?: string; title: string; copy?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="mx-auto mb-10 max-w-3xl text-center"
    >
      {badge ? (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
          {badge}
        </div>
      ) : null}
      <h2 className="text-3xl font-display font-bold leading-tight sm:text-4xl lg:text-5xl">{title}</h2>
      {copy ? <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{copy}</p> : null}
    </motion.div>
  );
}

function PrimaryCtas({ center = false }: { center?: boolean }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${center ? "justify-center" : "justify-start"}`}>
      <Button
        asChild
        size="lg"
        className="min-h-[3.65rem] rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-[0_0_42px_hsl(174_72%_56%/0.32)] hover:bg-primary/90 hover:shadow-[0_0_60px_hsl(174_72%_56%/0.42)] sm:px-9"
      >
        <Link href={applyHref}>Apply for the 30-Day Case Study</Link>
      </Button>
      <Button
        asChild
        size="lg"
        variant="outline"
        className="min-h-[3.65rem] rounded-full border-white/15 bg-white/[0.03] px-7 text-base font-semibold text-foreground hover:bg-white/[0.08] sm:px-9"
      >
        <a href={plumbingDemoHref}>Call the Plumbing Demo</a>
      </Button>
    </div>
  );
}

export default function PlumbingLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="overflow-hidden">
        <section className="relative flex min-h-screen items-center pt-28 md:pt-32">
          <div className="absolute inset-0 hero-gradient" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-[8%] top-[18%] h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute bottom-[12%] right-[7%] h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />
            <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/5 blur-3xl" />
          </div>

          <div className="container relative z-10 mx-auto px-6 py-14 lg:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-[1.03fr_0.97fr] lg:gap-14">
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left"
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-2">
                  <Droplets className="h-4 w-4 text-primary" aria-hidden />
                  <span className="text-sm text-muted-foreground">3 Plumbing Companies Wanted</span>
                </div>

                <h1 className="mb-6 text-4xl font-display font-bold leading-[1.05] sm:text-5xl lg:text-6xl xl:text-7xl">
                  Plumbing Companies: Stop Losing <span className="gradient-text">Emergency Jobs</span> to Missed Calls
                </h1>

                <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl lg:mx-0">
                  We&rsquo;re selecting 3 plumbing companies for a 30-day AI receptionist case study. We&rsquo;ll set it up
                  with no upfront cost, answer and qualify calls 24/7, and track how many opportunities it helps
                  recover.
                </p>

                <PrimaryCtas />

                <p className="mt-5 text-sm font-medium text-muted-foreground">
                  No upfront setup cost. No long-term contract. Continue only if it creates value.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.1 }}
                className="relative mx-auto w-full max-w-xl"
              >
                <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-primary/35 via-transparent to-secondary/35 blur-xl" />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-card/95 via-card/80 to-background/95 p-6 shadow-[var(--shadow-card)] sm:p-8">
                  <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
                  <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-secondary/15 blur-3xl" />
                  <div className="relative">
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.22em] text-primary">Case study offer</p>
                        <h2 className="mt-2 text-2xl font-display font-bold">30 Days Live in Your Business</h2>
                      </div>
                      <div className="rounded-2xl border border-primary/25 bg-primary/10 p-3 text-primary">
                        <PhoneCall className="h-6 w-6" aria-hidden />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        ["24/7", "answering"],
                        ["0", "setup cost"],
                        ["3", "spots open"],
                      ].map(([stat, label]) => (
                        <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-2xl font-display font-bold gradient-text">{stat}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 space-y-3">
                      {[
                        "Answer emergency and after-hours calls",
                        "Qualify jobs before they hit your phone",
                        "Escalate urgent calls and summarize leads",
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-muted/25 p-4">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                          <p className="text-sm text-foreground/90">{item}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-7 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100/90">
                      <strong className="text-amber-100">Built for owner-operators:</strong> cover missed calls without
                      hiring another full-time receptionist before you know the ROI.
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative border-y border-border/60 bg-gradient-to-b from-background via-card/20 to-background py-20 md:py-24">
          <div className="container mx-auto px-6">
            <SectionIntro
              badge="The revenue leak"
              title="Every Missed Call Could Be a Lost Job"
              copy="Plumbing customers usually call when they need help now — leaks, clogged drains, broken water heaters, emergencies, and same-day service. If nobody answers, they call the next company."
            />

            <div className="grid gap-5 md:grid-cols-3">
              {problemCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                    className="group rounded-3xl border border-white/10 bg-card/70 p-6 shadow-[var(--shadow-card)] transition-colors hover:border-primary/35"
                  >
                    <div className="mb-5 inline-flex rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <h3 className="mb-3 text-xl font-display font-semibold">{card.title}</h3>
                    <p className="leading-relaxed text-muted-foreground">{card.copy}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative py-20 md:py-24">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute right-[5%] top-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          </div>
          <div className="container relative z-10 mx-auto px-6">
            <SectionIntro
              badge="Call coverage"
              title="Built for Real Plumbing Calls"
              copy="The AI receptionist is customized to the calls your plumbing company actually receives — not a generic chatbot bolted onto your site."
            />

            <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {handles.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.35, delay: index * 0.035 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-medium text-foreground/90"
                >
                  <CheckCircle2 className="mb-3 h-4 w-4 text-primary" aria-hidden />
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary/15 via-card/90 to-secondary/15 p-6 shadow-[var(--shadow-card)] sm:p-8 lg:p-12">
              <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
              <div className="relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                <motion.div
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm text-primary">
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                    30-Day Missed-Call Recovery Case Study
                  </div>
                  <h2 className="mb-5 text-3xl font-display font-bold leading-tight sm:text-4xl lg:text-5xl">
                    See if an AI receptionist can recover real plumbing opportunities before you commit.
                  </h2>
                  <p className="mb-7 text-lg leading-relaxed text-muted-foreground">
                    We&rsquo;ll install a custom AI receptionist for your plumbing business, run it live for 30 days, and
                    track the calls, leads, and opportunities it helps capture.
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="min-h-[3.65rem] rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-[0_0_42px_hsl(174_72%_56%/0.32)] hover:bg-primary/90"
                  >
                    <Link href={applyHref}>Apply for the Case Study</Link>
                  </Button>
                </motion.div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {offerBullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-background/45 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                      <span className="text-sm font-medium text-foreground/90">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-y border-border/60 bg-card/20 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <SectionIntro badge="Simple rollout" title="How It Works" copy="A practical 30-day test, built around your actual service area, workflow, and escalation rules." />

            <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="relative rounded-3xl border border-white/10 bg-background/70 p-6"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-display font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <h3 className="mb-3 text-xl font-display font-semibold">{step.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{step.copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="estimate-missed-calls" className="relative py-20 md:py-24 scroll-mt-28">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-[10%] top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-1/4 right-[8%] h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
          </div>
          <div className="container relative z-10 mx-auto px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55 }}
                className="text-center lg:text-left"
              >
                <div className="mb-5 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-primary" aria-hidden />
                  Missed-call calculator
                </div>
                <h2 className="mb-4 text-3xl font-display font-bold leading-tight sm:text-4xl lg:text-5xl">
                  Want to Estimate What Missed Calls Cost You?
                </h2>
                <p className="mx-auto mb-7 max-w-lg text-lg leading-relaxed text-muted-foreground lg:mx-0">
                  Run the numbers in under a minute. Then apply for the case study if the math says your phones are
                  leaking revenue.
                </p>
                <Link href={applyHref} className={BOOK_SETUP_CALL_LINK_CLASSNAME}>
                  Apply after the calculator <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="relative"
              >
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/25 via-transparent to-secondary/20 blur-xl opacity-80" />
                <div className="relative rounded-3xl border border-white/10 glass-strong glow p-6 shadow-[var(--shadow-card)] sm:p-8">
                  <MissedCallCalculator showHeading={false} enableIdleDemo />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative border-y border-border/60 bg-gradient-to-b from-card/20 to-background py-20 md:py-24">
          <div className="container mx-auto px-6">
            <SectionIntro
              badge="Common questions"
              title="Questions Plumbing Owners Ask Before the Case Study"
              copy="Clear terms, practical setup, and no pressure to keep something that does not create value."
            />

            <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
              {faq.map((item) => (
                <div key={item.question} className="rounded-3xl border border-white/10 bg-background/70 p-6">
                  <h3 className="mb-3 text-lg font-display font-semibold">{item.question}</h3>
                  <p className="leading-relaxed text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="apply" className="relative py-20 md:py-24 scroll-mt-28">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary/20 via-card/90 to-secondary/20 p-8 text-center shadow-[var(--shadow-card)] sm:p-12"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(174_72%_56%/0.18),transparent_55%)]" />
              <div className="relative">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <CalendarCheck className="h-7 w-7" aria-hidden />
                </div>
                <h2 className="mx-auto mb-5 max-w-3xl text-3xl font-display font-bold leading-tight sm:text-4xl lg:text-5xl">
                  Apply for one of the 3 plumbing case study spots.
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  If your company is a fit, we&rsquo;ll map your call flow, build the AI receptionist, and run the
                  30-day missed-call recovery test with no upfront setup cost.
                </p>
                <PrimaryCtas center />
                <div className="mt-7 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                  {[
                    "No upfront setup cost",
                    "Plumbing-specific setup",
                    "30-day result tracking",
                  ].map((item) => (
                    <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                      <Flame className="h-3.5 w-3.5 text-primary" aria-hidden />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
