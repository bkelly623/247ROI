"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TestDriveLink } from "@/components/TestDriveLink";
import LeadConnectorVoiceWidget from "@/components/LeadConnectorVoiceWidget";

export default function Hero() {
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
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-14 items-center">
          <div className="text-center lg:text-left">
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
              className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed"
            >
              Answers calls, responds to texts, handles your website, and follows up automatically — so you never miss
              a customer again.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex justify-center lg:justify-start max-w-xl mx-auto lg:mx-0"
            >
              <Button
                size="lg"
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 sm:px-12 min-h-[4rem] w-full sm:w-auto text-base sm:text-lg font-semibold shadow-[0_0_50px_rgba(255,255,255,0.35),0_0_80px_rgba(255,255,255,0.2)] hover:shadow-[0_0_70px_rgba(255,255,255,0.45)] transition-shadow"
              >
                <TestDriveLink className="inline-flex h-full min-h-[4rem] w-full items-center justify-center px-4 py-3 text-center leading-snug">
                  Try This On Your Business (Free)
                </TestDriveLink>
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15 }}
            className="relative w-full max-w-lg mx-auto lg:max-w-none"
          >
            <div
              className="pointer-events-none absolute -inset-4 rounded-[1.75rem] opacity-90 bg-[radial-gradient(ellipse_80%_70%_at_50%_40%,hsl(174_72%_56%/0.35),transparent_65%),radial-gradient(ellipse_60%_50%_at_80%_80%,hsl(262_83%_58%/0.2),transparent_55%)] blur-3xl"
              aria-hidden
            />
            <div className="relative rounded-[1.35rem] border border-white/10 bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-black p-8 sm:p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.06),0_24px_64px_-12px_rgba(0,0,0,0.75)]">
              <div className="absolute inset-0 rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,transparent_45%,rgba(255,255,255,0.02)_100%)] pointer-events-none" />
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/90 mb-2">
                Live voice AI chat
              </p>
              <p className="text-center text-sm text-zinc-400 mb-8 max-w-sm mx-auto leading-relaxed">
                Your real LeadConnector widget is active here. Open it to test exactly what visitors see.
              </p>
              <LeadConnectorVoiceWidget />
            </div>
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
