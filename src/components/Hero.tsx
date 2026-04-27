"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useAnimationControls } from "framer-motion";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import LeadConnectorVoiceLauncher from "@/components/LeadConnectorVoiceLauncher";
import LeadConnectorInHero from "@/components/LeadConnectorInHero";
import {
  AI_RECEPTIONIST_CTA_PHONE_DISPLAY,
  AI_RECEPTIONIST_CTA_PHONE_HREF,
  BOOK_SETUP_CALL_LINK_CLASSNAME,
} from "@/app/components/cta";
import {
  GHL_VOICE_WIDGET_ID,
  GHL_VOICE_WIDGET_RESOURCES_URL,
  GHL_VOICE_WIDGET_SCRIPT_SRC,
} from "@/lib/ghlVoiceWidget";
import { VOICE_DEMO_FOCUS_EVENT } from "@/lib/scrollFunnel";
import {
  SITE_LOGO_ALT,
  SITE_LOGO_INTRINSIC,
  SITE_LOGO_PATH,
  siteLogoHeroCardImageClassName,
} from "@/lib/siteLogo";

export default function Hero() {
  const voiceDemoRef = useRef<HTMLDivElement>(null);
  const voiceCardControls = useAnimationControls();
  const [spotlight, setSpotlight] = useState(false);
  const [showTapHint, setShowTapHint] = useState(false);
  const [micPulseNonce, setMicPulseNonce] = useState(0);
  const [slotFilled, setSlotFilled] = useState(false);
  const [showFallbackLauncher, setShowFallbackLauncher] = useState(false);

  useEffect(() => {
    const slot = document.getElementById("gcl-launcher-slot");
    if (!slot) return;
    const sync = () => setSlotFilled(slot.childElementCount > 0);
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(slot, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setShowFallbackLauncher(true), 8000);
    return () => window.clearTimeout(t);
  }, []);

  const scrollToVoiceDemo = useCallback(() => {
    voiceDemoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setSpotlight(true);
    setShowTapHint(true);
    setMicPulseNonce((n) => n + 1);
    void voiceCardControls
      .start({
        scale: [1, 1.03, 1, 1.03, 1, 1.03, 1],
        transition: { duration: 1.65, ease: [0.4, 0, 0.2, 1] },
      })
      .then(() => voiceCardControls.start({ scale: 1, transition: { duration: 0.2 } }));
    window.setTimeout(() => setSpotlight(false), 4200);
    window.setTimeout(() => setShowTapHint(false), 10000);
  }, [voiceCardControls]);

  useEffect(() => {
    const onVoiceFocus = () => {
      scrollToVoiceDemo();
    };
    window.addEventListener(VOICE_DEMO_FOCUS_EVENT, onVoiceFocus);
    return () => window.removeEventListener(VOICE_DEMO_FOCUS_EVENT, onVoiceFocus);
  }, [scrollToVoiceDemo]);

  const showLauncherFallback = showFallbackLauncher && !slotFilled;

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
          {/* Copy + CTAs */}
          <div className="text-center order-1">
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
              className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 lg:mb-10 leading-relaxed"
            >
              We build it custom for your business, run it live for 30 days, and you don&apos;t pay until you see it
              work.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full max-w-xl mx-auto mb-10 lg:mb-0 flex justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 sm:px-12 min-h-[4rem] w-full sm:w-auto text-base sm:text-lg font-semibold shadow-[0_0_50px_rgba(255,255,255,0.35),0_0_80px_rgba(255,255,255,0.2)] hover:shadow-[0_0_70px_rgba(255,255,255,0.45)] transition-shadow touch-manipulation"
                >
                  <a href={AI_RECEPTIONIST_CTA_PHONE_HREF}>Call Our AI Receptionist Now</a>
                </Button>
                <Link href="/#book-call" className={`${BOOK_SETUP_CALL_LINK_CLASSNAME} text-center max-w-xs`}>
                  Or book a 10-minute setup call
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Voice demo: same block as desktop; stacks below copy on small screens (1 col) */}
          <motion.div
            ref={voiceDemoRef}
            id="voice-demo"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="relative w-full max-w-lg mx-auto lg:max-w-none order-2 scroll-mt-28"
          >
            <Script
              id="leadconnector-voice-widget-hero"
              src={GHL_VOICE_WIDGET_SCRIPT_SRC}
              strategy="afterInteractive"
              data-resources-url={GHL_VOICE_WIDGET_RESOURCES_URL}
              data-widget-id={GHL_VOICE_WIDGET_ID}
            />
            <LeadConnectorInHero />

            <motion.div
              className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-90"
              aria-hidden
              animate={{
                opacity: [0.5, 0.82, 0.5],
                scale: [1, 1.03, 1],
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 42%, hsl(38 92% 50% / 0.18), transparent 60%), radial-gradient(ellipse 55% 50% at 75% 78%, hsl(174 72% 56% / 0.22), transparent 58%)",
                filter: "blur(28px)",
              }}
            />
            <div
              className="pointer-events-none absolute -inset-3 rounded-[1.75rem] opacity-95 bg-[radial-gradient(ellipse_80%_70%_at_50%_38%,hsl(174_72%_56%/0.22),transparent_62%),radial-gradient(ellipse_55%_50%_at_85%_85%,hsl(38_90%_55%/0.12),transparent_55%)] blur-2xl"
              aria-hidden
            />

            <motion.div
              animate={voiceCardControls}
              initial={{ scale: 1 }}
              whileHover={{ y: -4, transition: { duration: 0.35 } }}
              className={`relative rounded-[1.35rem] border bg-gradient-to-b from-amber-950/45 via-stone-800/92 to-stone-950/96 p-8 sm:p-10 md:p-12 shadow-[0_0_0_1px_rgba(255,237,213,0.14),inset_0_1px_0_rgba(255,251,235,0.12),0_24px_56px_-14px_rgba(28,25,23,0.55)] transition-[box-shadow,border-color] duration-500 hover:border-primary/40 hover:shadow-[0_0_0_1px_rgba(255,247,237,0.16),0_28px_64px_-14px_rgba(28,25,23,0.5),0_0_48px_hsl(174_72%_56%/0.2)] ${
                spotlight
                  ? "border-primary/55 shadow-[0_0_0_2px_hsl(174_72%_56%/0.5),0_0_64px_hsl(174_72%_56%/0.32),0_24px_64px_-12px_rgba(0,0,0,0.65)]"
                  : "border-amber-200/15"
              }`}
            >
              {micPulseNonce > 0 ? (
                <motion.div
                  key={micPulseNonce}
                  className="pointer-events-none absolute inset-0 z-[1] rounded-[1.35rem] ring-2 ring-primary/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.9, 0.4, 0] }}
                  transition={{ duration: 2.2, ease: "easeOut" }}
                  aria-hidden
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(255,251,235,0.1)_0%,transparent_40%,rgba(167,243,208,0.06)_100%)]" />

              <div className="relative z-[2] flex flex-col items-center text-center">
                <p className="text-lg sm:text-xl font-display font-semibold text-stone-50 tracking-tight mb-3 max-w-md leading-snug">
                  Talk to our AI receptionist right now
                </p>
                <p className="text-base sm:text-[17px] text-stone-200/95 mb-7 max-w-md mx-auto leading-relaxed">
                  Ask about pricing, availability, or booking — just like a real customer
                </p>

                {showTapHint ? (
                  <p className="mb-4 text-sm font-medium tracking-wide text-primary" aria-live="polite">
                    Tap the mic to start
                  </p>
                ) : null}

                {/* Never put key={micPulseNonce} here — it remounts #gcl-launcher-slot and kills the relocated GHL widget */}
                <div className="relative flex w-full min-h-[12rem] sm:min-h-[13rem] flex-col items-center justify-center py-2">
                  <div
                    id="gcl-launcher-slot"
                    className="relative flex w-full flex-1 min-h-[10rem] items-center justify-center"
                  />
                  {showLauncherFallback ? (
                    <div className={slotFilled ? "hidden" : "mt-2"}>
                      <LeadConnectorVoiceLauncher micPulseNonce={0} />
                    </div>
                  ) : null}
                </div>

                <p className="mt-8 text-sm sm:text-base text-stone-300/95 leading-relaxed max-w-md">
                  Prefer to call?{" "}
                  <a
                    href={AI_RECEPTIONIST_CTA_PHONE_HREF}
                    className="text-primary font-semibold underline underline-offset-2 hover:underline tabular-nums"
                  >
                    {AI_RECEPTIONIST_CTA_PHONE_DISPLAY}
                  </a>
                </p>
                <div className="mt-6 flex justify-center">
                  <Image
                    src={SITE_LOGO_PATH}
                    alt={SITE_LOGO_ALT}
                    width={SITE_LOGO_INTRINSIC.width}
                    height={SITE_LOGO_INTRINSIC.height}
                    className={`${siteLogoHeroCardImageClassName} opacity-95`}
                  />
                </div>
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
