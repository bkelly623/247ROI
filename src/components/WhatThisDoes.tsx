"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { PhoneCall, Zap, CalendarCheck, MessageSquareText, BarChart3 } from "lucide-react";

const items: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: PhoneCall,
    title: "Every call answered",
    description: "After-hours and overflow are handled so leads don’t disappear into voicemail.",
  },
  {
    icon: Zap,
    title: "Instant response",
    description: "Fast first-touch that captures the job details and routes the next step.",
  },
  {
    icon: CalendarCheck,
    title: "Booking + handoff",
    description: "Appointments, estimates, and callbacks move toward scheduled work.",
  },
  {
    icon: MessageSquareText,
    title: "Follow-up",
    description: "Simple nudges and reminders keep warm leads from going cold.",
  },
  {
    icon: BarChart3,
    title: "Weekly scorecard",
    description: "Clear KPIs tied to booked jobs — not vague “AI metrics.”",
  },
];

export default function WhatThisDoes() {
  return (
    <section id="what-it-does" className="py-24 relative overflow-hidden scroll-mt-28 border-t border-border/40">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/10 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-14 md:mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">What it does</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4 mb-5">
            Never miss a <span className="gradient-text">lead</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            We fix the revenue leak closest to the money: missed calls and slow response.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="glass rounded-2xl p-7 h-full relative overflow-hidden border border-white/[0.06]"
              >
                <div className="relative w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="relative font-display font-bold text-lg text-foreground mb-2 leading-snug">{item.title}</h3>
                <p className="relative text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
