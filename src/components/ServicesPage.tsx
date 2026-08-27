"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ClipboardCheck, DatabaseZap, FileSearch, PanelsTopLeft, Workflow, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { HERO_PRIMARY_CTA_LABEL } from "@/app/components/cta";

const lanes = [
  {
    title: "Custom workflow automations",
    icon: Zap,
    body: "Automations for recurring computer work: moving data, preparing documents, routing approvals, updating records, and triggering next steps.",
    examples: ["Data handoff automation", "Document workflow", "Approval routing"],
  },
  {
    title: "Custom dashboards",
    icon: DatabaseZap,
    body: "Dashboards that pull scattered data from apps, spreadsheets, CRMs, forms, and team updates into one useful operating view.",
    examples: ["Owner dashboard", "Job status view", "Revenue and ops tracker"],
  },
  {
    title: "Internal apps and portals",
    icon: PanelsTopLeft,
    body: "Simple custom apps for the workflows generic software does not handle cleanly: intake, review, approvals, tracking, and reporting.",
    examples: ["Review portal", "Workflow hub", "Client or team app"],
  },
  {
    title: "Research and decision support",
    icon: FileSearch,
    body: "Market research, vendor comparison, bid review, requirement extraction, fit scoring, and briefing workflows.",
    examples: ["Research agent", "Bid assistant", "Decision brief"],
  },
  {
    title: "AI agents for business work",
    icon: ClipboardCheck,
    body: "Constrained AI agents that prepare summaries, drafts, reports, research, records, and handoffs while humans keep approval authority.",
    examples: ["Admin agent", "Reporting agent", "Ops coordinator"],
  },
];

const process = [
  ["Map", "We inspect the workflow and identify where time, money, data, handoffs, or visibility are leaking."],
  ["Design", "We define the system: rules, inputs, approvals, tools, outputs, and what success looks like."],
  ["Build", "We create the automations, dashboards, internal apps, AI agents, integrations, and handoff formats."],
  ["Improve", "We review the output, tighten the rules, and expand only when the workflow gets cleaner."],
];

const servicePages = [
  {
    title: "AI automation consultant for small business",
    href: "/ai-automation-consultant-small-business",
    body: "For owners who know repeated computer work is wasting time but need help deciding what AI should touch first.",
  },
  {
    title: "Business process automation consultant",
    href: "/business-process-automation-consultant",
    body: "For workflows where data, documents, approvals, and next steps keep moving by copy, paste, and memory.",
  },
  {
    title: "Workflow automation consultant",
    href: "/workflow-automation-consultant",
    body: "For businesses where repeated work crosses inboxes, spreadsheets, apps, approvals, and follow-up.",
  },
  {
    title: "Custom AI agents for business",
    href: "/ai-agents-for-business",
    body: "For defined jobs such as inbox triage, reporting, CRM updates, research, drafting, and follow-up.",
  },
  {
    title: "Custom business dashboard",
    href: "/custom-business-dashboard",
    body: "For owners who need one operating view instead of reports rebuilt from scattered tools every week.",
  },
  {
    title: "Internal tools for small business",
    href: "/internal-tools-for-small-business",
    body: "For teams that have outgrown spreadsheet workarounds and need focused workflow software.",
  },
  {
    title: "Generative engine optimization consultant",
    href: "/generative-engine-optimization-consultant",
    body: "For businesses that want clearer entity signals, answer-ready pages, schema, citations, and AI visibility checks.",
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 md:pt-32">
        <section className="relative overflow-hidden border-b border-border/40 pb-16 md:pb-20">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/15 via-transparent to-transparent pointer-events-none" />
          <div className="container relative z-10 mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mx-auto max-w-4xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Services</span>
              <h1 className="mx-auto mt-4 max-w-4xl font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Business systems built with AI agents, automation, and custom software.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                247ROI builds custom automations, dashboards, internal apps, and AI agents around the work already
                happening across your software, spreadsheets, inboxes, documents, and team memory.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href="/hire">{HERO_PRIMARY_CTA_LABEL}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/15 bg-white/[0.03] px-8 text-foreground hover:bg-white/[0.07]">
                  <Link href="/demo">See Example Workflows</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-5 lg:grid-cols-5">
              {lanes.map((lane, index) => {
                const Icon = lane.icon;
                return (
                  <motion.div key={lane.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: index * 0.04 }} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                    <Icon className="mb-5 h-7 w-7 text-primary" aria-hidden />
                    <h2 className="font-display text-xl font-bold">{lane.title}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{lane.body}</p>
                    <div className="mt-5 space-y-2">
                      {lane.examples.map((example) => (
                        <div key={example} className="flex items-center gap-2 text-sm text-foreground/85">
                          <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
                          {example}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Delivery model</span>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">The business system comes before the tool.</h2>
                <p className="mt-4 text-muted-foreground">
                  If the workflow cannot be described, controlled, and handed off, it is not ready for reliable AI or
                  automation. We make the work visible first, then build the right layer around it.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {process.map(([title, body], index) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">{index + 1}</div>
                    <h3 className="font-display text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-5xl rounded-3xl border border-primary/25 bg-primary/10 p-8 sm:p-12">
              <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr] lg:items-center">
                <div className="flex items-center gap-4">
                  <Workflow className="h-10 w-10 text-primary" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary">Decision rule</p>
                    <h2 className="font-display text-2xl font-bold">One valuable system first.</h2>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  The fastest route is not automating everything. It is choosing one bottleneck, building the practical
                  system that makes it easier to run, then expanding into automations, dashboards, apps, AI agents, and
                  physical automation when the first system has earned trust.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/40 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Focused service pages</span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                Different bottlenecks need different build paths.
              </h2>
              <p className="mt-4 text-muted-foreground">
                These pages break down the common entry points for owners comparing AI, automation, dashboards,
                internal tools, and AI visibility work.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {servicePages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition-colors hover:border-primary/40 hover:bg-primary/10"
                >
                  <h3 className="font-display text-xl font-bold">{page.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{page.body}</p>
                  <span className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
                    Read page <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <CTA />
      </main>

      <Footer />
    </div>
  );
}
