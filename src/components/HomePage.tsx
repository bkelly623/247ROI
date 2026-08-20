"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  Gauge,
  Mail,
  Network,
  Phone,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { HERO_PRIMARY_CTA_LABEL, PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";

const problems = [
  "The same computer work gets repeated every week.",
  "Important data is scattered across apps, spreadsheets, inboxes, and memory.",
  "Owners and managers chase updates instead of seeing one clear operating picture.",
  "Useful work gets stuck because the system depends on one overloaded person.",
];

const systemWork = [
  {
    icon: SearchCheck,
    title: "Audit the workflow",
    body: "We look at how work really moves across people, software, documents, inboxes, and approvals.",
  },
  {
    icon: ClipboardList,
    title: "Choose the right system",
    body: "Some problems need automation. Some need an AI agent. Some need a cleaner process before either will work.",
  },
  {
    icon: Network,
    title: "Build the working layer",
    body: "We connect apps, data, dashboards, AI agents, automations, and human review points into one practical workflow.",
  },
  {
    icon: Gauge,
    title: "Improve what works",
    body: "We measure the output, tighten the rules, and expand only when the system is saving time or creating ROI.",
  },
];

const examples = [
  "A custom dashboard that pulls scattered numbers into one clear operating view.",
  "A workflow automation that moves data between tools instead of making the team copy and paste.",
  "A custom internal app that gives owners one place to review jobs, tasks, approvals, and next steps.",
  "An AI agent that prepares summaries, drafts, research, reports, or handoffs for a human to approve.",
];

const trustItems = [
  "Start with one bottleneck worth fixing before expanding into a larger operating system.",
  "Use the software, apps, documents, and data the business already depends on where possible.",
  "Keep human approval in place for pricing, sensitive decisions, exceptions, and judgment calls.",
  "Deliver visible work product: dashboards, queues, reports, apps, drafts, summaries, and handoff notes.",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-zinc-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,106,0,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
          <div className="container relative z-10 mx-auto px-5 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-36 lg:pt-40">
            <div className="grid gap-12 lg:grid-cols-[0.98fr_0.82fr] lg:items-center">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="max-w-3xl"
              >
                <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Brendan Kelly / Business Systems & AI Consultant
                </p>
                <h1 className="mt-6 max-w-4xl font-display text-4xl font-bold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
                  Build better business systems with AI, automation, and custom software.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
                  247ROI helps owners and operators find the bottlenecks worth fixing first - then builds practical
                  systems that save time and create ROI.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="min-h-[3.5rem] rounded-full bg-orange-500 px-7 font-semibold text-white hover:bg-orange-600"
                  >
                    <Link href="/hire">
                      {HERO_PRIMARY_CTA_LABEL} <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="min-h-[3.5rem] rounded-full border-white/15 bg-white/[0.04] px-7 text-white hover:bg-white/[0.09]"
                  >
                    <a href={PRIMARY_PHONE_HREF}>
                      <Phone className="mr-2 h-4 w-4" aria-hidden />
                      {PRIMARY_PHONE_DISPLAY}
                    </a>
                  </Button>
                </div>
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-zinc-400">
                  Custom automations, AI agents, dashboards, and internal apps for the work currently trapped across
                  software, spreadsheets, inboxes, and memory.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]"
              >
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">First step</p>
                    <h2 className="mt-2 font-display text-2xl font-bold text-white">Find the first system worth improving.</h2>
                  </div>
                  <BriefcaseBusiness className="h-8 w-8 text-orange-400" aria-hidden />
                </div>
                <div className="space-y-3 py-5">
                  {problems.map((problem) => (
                    <div key={problem} className="flex gap-3 rounded-2xl border border-white/10 bg-zinc-950/55 p-4">
                      <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" aria-hidden />
                      <p className="text-sm leading-relaxed text-zinc-200">{problem}</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50">
                  <Image
                    src="/images/ai-employee-ops-dashboard.svg"
                    alt="Example 247ROI workflow dashboard"
                    width={1200}
                    height={800}
                    className="h-auto w-full"
                    priority
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="border-b border-zinc-200 bg-white py-14">
          <div className="container mx-auto px-5 sm:px-6">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                ["Business systems", "We start by understanding how work gets done, where it breaks, and what outcome matters."],
                ["Automation", "We automate valuable computer work: data movement, document steps, approvals, reminders, and handoffs."],
                ["Dashboards & apps", "We build simple internal tools that unify scattered data and make the next action visible."],
                ["AI agents", "We build constrained digital workers for research, triage, drafting, reporting, and prepared work."],
              ].map(([title, body]) => (
                <div key={title} className="border-l-2 border-orange-500 pl-5">
                  <h2 className="font-display text-2xl font-bold">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-zinc-200 bg-zinc-50 py-20">
          <div className="container mx-auto px-5 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">What 247ROI builds</p>
                <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
                  We build business systems for the work that lives between people, software, and decisions.
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-zinc-600">
                  The tools can include AI agents, automations, custom software, dashboards, prompts, SOPs, and human
                  approval steps. The point is not the tool. The point is cleaner operations, useful visibility, and less
                  work trapped inside scattered software or someone&apos;s head.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {systemWork.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                      <Icon className="h-6 w-6 text-orange-600" aria-hidden />
                      <h3 className="mt-5 font-display text-xl font-bold">{item.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{item.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-zinc-800 bg-zinc-950 py-20 text-white">
          <div className="container mx-auto px-5 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">Plain buyer language</p>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
                If work keeps getting delayed, dropped, rewritten, or chased, there is probably a system problem.
              </h2>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
              {examples.map((example) => (
                <div key={example} className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
                  <FileText className="mb-5 h-6 w-6 text-orange-400" aria-hidden />
                  <p className="text-base leading-relaxed text-zinc-200">{example}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-zinc-200 bg-white py-20">
          <div className="container mx-auto px-5 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">How we earn trust</p>
                <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
                  No magic pitch. No black box.
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-zinc-600">
                  Every build starts with a real workflow, a clear owner, and a visible output. The goal is a system the
                  business can trust because it makes the work easier to see, run, and improve.
                </p>
              </div>
              <div className="space-y-4">
                {trustItems.map((item) => (
                  <div key={item} className="flex gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-5">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" aria-hidden />
                    <p className="leading-relaxed text-zinc-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="bg-zinc-50 py-20">
          <div className="container mx-auto px-5 sm:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Start here</p>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
                Bring one messy workflow. Leave with a clearer next step.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600">
                The AI Opportunity Map looks for the first process worth improving, what AI, automation, a dashboard, or
                a custom app should handle, what should stay human, and what a practical first build would need.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="min-h-[3.5rem] rounded-full bg-orange-500 px-8 font-semibold text-white hover:bg-orange-600"
                >
                  <Link href="/hire">{HERO_PRIMARY_CTA_LABEL}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="min-h-[3.5rem] rounded-full border-zinc-300 bg-white px-8 text-zinc-950 hover:bg-zinc-100"
                >
                  <a href="mailto:contact@247roi.com">
                    <Mail className="mr-2 h-4 w-4" aria-hidden />
                    contact@247roi.com
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
