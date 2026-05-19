"use client";

import { motion } from "framer-motion";
import { ArrowRight, PhoneForwarded, CalendarClock, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: PhoneForwarded,
    title: "Connect your line",
    desc: "We set up call forwarding (or a dedicated number) so after-hours / overflow calls are captured.",
  },
  {
    icon: CalendarClock,
    title: "Define the booking rules",
    desc: "Service area, hours, urgency, and routing. We match how you actually dispatch work.",
  },
  {
    icon: ShieldCheck,
    title: "Go live + track results",
    desc: "You get a simple weekly scorecard: calls answered, missed calls captured, booked jobs, and recovered value.",
  },
];

export default function HowItInstalls() {
  return (
    <section className="py-24 relative overflow-hidden border-t border-border/40">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/10 to-transparent pointer-events-none" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center mb-12"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Implementation</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4 mb-5">
            Live in <span className="gradient-text">24–48 hours</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            This is not a software subscription you install and forget. We set it up, tune it to your workflow, and measure what it recovers.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className="glass rounded-2xl p-8 border border-white/[0.06]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" aria-hidden />
                  </div>
                  <h3 className="font-display font-bold text-lg">{s.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <a href="/demo" className="inline-flex items-center gap-2 text-primary font-semibold underline underline-offset-4">
            See the full demo <ArrowRight className="w-4 h-4" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
