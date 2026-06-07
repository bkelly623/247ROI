"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Phone, SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";

export default function HomeSetupCallSection() {
  return (
    <section id="contact" className="relative overflow-hidden border-t border-border/40 py-20 scroll-mt-28 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/15 via-transparent to-muted/15" />
      <div className="container relative z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_0.82fr] lg:items-stretch"
        >
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-10">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <SearchCheck className="h-4 w-4" aria-hidden />
              AI employee audit
            </span>
            <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Find the first AI employee worth building.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              We inspect one real workflow, identify the highest-value automation role, define the handoffs, and decide
              what should stay under human approval.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Lead leak", "Repeatable work", "Human approval"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-background/40 p-4 text-sm font-semibold text-foreground/85">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-primary/20 bg-primary/10 p-7 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Start here</p>
            <h3 className="mt-3 font-display text-2xl font-bold">Book a short AI audit.</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              No generic pitch. We will talk through the workflow and tell you whether there is a real employee to build.
            </p>
            <div className="mt-7 flex flex-col gap-3">
              <Button asChild size="lg" className="justify-center rounded-full bg-primary px-7 font-semibold text-primary-foreground hover:bg-primary/90">
                <Link href="/contact">
                  Book AI Audit <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="justify-center rounded-full border-white/15 bg-white/[0.03] px-7 text-foreground hover:bg-white/[0.07]">
                <a href={PRIMARY_PHONE_HREF}>
                  <Phone className="mr-2 h-4 w-4" aria-hidden />
                  {PRIMARY_PHONE_DISPLAY}
                </a>
              </Button>
              <a href="mailto:contact@247roi.com" className="inline-flex justify-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">
                <Mail className="h-4 w-4" aria-hidden />
                contact@247roi.com
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
