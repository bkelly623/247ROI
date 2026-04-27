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
    <section id="contact" className="py-24 relative overflow-hidden scroll-mt-28">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/10" />
            <div className="absolute inset-0 glass" />

            <motion.div
              className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/20 blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-secondary/20 blur-3xl"
              animate={{
                scale: [1.3, 1, 1.3],
                opacity: [0.4, 0.2, 0.4],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="relative z-10 py-16 px-8 md:py-20 md:px-16 text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5"
              >
                See it on <span className="gradient-text">your</span> business
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-muted-foreground text-lg max-w-xl mx-auto mb-10 leading-relaxed"
              >
                Same AI receptionist experience your customers get — try it free, then we&apos;ll align it to how
                you work.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col items-center gap-4"
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 sm:px-12 min-h-[3.75rem] text-base sm:text-lg font-semibold shadow-[0_0_40px_hsl(174_72%_56%/0.25)] touch-manipulation"
                >
                  <a href={AI_RECEPTIONIST_CTA_PHONE_HREF}>Call Our AI Receptionist Now</a>
                </Button>
                <Link href="/#book-call" className={`${BOOK_SETUP_CALL_LINK_CLASSNAME} text-center max-w-xs`}>
                  Or book a 10-minute setup call
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-12 flex flex-col sm:flex-row gap-6 justify-center items-center text-muted-foreground text-sm"
              >
                <a
                  href={PRIMARY_PHONE_HREF}
                  className="flex items-center gap-2 hover:text-primary transition-colors tabular-nums"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  {PRIMARY_PHONE_DISPLAY}
                </a>
                <a
                  href="mailto:contact@247roi.com"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  contact@247roi.com
                </a>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
