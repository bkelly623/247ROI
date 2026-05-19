"use client";

import { motion } from "framer-motion";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LeadConnectorInHero from "@/components/LeadConnectorInHero";
import LeadConnectorVoiceLauncher from "@/components/LeadConnectorVoiceLauncher";
import {
  AI_RECEPTIONIST_CTA_PHONE_DISPLAY,
  AI_RECEPTIONIST_CTA_PHONE_HREF,
} from "@/app/components/cta";
import {
  GHL_VOICE_WIDGET_ID,
  GHL_VOICE_WIDGET_RESOURCES_URL,
  GHL_VOICE_WIDGET_SCRIPT_SRC,
} from "@/lib/ghlVoiceWidget";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 md:pt-32">
        <section className="relative pb-14 md:pb-18 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/15 via-transparent to-transparent pointer-events-none" />
          <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">247ROI Demo</span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mt-4 mb-6 leading-tight">
                Call the <span className="gradient-text">demo line</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                Try it like a customer. You&apos;ll see how missed calls are captured, followed up, and moved toward a booked job — automatically.
              </p>
            </motion.div>
          </div>
        </section>

        <section id="voice-demo" className="pb-16 md:pb-20 scroll-mt-28">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="glass rounded-3xl border border-white/[0.08] overflow-hidden">
                <div className="p-8 sm:p-10 md:p-12 text-center">
                  <p className="text-lg sm:text-xl font-display font-semibold text-foreground mb-2">Call now</p>
                  <a
                    href={AI_RECEPTIONIST_CTA_PHONE_HREF}
                    className="text-primary font-semibold underline underline-offset-4 decoration-2 tabular-nums"
                  >
                    {AI_RECEPTIONIST_CTA_PHONE_DISPLAY}
                  </a>
                  <p className="mt-5 text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    What to try: “I need service today”, “How much is a diagnostic?”, “Do you service my ZIP?”, “Book me for tomorrow.”
                  </p>
                </div>

                <div className="border-t border-white/[0.06] p-8 sm:p-10 md:p-12">
                  <Script
                    id="leadconnector-voice-widget-demo"
                    src={GHL_VOICE_WIDGET_SCRIPT_SRC}
                    strategy="afterInteractive"
                    data-resources-url={GHL_VOICE_WIDGET_RESOURCES_URL}
                    data-widget-id={GHL_VOICE_WIDGET_ID}
                  />
                  <LeadConnectorInHero />

                  <div className="relative flex w-full min-h-[12rem] sm:min-h-[13rem] flex-col items-center justify-center py-2">
                    <div
                      id="gcl-launcher-slot"
                      className="relative flex w-full flex-1 min-h-[10rem] items-center justify-center"
                    />
                    <div className="mt-4">
                      <LeadConnectorVoiceLauncher />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <a href="/\#book-call" className="inline-flex items-center justify-center h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 text-sm font-semibold">
                  Book a 10-minute setup call
                </a>
                <p className="mt-3 text-xs text-muted-foreground">No upfront setup cost for the 30-day test. Continue only if it creates value.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
