"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calculator, ClipboardCheck, DatabaseZap, FileSearch, Megaphone, MessageSquareText, PhoneCall } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeSetupCallSection from "@/components/HomeSetupCallSection";
import { Button } from "@/components/ui/button";
import { featuredAiEmployeeOffers, type AiEmployeeOffer } from "@/lib/aiEmployees";

const iconMap = {
  phone: PhoneCall,
  message: MessageSquareText,
  calculator: Calculator,
  fileSearch: FileSearch,
  megaphone: Megaphone,
  clipboard: ClipboardCheck,
  databaseZap: DatabaseZap,
};

const priorityLabels = {
  core: "Common use case",
  contractor: "High-value workflow",
  growth: "Growth workflow",
};

function OfferCard({ offer, index }: { offer: AiEmployeeOffer; index: number }) {
  const Icon = iconMap[offer.icon];

  return (
    <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: index * 0.04 }} className="group h-full">
      <Link href={offer.route} className="block h-full rounded-3xl border border-white/10 bg-white/[0.035] p-7 transition-transform duration-300 hover:-translate-y-1">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/15">
            <Icon className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <span className="rounded-full border border-white/10 bg-background/40 px-3 py-1 text-xs text-muted-foreground">
            {priorityLabels[offer.priority]}
          </span>
        </div>

        <h3 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-foreground">
          {offer.title}
          <ArrowRight className="h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
        </h3>
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{offer.bestFor}</p>
        <ul className="space-y-2">
          {offer.outcomes.slice(0, 3).map((outcome) => (
            <li key={outcome} className="flex items-center gap-2 text-sm text-foreground/80">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {outcome}
            </li>
          ))}
        </ul>
      </Link>
    </motion.div>
  );
}

export default function AiEmployeesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-border/40 pb-16 pt-32 md:pb-20 md:pt-40">
          <div className="absolute inset-0 hero-gradient" />
          <div className="container relative z-10 mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mx-auto max-w-4xl text-center">
              <span className="mb-5 inline-flex rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                Custom AI employee software
              </span>
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                If it happens on a computer, we can probably build AI around it.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                247ROI builds custom AI employees around your actual workflow: inboxes, CRMs, spreadsheets, documents,
                portals, estimates, bids, follow-up, reporting, and messy handoffs. The examples below are starting
                points, not a fixed menu.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href="/hire">Find My First AI Employee</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]">
                  <Link href="/articles">See Use Cases</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Use-case patterns</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Examples of what custom AI employees can handle</h2>
              <p className="mt-4 text-muted-foreground">
                These pages help buyers understand the category. Your build can be narrower, broader, or completely
                different if the workflow is valuable enough.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredAiEmployeeOffers.map((offer, index) => (
                <OfferCard key={offer.slug} offer={offer} index={index} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
              {[
                ["1", "Custom before canned", "We start with how your business actually works, then design the AI system around the tools, files, approvals, and handoffs already in play."],
                ["2", "Workflow before role", "The name matters less than the job: what triggers the work, what output is produced, and what still needs human judgment."],
                ["3", "Evidence before expansion", "We expand only after the first workflow gets cleaner, faster, or easier to manage."],
              ].map(([number, title, body]) => (
                <div key={number} className="rounded-3xl border border-white/10 bg-white/[0.035] p-8">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">{number}</div>
                  <h3 className="mb-3 font-display text-xl font-bold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HomeSetupCallSection />
      </main>
      <Footer />
    </div>
  );
}
