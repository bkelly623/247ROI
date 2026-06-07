import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, Phone, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";

export const metadata: Metadata = {
  title: "Find Your First AI Employee | 247ROI",
  description:
    "Find the first AI employee worth building with 247ROI. Identify the workflow, human approval points, scorecard, and launch path before anything goes live.",
};

const auditOutputs = [
  "Recommended first AI employee",
  "Workflow triggers and inputs",
  "Human approval points",
  "Weekly scorecard",
  "Launch path and pricing fit",
];

const briefPrompts = [
  "What work keeps getting delayed, missed, or repeated?",
  "Where does a lead, estimate, bid, message, or handoff stall?",
  "Who approves final pricing, bids, exceptions, or sensitive replies?",
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 md:pt-32">
        <section className="relative overflow-hidden border-b border-border/40 pb-16 md:pb-20">
          <div className="absolute inset-0 hero-gradient" />
          <div className="container relative z-10 mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.82fr] lg:items-center">
              <div>
                <span className="mb-5 inline-flex rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  AI employee audit
                </span>
                <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  Bring the bottleneck. We will decide if an AI employee deserves the job.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  This is not a demo trap. It is a practical diagnosis of one workflow: the role, the handoffs, the risks,
                  the human approvals, and the numbers that prove whether the employee should exist.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                    <a href={PRIMARY_PHONE_HREF}>
                      <Phone className="mr-2 h-4 w-4" aria-hidden />
                      Call {PRIMARY_PHONE_DISPLAY}
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]">
                    <a href="mailto:contact@247roi.com?subject=AI%20Employee%20Audit">
                      <Mail className="mr-2 h-4 w-4" aria-hidden />
                      Email contact@247roi.com
                    </a>
                  </Button>
                </div>
                <p className="mt-5 text-sm text-muted-foreground">
                  Best first message: “I want an AI employee for [workflow]. Right now it breaks when [specific failure].”
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">Audit output</p>
                <h2 className="mt-3 font-display text-2xl font-bold">What gets decided before anything is built</h2>
                <div className="mt-6 space-y-3">
                  {auditOutputs.map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-background/40 p-4">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                      <p className="text-sm font-medium text-foreground/90">{item}</p>
                    </div>
                  ))}
                </div>
                <Link href="/pricing" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">
                  View pricing expectations <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-16 md:py-20">
          <div className="container mx-auto px-6">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Audit brief</span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Messy is useful. Vague is not.</h2>
                <p className="mt-4 text-muted-foreground">
                  The best audit conversations start with the real bottleneck: screenshots, notes, missed calls, stale
                  estimates, awkward handoffs, and the work your team keeps postponing.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {briefPrompts.map((prompt) => (
                  <div key={prompt} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                    <p className="text-sm leading-relaxed text-foreground/85">{prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
