"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";
import {
  AI_RECEPTIONIST_CTA_PHONE_HREF,
  BOOK_SETUP_CALL_LINK_CLASSNAME,
  PRIMARY_PHONE_DISPLAY,
  PRIMARY_PHONE_HREF,
} from "@/app/components/cta";

export default function CTA() {
  return (
    <section id="contact" className="py-24 relative overflow-hidden scroll-mt-28 border-t border-border/40">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/10 to-transparent pointer-events-none" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-strong rounded-3xl border border-white/[0.08] p-10 sm:p-14 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5">
              See it in <span className="gradient-text">your</span> business
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Call or email with the workflow you want to improve. We will identify the first AI employee worth building.
            </p>

            <div className="flex flex-col items-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 sm:px-12 min-h-[3.75rem] text-base sm:text-lg font-semibold"
              >
                <a href={AI_RECEPTIONIST_CTA_PHONE_HREF}>Call the Demo Line Now</a>
              </Button>
              <Link href="/#contact" className={`${BOOK_SETUP_CALL_LINK_CLASSNAME} text-center max-w-xs`}>
                Or send the workflow by email
              </Link>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center items-center text-muted-foreground text-sm">
              <a href={PRIMARY_PHONE_HREF} className="flex items-center gap-2 hover:text-primary transition-colors tabular-nums">
                <Phone className="w-4 h-4 shrink-0" />
                {PRIMARY_PHONE_DISPLAY}
              </a>
              <a href="mailto:contact@247roi.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="w-4 h-4 shrink-0" />
                contact@247roi.com
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
