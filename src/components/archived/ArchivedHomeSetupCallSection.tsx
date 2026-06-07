"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  AI_RECEPTIONIST_CTA_PHONE_HREF,
  BOOK_SETUP_CALL_LINK_CLASSNAME,
  PRIMARY_PHONE_DISPLAY,
  PRIMARY_PHONE_HREF,
} from "@/app/components/cta";

export default function ArchivedHomeSetupCallSection() {
  return (
    <section className="relative overflow-hidden border-t border-border/40 py-24 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/15 via-transparent to-muted/15" />

      <div className="container relative z-10 mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <h2 className="font-display mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Test an AI Employee On Your Business - <span className="gradient-text">No Upfront Setup Cost</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            We build it custom, wire it up, and run it live for 30 days. If it captures value, continue monthly.
            If it doesn&apos;t, shut it off - no long-term contract and no pressure.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 sm:px-12 min-h-[3.75rem] text-base sm:text-lg font-semibold shadow-[0_0_40px_hsl(174_72%_56%/0.25)] touch-manipulation"
            >
              <a href={AI_RECEPTIONIST_CTA_PHONE_HREF}>Call the Demo Line Now</a>
            </Button>
            <a href="#contact" className={`${BOOK_SETUP_CALL_LINK_CLASSNAME} text-center`}>
              Or get a workflow map
            </a>
          </div>

          <div className="mx-auto mt-10 w-full max-w-4xl">
            <div
              id="contact"
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-card/80 via-card/40 to-card/30 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_64px_-20px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.04]"
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Direct contact</p>
              <h3 className="mt-3 font-display text-2xl font-bold">The old calendar widget is removed.</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Call or email with the workflow you want to improve and we will map the right AI employee before anything goes live.
              </p>
              <a
                href={PRIMARY_PHONE_HREF}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Call {PRIMARY_PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
