"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import LeadConnectorVoiceLauncher from "@/components/LeadConnectorVoiceLauncher";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";
import {
  GHL_VOICE_WIDGET_ID,
  GHL_VOICE_WIDGET_RESOURCES_URL,
  GHL_VOICE_WIDGET_SCRIPT_SRC,
} from "@/lib/ghlVoiceWidget";

export default function Hero() {
  const voiceDemoRef = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState(false);
  const [showTapHint, setShowTapHint] = useState(false);
  const [micPulseNonce, setMicPulseNonce] = useState(0);

  const scrollToVoiceDemo = useCallback(() => {
    voiceDemoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setSpotlight(true);
    setShowTapHint(true);
    setMicPulseNonce((n) => n + 1);
    window.setTimeout(() => setSpotlight(false), 2800);
    window.setTimeout(() => setShowTapHint(false), 10000);
  }, []);

  const scrollToBookCall = useCallback(() => {
    document.getElementById("book-call")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28 md:pt-32">
      <div className="absolute inset-0 hero-gradient" />

      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-secondary/10 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="text-center lg:text-left order-1">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-sm text-muted-foreground">Voice · Text · Web — one receptionist</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-display font-bold leading-[1.08] mb-6"
            >
              Your AI Receptionist — <span className="gradient-text">Wherever Your Customers Reach You</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 lg:mb-10 leading-relaxed"
            >
              Answers calls, responds to texts, handles your website, and follows up automatically — so you never miss
              a customer again.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col justify-center lg:justify-start max-w-xl mx-auto lg:mx-0 gap-4 mb-10 lg:mb-0"
            >
              <Button
                type="button"
                size="lg"
                onClick={scrollToVoiceDemo}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 sm:px-12 min-h-[4rem] w-full sm:w-auto text-base sm:text-lg font-semibold shadow-[0_0_50px_rgba(255,255,255,0.35),0_0_80px_rgba(255,255,255,0.2)] hover:shadow-[0_0_70px_rgba(255,255,255,0.45)] transition-shadow touch-manipulation"
              >
                Talk to the AI Receptionist
              </Button>
              <button
                type="button"
                onClick={scrollToBookCall}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline touch-manipulation text-center lg:text-left"
              >
                Or book a 10-minute setup call
              </button>
            </motion.div>
          </div>

          <motion.div
            ref={voiceDemoRef}
            id="voice-demo"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15 }}
            className="relative w-full max-w-lg mx-auto lg:max-w-none order-2 scroll-mt-28"
          >
            <Script
              id="leadconnector-voice-widget-hero"
              src={GHL_VOICE_WIDGET_SCRIPT_SRC}
              strategy="afterInteractive"
              data-resources-url={GHL_VOICE_WIDGET_RESOURCES_URL}
              data-widget-id={GHL_VOICE_WIDGET_ID}
            />

            <motion.div
              className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-80"
              aria-hidden
              animate={{
                opacity: [0.45, 0.75, 0.45],
                scale: [1, 1.03, 1],
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 45%, hsl(174 72% 56% / 0.22), transparent 62%), radial-gradient(ellipse 55% 50% at 75% 75%, hsl(262 83% 58% / 0.14), transparent 58%)",
                filter: "blur(28px)",
              }}
            />
            <div
              className="pointer-events-none absolute -inset-3 rounded-[1.75rem] opacity-90 bg-[radial-gradient(ellipse_80%_70%_at_50%_40%,hsl(174_72%_56%/0.28),transparent_65%),radial-gradient(ellipse_60%_50%_at_80%_80%,hsl(262_83%_58%/0.16),transparent_55%)] blur-2xl"
              aria-hidden
            />

            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.35 } }}
              className={`relative rounded-[1.35rem] border bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-black p-8 sm:p-10 md:p-12 shadow-[0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.06),0_24px_64px_-12px_rgba(0,0,0,0.75)] transition-[box-shadow,border-color] duration-500 hover:border-primary/25 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_28px_72px_-12px_rgba(0,0,0,0.78),0_0_48px_hsl(174_72%_56%/0.12)] ${
                spotlight
                  ? "border-primary/50 shadow-[0_0_0_2px_hsl(174_72%_56%/0.45),0_0_56px_hsl(174_72%_56%/0.28),0_24px_64px_-12px_rgba(0,0,0,0.75)]"
                  : "border-white/10"
              }`}
            >
              <div className="absolute inset-0 rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,transparent_45%,rgba(255,255,255,0.02)_100%)] pointer-events-none" />

              <div className="relative flex flex-col items-center text-center">
                <p className="text-base sm:text-lg font-display font-semibold text-foreground tracking-tight mb-3 max-w-md leading-snug">
                  Talk to our AI receptionist right now
                </p>
                <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto leading-relaxed">
                  Ask about pricing, availability, or booking — just like a real customer
                </p>

                {showTapHint ? (
                  <p className="mb-4 text-xs font-medium uppercase tracking-wide text-primary/90" aria-live="polite">
                    Tap the mic to start
                  </p>
                ) : null}

                <div className="w-full flex justify-center py-2 min-h-[12rem] sm:min-h-[13rem] items-center">
                  <LeadConnectorVoiceLauncher micPulseNonce={micPulseNonce} />
                </div>

                <p className="mt-8 text-[13px] text-zinc-500 leading-relaxed max-w-md">
                  Prefer to call?{" "}
                  <a
                    href={PRIMARY_PHONE_HREF}
                    className="text-primary hover:text-primary/90 font-medium underline-offset-2 hover:underline tabular-nums"
                  >
                    {PRIMARY_PHONE_DISPLAY}
                  </a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
        >
          <motion.div
            animate={{ opacity: [1, 0, 1], y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-2 rounded-full bg-primary"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
