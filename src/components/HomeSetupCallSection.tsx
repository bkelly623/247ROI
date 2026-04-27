"use client";

import { motion } from "framer-motion";
import Script from "next/script";
import { BookingSmsDisclaimer } from "@/components/BookingEmbed";
import { Button } from "@/components/ui/button";
import { PRIMARY_PHONE_HREF } from "@/app/components/cta";
import { scrollBookCallIntoView } from "@/lib/scrollFunnel";

const SETUP_CALL_FORM_EMBED_SRC = "https://links.automagixx.com/js/form_embed.js";
const SETUP_CALL_IFRAME_SRC = "https://links.automagixx.com/widget/booking/deaNfs7Dq6XtD6FzYMR8";
const SETUP_CALL_IFRAME_ID = "deaNfs7Dq6XtD6FzYMR8_1776805467449";

export default function HomeSetupCallSection() {
  return (
    <section className="relative overflow-hidden border-t border-border/40 py-24 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/15 via-transparent to-muted/15" />

      <Script src={SETUP_CALL_FORM_EMBED_SRC} strategy="lazyOnload" />

      <div className="container relative z-10 mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <h2 className="font-display mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Get It Running On Your Business — <span className="gradient-text">Free For 30 Days</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            We build it custom, wire it up, and run it live. You don&apos;t pay until you see it work. If it
            doesn&apos;t perform — shut it off. You owe nothing.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 sm:px-12 min-h-[3.75rem] text-base sm:text-lg font-semibold shadow-[0_0_40px_hsl(174_72%_56%/0.25)] touch-manipulation"
            >
              <a href={PRIMARY_PHONE_HREF}>Call Our AI Receptionist Now</a>
            </Button>
            <button
              type="button"
              onClick={scrollBookCallIntoView}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline touch-manipulation text-center"
            >
              Or book a 10-minute setup call
            </button>
          </div>

          <div className="mx-auto mt-10 w-full max-w-4xl">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-card/80 via-card/40 to-card/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_64px_-20px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.04]">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,transparent_45%,rgba(255,255,255,0.02)_100%)]" />
              {/* `#book-call`: anchor is the embed viewport so scroll clears the headline + navbar */}
              <div
                id="book-call"
                tabIndex={-1}
                className="relative w-full min-h-[560px] scroll-mt-32 sm:min-h-[640px] sm:scroll-mt-36 md:min-h-[700px]"
              >
                <iframe
                  src={SETUP_CALL_IFRAME_SRC}
                  style={{ width: "100%", border: "none", overflow: "hidden" }}
                  scrolling="no"
                  id={SETUP_CALL_IFRAME_ID}
                  title="Book a 10-minute setup call with 247ROI"
                  className="block h-full min-h-[560px] w-full sm:min-h-[640px] md:min-h-[700px]"
                />
              </div>
            </div>
          </div>

          <BookingSmsDisclaimer className="mx-auto mt-8 max-w-2xl text-[11px] leading-relaxed sm:text-[12px]" />
        </motion.div>
      </div>
    </section>
  );
}
