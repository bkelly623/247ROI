"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Phone, Globe, MessageSquare, Mail, Share2 } from "lucide-react";

const channels: { icon: LucideIcon; label: string }[] = [
  { icon: Phone, label: "Phone" },
  { icon: Globe, label: "Website" },
  { icon: MessageSquare, label: "SMS" },
  { icon: Mail, label: "Email" },
  { icon: Share2, label: "Social" },
];

export default function WhereItWorks() {
  return (
    <section id="where-it-works" className="py-24 relative overflow-hidden scroll-mt-28 border-t border-border/40">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/10 via-transparent to-muted/10" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-12 md:mb-14"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Coverage</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4 mb-5">
            One system, <span className="gradient-text">every channel</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Calls and inbound messages are handled consistently so leads don’t scatter across inboxes.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-6 max-w-5xl mx-auto">
          {channels.map((ch, index) => {
            const Icon = ch.icon;
            return (
              <motion.div
                key={ch.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="glass rounded-2xl p-6 md:p-8 h-full flex flex-col items-center text-center border border-white/[0.06]"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" strokeWidth={1.75} />
                </div>
                <p className="font-display font-semibold text-foreground text-[15px] md:text-base">{ch.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
