"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calculator,
  ClipboardCheck,
  FileSearch,
  Megaphone,
  MessageSquareText,
  PhoneCall,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { AI_EMPLOYEE_OFFERS } from "@/lib/aiEmployees";

const iconMap = {
  phone: PhoneCall,
  message: MessageSquareText,
  calculator: Calculator,
  fileSearch: FileSearch,
  megaphone: Megaphone,
  clipboard: ClipboardCheck,
};

const topOffers = AI_EMPLOYEE_OFFERS.filter((offer) => offer.priority !== "growth");

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 md:pt-32">
        <section className="relative overflow-hidden pb-16 md:pb-20">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/15 via-transparent to-transparent pointer-events-none" />
          <div className="container relative z-10 mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">247ROI services</span>
              <h1 className="mx-auto mt-4 max-w-4xl font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                AI employees that target <span className="gradient-text">profit leaks</span>
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                247ROI builds role-specific AI employees for service businesses: answering calls, following up with
                leads, preparing estimates, organizing bids, reviewing takeoffs, and turning proof into sales content.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Link href="/ai-employees">View AI Employees</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]"
                >
                  <Link href="/#book-call">Book a Setup Call</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-t border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Best first hires</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                Start where revenue is already leaking
              </h2>
              <p className="mt-4 text-muted-foreground">
                These are the roles closest to missed revenue, slow response, owner bottlenecks, and unprofitable
                admin work.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {topOffers.map((offer, index) => {
                const Icon = iconMap[offer.icon];
                return (
                  <motion.div
                    key={offer.slug}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: index * 0.04 }}
                    className="group"
                  >
                    <Link href={offer.route} className="glass block h-full rounded-2xl p-7 transition-transform hover:-translate-y-1">
                      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/15">
                        <Icon className="h-6 w-6 text-primary" aria-hidden />
                      </div>
                      <h3 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
                        {offer.title}
                        <ArrowRight className="h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                      </h3>
                      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{offer.bestFor}</p>
                      <ul className="space-y-2">
                        {offer.handles.slice(0, 3).map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-5xl rounded-2xl border border-primary/25 bg-primary/10 p-8 text-center">
              <h2 className="font-display text-3xl font-bold">Build the AI employee your workflow actually needs.</h2>
              <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">
                Start with the highest-value leak, prove the return, then add the next role only when the first one is
                saving time, capturing revenue, or improving follow-through.
              </p>
            </div>
          </div>
        </section>

        <CTA />
      </main>

      <Footer />
    </div>
  );
}
