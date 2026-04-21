"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, X } from "lucide-react";
import heroImage from "@/assets/hero-abstract.jpg";
import { TestDriveLink } from "@/components/TestDriveLink";

const VIMEO_VIDEO_ID = "1156355064";

export default function Hero() {
  const [showVideo, setShowVideo] = useState(false);

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
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-sm text-muted-foreground">ROI around the clock — even while you sleep</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-tight mb-6"
            >
              Revenue That Runs <span className="gradient-text">24/7</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8"
            >
              AI receptionists, lead capture, and follow-up that keep revenue moving — so you earn ROI overnight,
              on weekends, and every hour you&apos;re not at the desk. That&apos;s 247ROI.
            </motion.p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start sm:items-stretch max-w-xl mx-auto lg:mx-0 lg:max-w-none">
              <motion.div
                className="flex w-full sm:flex-1 sm:min-w-0 lg:max-w-xl"
                initial={{ y: "-60vh" }}
                animate={{ y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 8,
                  mass: 1,
                  velocity: 2,
                  delay: 0.3,
                }}
              >
                <Button
                  size="lg"
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 sm:px-10 h-full min-h-[4.5rem] w-full text-base sm:text-lg font-semibold group shadow-[0_0_50px_rgba(255,255,255,0.5),0_0_80px_rgba(255,255,255,0.3)] hover:shadow-[0_0_70px_rgba(255,255,255,0.6),0_0_100px_rgba(255,255,255,0.4)] transition-shadow whitespace-normal text-center leading-snug flex items-center justify-center"
                >
                  <TestDriveLink className="inline-flex h-full min-h-[4.5rem] w-full items-center justify-center gap-0 px-1 py-2">
                    <span>Test drive our AI receptionist</span>
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
                  </TestDriveLink>
                </Button>
              </motion.div>
              <motion.div
                className="flex w-full sm:w-auto sm:shrink-0"
                initial={{ y: "-60vh" }}
                animate={{ y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 8,
                  mass: 1,
                  velocity: 2,
                  delay: 0.45,
                }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 h-full min-h-[4.5rem] w-full sm:w-auto font-semibold border-border hover:bg-muted shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-shadow flex items-center justify-center text-base sm:text-lg"
                  onClick={() => setShowVideo(true)}
                >
                  <Play className="mr-2 w-4 h-4 shrink-0" />
                  Watch Demo
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-8 justify-center lg:justify-start mt-12"
            >
              {[
                { value: "500+", label: "Businesses served" },
                { value: "10k+", label: "Calls handled daily" },
                { value: "24/7", label: "ROI in motion" },
              ].map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-display font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              <AnimatePresence>
                {showVideo && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 3, ease: "easeOut" }}
                    className="absolute -inset-12 rounded-3xl pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, rgba(255, 250, 230, 0.95) 0%, rgba(255, 220, 120, 0.7) 25%, rgba(255, 200, 80, 0.45) 50%, rgba(255, 180, 50, 0.2) 70%, transparent 85%)",
                      filter: "blur(40px)",
                    }}
                  />
                )}
              </AnimatePresence>

              <motion.div
                className="relative rounded-2xl overflow-hidden glass glow"
                animate={!showVideo ? { y: [0, -10, 0] } : { y: 0 }}
                transition={{ duration: 6, repeat: showVideo ? 0 : Infinity, ease: "easeInOut" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- bundled static import */}
                <img
                  src={typeof heroImage === "string" ? heroImage : heroImage.src}
                  alt="AI Technology"
                  className="w-full h-auto rounded-2xl"
                />

                <AnimatePresence>
                  {showVideo && (
                    <motion.div
                      initial={{ y: "-100vh", opacity: 1 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: "-100vh", opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        mass: 1.2,
                      }}
                      className="absolute inset-0 z-20 rounded-2xl overflow-hidden"
                    >
                      <iframe
                        src={`https://player.vimeo.com/video/${VIMEO_VIDEO_ID}?autoplay=1&loop=0&muted=0`}
                        className="w-full h-full min-h-[280px] rounded-2xl"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title="Demo Video"
                      />
                      <button
                        type="button"
                        onClick={() => setShowVideo(false)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors z-30"
                      >
                        <X className="w-5 h-5 text-foreground" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showVideo && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="absolute bottom-6 left-6 right-6 glass-strong rounded-xl p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold">AI</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">AI Receptionist Active</div>
                        <div className="text-xs text-muted-foreground">Handling 47 calls right now</div>
                      </div>
                      <div className="ml-auto">
                        <span className="w-3 h-3 rounded-full bg-primary inline-block animate-pulse" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                className="absolute -top-4 -right-4 w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 blur-sm"
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
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
