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
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeSetupCallSection from "@/components/HomeSetupCallSection";
import { Button } from "@/components/ui/button";
import type { AiEmployeeOffer } from "@/lib/aiEmployees";
import { AI_RECEPTIONIST_CTA_PHONE_HREF } from "@/app/components/cta";

const iconMap = {
  phone: PhoneCall,
  message: MessageSquareText,
  calculator: Calculator,
  fileSearch: FileSearch,
  megaphone: Megaphone,
  clipboard: ClipboardCheck,
};

export default function AiEmployeeLandingPage({ offer }: { offer: AiEmployeeOffer }) {
  const Icon = iconMap[offer.icon];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-border/40 pb-14 pt-32 md:pb-20 md:pt-40">
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
                    <a href={AI_RECEPTIONIST_CTA_PHONE_HREF}>Call the Demo Line</a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]"
                  >
                    <Link href="/#book-call">Book a 10-Minute Setup Call</Link>
                  </Button>
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
                  Book a short setup call and we will map the workflow, the handoffs, and the scorecard before anything goes live.
                </p>
              </div>
              <Link href="/#book-call" className="inline-flex shrink-0 items-center gap-2 font-semibold text-primary underline underline-offset-4">
                Book setup call <ArrowRight className="h-4 w-4" aria-hidden />
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
