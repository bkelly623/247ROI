"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";

export default function CTA() {
  return (
    <section id="contact" className="relative overflow-hidden border-t border-border/40 py-24 scroll-mt-28">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/10 to-transparent pointer-events-none" />
      <div className="container relative z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl"
        >
          <div className="glass-strong rounded-3xl border border-white/[0.08] p-10 text-center sm:p-14">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">Next step</p>
            <h2 className="mb-5 font-display text-3xl font-bold sm:text-4xl lg:text-5xl">
              Bring one messy workflow. Leave with the first AI employee to build.
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              We will identify the role, the handoffs, the human approval points, and the scorecard before anything goes live.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-h-[3.5rem] rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                <Link href="/contact">Book AI Audit</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-[3.5rem] rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]">
                <a href={PRIMARY_PHONE_HREF}>
                  <Phone className="mr-2 h-4 w-4 shrink-0" />
                  {PRIMARY_PHONE_DISPLAY}
                </a>
              </Button>
            </div>

            <a href="mailto:contact@247roi.com" className="mt-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <Mail className="h-4 w-4 shrink-0" />
              contact@247roi.com
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
