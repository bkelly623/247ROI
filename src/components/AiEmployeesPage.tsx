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
import Footer from "@/components/Footer";
import HomeSetupCallSection from "@/components/HomeSetupCallSection";
import { Button } from "@/components/ui/button";
import { AI_EMPLOYEE_OFFERS, type AiEmployeeOffer } from "@/lib/aiEmployees";
import { AI_RECEPTIONIST_CTA_PHONE_HREF } from "@/app/components/cta";

const iconMap = {
  phone: PhoneCall,
  message: MessageSquareText,
  calculator: Calculator,
  fileSearch: FileSearch,
  megaphone: Megaphone,
  clipboard: ClipboardCheck,
};

const priorityLabels = {
  core: "Best first hire",
  contractor: "High-value contractor role",
  growth: "Expansion role",
};

const campaignRoutes = [
  ["Plumbing calls", "/plumbing-ai-receptionist", "Missed emergency calls, drains, water heaters, and service requests."],
  ["HVAC calls", "/hvac-ai-receptionist", "Seasonal demand spikes, after-hours service, and replacement inquiries."],
  ["Roofing follow-up", "/roofing-estimate-follow-up", "Storm leads, inspections, open estimates, and homeowner reminders."],
  ["Estimator bottleneck", "/ai-estimator", "Photo intake, scope notes, quote packets, and follow-up."],
  ["Contractor bidding", "/contractor-bid-assistant", "Bid fit, requirements, deadlines, and prep checklists."],
] as const;

function OfferCard({ offer, index }: { offer: AiEmployeeOffer; index: number }) {
  const Icon = iconMap[offer.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.04 }}
      className="group h-full"
    >
      <Link
        href={offer.route}
        className="glass block h-full rounded-2xl p-7 transition-transform duration-300 hover:-translate-y-1"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/15">
            <Icon className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
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
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="mx-auto max-w-4xl text-center"
            >
              <span className="mb-5 inline-flex rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                AI employees for revenue leaks
              </span>
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Start with the AI employee most likely to <span className="gradient-text">make you money</span>.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                247ROI builds managed AI employees around specific business pains: missed calls, slow follow-up,
                estimating bottlenecks, bid prep, takeoffs, and content. One role first. Prove ROI. Then expand.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <a href={AI_RECEPTIONIST_CTA_PHONE_HREF}>Call the Demo Line</a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]"
                >
                  <Link href="/#contact">Get Workflow Map</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">AI employee roles</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                Pick the first bottleneck to remove
              </h2>
              <p className="mt-4 text-muted-foreground">
                Start with the role closest to revenue: answering faster, following up harder, quoting sooner, or
                preparing more profitable jobs.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {AI_EMPLOYEE_OFFERS.map((offer, index) => (
                <OfferCard key={offer.slug} offer={offer} index={index} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
              {[
                ["1", "Pick the first role", "Choose the employee tied to your clearest revenue leak, not the trendiest automation."],
                ["2", "Build around the workflow", "Map tools, scripts, handoffs, approvals, and scorecard metrics before launch."],
                ["3", "Expand only after proof", "Stack the next employee after the first one captures revenue or removes measurable labor."],
              ].map(([number, title, body]) => (
                <div key={number} className="glass rounded-2xl p-8">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                    {number}
                  </div>
                  <h3 className="mb-3 font-display text-xl font-bold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Campaign routes</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                Pick the page that matches the conversation
              </h2>
              <p className="mt-4 text-muted-foreground">
                The tighter the page matches the buyer&apos;s immediate problem, the less work the prospect has to do.
              </p>
            </div>
            <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-5">
              {campaignRoutes.map(([title, href, body]) => (
                <Link key={href} href={href} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-transform hover:-translate-y-1">
                  <h3 className="mb-3 flex items-center gap-2 font-display text-base font-bold">
                    {title}
                    <ArrowRight className="h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </Link>
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
