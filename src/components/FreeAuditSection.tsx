"use client";

import { motion } from "framer-motion";
import { Calculator, TrendingUp } from "lucide-react";
import MissedCallCalculator from "@/app/components/MissedCallCalculator";

export default function FreeAuditSection() {
  return (
    <section
      id="free-audit"
      className="relative pt-12 pb-20 md:pt-16 md:pb-24 overflow-hidden scroll-mt-28 border-y border-border/60 bg-gradient-to-b from-background via-card/20 to-background"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-[10%] w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-[8%] w-64 h-64 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-5">
              <Calculator className="w-4 h-4 text-primary" aria-hidden />
              <span className="text-sm text-muted-foreground">Free audit · 60 seconds</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold leading-tight mb-4">
              See what missed calls are{" "}
              <span className="gradient-text">costing you</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto lg:mx-0 mb-6 leading-relaxed">
              Drag a few sliders. We&apos;ll estimate the revenue walking out the door while the phone rings — no
              signup, no fluff. When you&apos;re ready, we help you{" "}
              <span className="text-foreground/90 font-medium">capture every lead</span> with AI that answers 24/7.
            </p>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/30 px-3 py-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
                Industry presets
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/30 px-3 py-1.5">
                Real math, not vibes
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="relative"
          >
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/25 via-transparent to-secondary/20 blur-xl opacity-80 pointer-events-none" />
            <div className="relative rounded-3xl border border-white/10 glass-strong glow p-6 sm:p-8 shadow-[var(--shadow-card)]">
              <MissedCallCalculator showHeading={false} enableIdleDemo />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
