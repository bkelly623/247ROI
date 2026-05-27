"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import MissedCallCalculator from "@/app/components/MissedCallCalculator";

export default function RevenueLossProof() {
  return (
    <section className="py-24 relative overflow-hidden border-t border-border/40">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/10 to-transparent pointer-events-none" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left"
          >
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Proof</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4 mb-5">
              Do the math on <span className="gradient-text">missed calls</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-7 max-w-xl mx-auto lg:mx-0">
              A handful of missed calls per day turns into real revenue loss fast. Use the calculator to estimate what
              it’s costing you — then try the live demo line to hear how we capture those jobs.
            </p>
            <Link
              href="/missed-call-calculator"
              className="inline-flex items-center justify-center h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 text-sm font-semibold"
            >
              Open the calculator
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="rounded-3xl overflow-hidden border border-white/[0.08] bg-background/40 px-4 py-7 sm:px-6 sm:py-9"
          >
            <MissedCallCalculator showHeading={false} enableIdleDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

