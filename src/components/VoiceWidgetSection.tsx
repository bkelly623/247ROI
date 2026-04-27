"use client";

import { motion } from "framer-motion";
import Script from "next/script";
import LeadConnectorVoiceLauncher from "@/components/LeadConnectorVoiceLauncher";
import {
  GHL_VOICE_WIDGET_ID,
  GHL_VOICE_WIDGET_RESOURCES_URL,
  GHL_VOICE_WIDGET_SCRIPT_SRC,
} from "@/lib/ghlVoiceWidget";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";

export default function VoiceWidgetSection() {
  return (
    <section className="lg:hidden relative overflow-hidden border-t border-border/40 py-20 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/10 via-transparent to-muted/10" />
      <Script
        id="leadconnector-voice-widget-mobile"
        src={GHL_VOICE_WIDGET_SCRIPT_SRC}
        strategy="afterInteractive"
        data-resources-url={GHL_VOICE_WIDGET_RESOURCES_URL}
        data-widget-id={GHL_VOICE_WIDGET_ID}
      />
      <div className="container relative z-10 mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="relative rounded-[1.35rem] border border-amber-200/15 bg-gradient-to-b from-amber-950/45 via-stone-800/92 to-stone-950/96 p-8 sm:p-10 shadow-[0_0_0_1px_rgba(255,237,213,0.14),inset_0_1px_0_rgba(255,251,235,0.12),0_24px_56px_-14px_rgba(28,25,23,0.55)]"
        >
          <div className="pointer-events-none absolute inset-0 rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(255,251,235,0.1)_0%,transparent_40%,rgba(167,243,208,0.06)_100%)]" />
          <div className="relative z-[2] flex flex-col items-center text-center">
            <p className="text-lg sm:text-xl font-display font-semibold text-stone-50 tracking-tight mb-3 max-w-md leading-snug">
              Prefer to try it right here? Talk to Pam directly on this page.
            </p>
            <p className="text-base sm:text-[17px] text-stone-200/95 mb-7 max-w-md mx-auto leading-relaxed">
              Same AI receptionist — no download, no signup. Just click and talk.
            </p>
            <div className="relative flex w-full min-h-[12rem] sm:min-h-[13rem] flex-col items-center justify-center py-2">
              <LeadConnectorVoiceLauncher />
            </div>
            <p className="mt-8 text-sm sm:text-base text-stone-300/95 leading-relaxed max-w-md">
              Prefer to call?{" "}
              <a
                href={PRIMARY_PHONE_HREF}
                className="text-primary font-semibold underline-offset-2 hover:underline tabular-nums"
              >
                {PRIMARY_PHONE_DISPLAY}
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
