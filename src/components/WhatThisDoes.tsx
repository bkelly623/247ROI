"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Zap, Target, Calendar, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestBookCallFocus, requestVoiceDemoFocus } from "@/lib/scrollFunnel";

const items: { icon: LucideIcon; title: string; description: string; gradient: string }[] = [
  {
    icon: Zap,
    title: "Answers instantly",
    description: "First touch in seconds — no voicemail limbo, no ghosting.",
    gradient: "from-primary to-cyan-400",
  },
  {
    icon: Target,
    title: "Captures every lead",
    description: "Names, intent, and context saved before the moment passes.",
    gradient: "from-cyan-400 to-primary",
  },
  {
    icon: Calendar,
    title: "Books appointments",
    description: "Slots that fit your calendar, confirmed without the back-and-forth.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: RefreshCw,
    title: "Follows up automatically",
    description: "Reminders and nudges so warm leads don’t go cold.",
    gradient: "from-secondary to-pink-500",
  },
  {
    icon: Layers,
    title: "Works across channels",
    description: "One brain for voice, text, and web — consistent every time.",
    gradient: "from-violet-500 to-primary",
  },
];

export default function WhatThisDoes() {
  const pathname = usePathname();

  return (
    <section id="what-it-does" className="py-24 relative overflow-hidden scroll-mt-28 border-t border-border/40">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/15 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 md:mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">What this does</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4 mb-5">
            Your receptionist, <span className="gradient-text">on autopilot</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Five jobs handled end-to-end — so nothing slips through when you&apos;re busy or off the clock.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <Button
              type="button"
              size="lg"
              onClick={() => requestVoiceDemoFocus(pathname)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 min-h-[3.25rem] text-base font-semibold shadow-[0_0_32px_hsl(174_72%_56%/0.22)] touch-manipulation"
            >
              Talk to the AI Receptionist
            </Button>
            <button
              type="button"
              onClick={() => requestBookCallFocus(pathname)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline touch-manipulation"
            >
              Or book a 10-minute setup call
            </button>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: index * 0.06 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="group"
            >
              <div className="glass rounded-2xl p-7 h-full relative overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.08)] hover:shadow-[0_0_50px_rgba(255,255,255,0.12)] transition-shadow duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div
                  className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-5 shadow-lg`}
                >
                  <Icon className="w-6 h-6 text-primary-foreground" strokeWidth={1.75} />
                </div>

                <h3 className="relative font-display font-bold text-lg text-foreground mb-3 leading-snug">
                  {item.title}
                </h3>
                <p className="relative text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
