"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function DemoPreview() {
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
          >
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Substance</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4 mb-5">
              Not vibes. <span className="gradient-text">Operations.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              The demo is the fastest way to understand it. Call the line, then look at what the business owner sees: simple KPIs tied to booked work.
            </p>
            <a
              href="/demo"
              className="inline-flex items-center justify-center h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 text-sm font-semibold"
            >
              See the demo
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="rounded-3xl overflow-hidden border border-white/[0.08] bg-background/40"
          >
            <Image src="/demo/kpi-demo.png" alt="KPI preview" width={1536} height={1024} className="w-full h-auto" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
