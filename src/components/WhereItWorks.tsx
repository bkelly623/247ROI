"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Phone, Globe, MessageSquare, Mail, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AI_RECEPTIONIST_CTA_PHONE_HREF,
  BOOK_SETUP_CALL_LINK_CLASSNAME,
} from "@/app/components/cta";

const channels: { icon: LucideIcon; label: string; gradient: string }[] = [
  { icon: Phone, label: "Phone", gradient: "from-primary to-cyan-400" },
  { icon: Globe, label: "Website", gradient: "from-indigo-500 to-primary" },
  { icon: MessageSquare, label: "SMS", gradient: "from-cyan-400 to-primary" },
  { icon: Mail, label: "Email", gradient: "from-secondary to-pink-500" },
  { icon: Share2, label: "Social media", gradient: "from-violet-500 to-indigo-500" },
];

export default function WhereItWorks() {
  return (
    <section id="where-it-works" className="py-24 relative overflow-hidden scroll-mt-28 border-t border-border/40">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/10 via-transparent to-muted/10" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-14"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Where it works</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4 mb-5">
            One receptionist, <span className="gradient-text">every channel</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Your receptionist works everywhere your customers reach you.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-6 max-w-5xl mx-auto">
          {channels.map((ch, index) => {
            const Icon = ch.icon;
            return (
            <motion.div
              key={ch.label}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              className="group"
            >
              <div className="glass rounded-2xl p-6 md:p-8 h-full flex flex-col items-center text-center border border-white/[0.06] shadow-[0_0_32px_rgba(255,255,255,0.06)] hover:border-primary/25 hover:shadow-[0_0_40px_hsl(174_72%_56%/0.12)] transition-all duration-300">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ch.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300`}
                >
                  <Icon className="w-7 h-7 text-primary-foreground" strokeWidth={1.75} />
                </div>
                <p className="font-display font-semibold text-foreground text-[15px] md:text-base">{ch.label}</p>
              </div>
            </motion.div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 min-h-[3.25rem] text-base font-semibold shadow-[0_0_32px_hsl(174_72%_56%/0.22)] touch-manipulation"
          >
            <a href={AI_RECEPTIONIST_CTA_PHONE_HREF}>Call Our AI Receptionist Now</a>
          </Button>
          <Link href="/#book-call" className={`${BOOK_SETUP_CALL_LINK_CLASSNAME} text-center`}>
            Or book a 10-minute setup call
          </Link>
        </div>
      </div>
    </section>
  );
}
