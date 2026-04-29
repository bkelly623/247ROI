"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Droplets, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

const bullets = [
  "30-day missed-call recovery case study",
  "No upfront setup cost for selected companies",
  "Built for emergency calls, estimates, follow-up, and escalation",
];

export default function CurrentCampaignSection() {
  return (
    <section className="relative overflow-hidden border-t border-border/40 py-16 md:py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-card/15 to-transparent" />
      <div className="container relative z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto grid max-w-6xl items-center gap-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary/12 via-card/80 to-secondary/12 p-6 shadow-[var(--shadow-card)] sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10"
        >
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm text-primary">
              <Droplets className="h-4 w-4" aria-hidden />
              Current campaign
            </div>
            <h2 className="mb-4 text-3xl font-display font-bold leading-tight sm:text-4xl">
              Plumbing companies: stop losing emergency jobs to missed calls.
            </h2>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              We&rsquo;re selecting 3 plumbing companies for a focused case study. It&rsquo;s a concrete example of how
              247ROI installs AI employees around a real revenue leak — without making the homepage only about one
              industry.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-background/55 p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl border border-primary/25 bg-primary/10 p-3 text-primary">
                <PhoneCall className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-display text-xl font-semibold">30-day plumbing AI receptionist test</p>
                <p className="text-sm text-muted-foreground">Built to recover missed calls and high-intent leads.</p>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              {bullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-3 text-sm text-foreground/90">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>

            <Button
              asChild
              size="lg"
              className="w-full rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-[0_0_32px_hsl(174_72%_56%/0.24)] hover:bg-primary/90 sm:w-auto"
            >
              <Link href="/plumbing-ai-receptionist">
                View the Plumbing Case Study <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
