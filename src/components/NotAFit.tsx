"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Ban } from "lucide-react";

const goodFit = [
  "Trades business with steady inbound calls (and missed calls after-hours / during busy times)",
  "You have capacity to take the booked jobs",
  "You want fewer dropped leads, faster response, and a simple weekly scorecard",
];

const notFit = [
  "You have near-zero inbound demand (this won’t create calls out of thin air)",
  "You want a ‘get rich overnight’ promise or guaranteed revenue",
  "You can’t answer/route jobs once they’re booked",
];

export default function NotAFit() {
  return (
    <section className="py-24 relative overflow-hidden border-t border-border/40">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/10 via-transparent to-muted/10 pointer-events-none" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center mb-12"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Qualification</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4 mb-5">
            Who this is <span className="gradient-text">for</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            We screen hard. The goal is a clean 30-day test with measurable lift — not tire-kickers.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-2xl p-8 border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <BadgeCheck className="w-5 h-5 text-primary" aria-hidden />
              <h3 className="font-display font-bold text-lg">Good fit</h3>
            </div>
            <ul className="space-y-3">
              {goodFit.map((t) => (
                <li key={t} className="text-sm text-muted-foreground leading-relaxed">
                  • {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-2xl p-8 border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <Ban className="w-5 h-5 text-muted-foreground" aria-hidden />
              <h3 className="font-display font-bold text-lg">Not a fit</h3>
            </div>
            <ul className="space-y-3">
              {notFit.map((t) => (
                <li key={t} className="text-sm text-muted-foreground leading-relaxed">
                  • {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
