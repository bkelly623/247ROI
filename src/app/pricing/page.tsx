import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "AI Employee Pricing | 247ROI",
  description:
    "Pricing expectations for 247ROI AI employees: audit-first custom builds for service-business workflows, follow-up, estimating, bidding, and operations.",
};

const plans = [
  {
    name: "Audit",
    price: "First decision",
    body: "For deciding which AI employee deserves to exist before committing to a system.",
    bullets: ["Workflow diagnosis", "Role recommendation", "Approval boundaries", "Scorecard definition"],
  },
  {
    name: "First Employee",
    price: "$750-$2,500/mo",
    body: "For one constrained AI employee built around a real workflow and measured weekly.",
    bullets: ["One AI job role", "Scripts and handoffs", "Tool/workflow setup", "Weekly performance scorecard"],
  },
  {
    name: "AI Department",
    price: "After proof",
    body: "For businesses ready to stack multiple AI employees after the first role proves ROI.",
    bullets: ["Multiple roles", "Shared operating rules", "Cross-workflow reporting", "Ongoing optimization"],
  },
];

const pricingRules = [
  ["Lower scope", "Follow-up, receptionist, reminders, simple inbox triage, and other narrow roles with clean handoffs."],
  ["Higher scope", "Estimator, bid, takeoff, multi-tool, or document-heavy roles that need deeper workflow setup."],
  ["Build fee", "Quoted after audit when the setup effort is clear. Qualified pilots may reduce or defer setup to prove value first."],
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 md:pt-32">
        <section className="relative overflow-hidden border-b border-border/40 pb-16 md:pb-20">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/15 via-transparent to-transparent pointer-events-none" />
          <div className="container relative z-10 mx-auto px-6 text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</span>
            <h1 className="mx-auto mt-4 max-w-4xl font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              If the AI employee cannot pay for itself, it should not be hired.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              Pricing follows the role, not a generic software tier. Narrow follow-up and receptionist employees price
              lower. Estimating, bidding, and document-heavy employees price higher because the job spec, integrations,
              and human approval rules matter more.
            </p>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.name} className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">{plan.name}</p>
                  <h2 className="mt-3 font-display text-3xl font-bold">{plan.price}</h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{plan.body}</p>
                  <div className="mt-6 space-y-3">
                    {plan.bullets.map((bullet) => (
                      <div key={bullet} className="flex gap-3 text-sm text-foreground/85">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        {bullet}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-primary/25 bg-primary/10 p-8 text-center">
              <h2 className="font-display text-2xl font-bold">What changes the price</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                A receptionist, estimator assistant, and bid assistant are not the same hire. The audit ties price to the
                first role, the systems involved, and the evidence that proves the employee is working.
              </p>
              <div className="mt-7 grid gap-3 text-left md:grid-cols-3">
                {pricingRules.map(([label, body]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-background/35 p-4">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
              <Button asChild size="lg" className="mt-7 rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                <Link href="/contact">
                  Find My First AI Employee <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
