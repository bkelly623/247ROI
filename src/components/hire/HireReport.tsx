"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  MonitorSmartphone,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HireProposal, HireSession } from "@/lib/hire/types";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";

export function HireReport({
  session,
  proposal,
}: {
  session: HireSession;
  proposal: HireProposal;
}) {
  const primary = session.discovery.pains[0];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-4 animate-fade-in">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
          Hire packet unlocked
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          Meet {proposal.employeeName}
        </h1>
        <p className="max-w-2xl text-lg text-zinc-400">{proposal.tagline}</p>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3">
            <p className="text-xs text-orange-300/80">Hours back / week</p>
            <p className="font-display text-2xl font-bold text-orange-200">
              {proposal.hoursSavedPerWeek.low}–{proposal.hoursSavedPerWeek.high}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs text-zinc-500">Per month</p>
            <p className="font-display text-2xl font-bold text-zinc-100">
              {proposal.monthlyHoursSaved.low}–{proposal.monthlyHoursSaved.high} hrs
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs text-zinc-500">Fit score</p>
            <p className="font-display text-2xl font-bold text-zinc-100">
              {proposal.fitScore}/100
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-6">
        <div className="mb-3 flex items-center gap-2 text-orange-300">
          <HeartHandshake className="h-5 w-5" />
          <h2 className="font-display text-lg font-semibold">The relief</h2>
        </div>
        <p className="text-zinc-300">{proposal.emotionalPayoff}</p>
      </section>

      {primary && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-300">
            <Clock3 className="h-5 w-5 text-orange-400" />
            <h2 className="font-display text-lg font-semibold">What we diagnosed</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
            <p className="font-medium text-zinc-200">{primary.title}</p>
            <p className="mt-2">{primary.rawDescription}</p>
            {primary.time.computedHoursPerWeek != null && (
              <p className="mt-3 text-orange-300/90">
                Verified desk load ≈ {primary.time.computedHoursPerWeek} hrs/week
                {primary.time.underestimationNote
                  ? ` — ${primary.time.underestimationNote}`
                  : ""}
              </p>
            )}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-zinc-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <h2 className="font-display text-lg font-semibold">Problems this kills</h2>
        </div>
        <ul className="space-y-2">
          {proposal.problemsSolved.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-zinc-300">
          <Workflow className="h-5 w-5 text-sky-400" />
          <h2 className="font-display text-lg font-semibold">Job description A→Z</h2>
        </div>
        <ol className="space-y-2">
          {proposal.jobFromAtoZ.map((step, i) => (
            <li
              key={`${i}-${step}`}
              className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300"
            >
              <span className="font-display text-orange-400">{String(i + 1).padStart(2, "0")}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-zinc-300">
          <MonitorSmartphone className="h-5 w-5 text-violet-300" />
          <h2 className="font-display text-lg font-semibold">How you use it</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Interface", proposal.howTheyUseIt.interface],
            ["Daily loop", proposal.howTheyUseIt.dailyLoop],
            ["Your approvals", proposal.howTheyUseIt.approvals],
            ["Handoffs", proposal.howTheyUseIt.humanHandoffs],
          ].map(([label, body]) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
              <p className="mt-2 text-sm text-zinc-300">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-2 flex items-center gap-2 text-orange-300">
          <Sparkles className="h-5 w-5" />
          <h2 className="font-display text-lg font-semibold">Why this hire first</h2>
        </div>
        <p className="text-zinc-300">{proposal.whyThisFirst}</p>
        <p className="mt-3 text-sm text-zinc-500">{proposal.implementationSketch}</p>
        {proposal.secondaryOpportunity && (
          <p className="mt-3 text-sm text-zinc-400">
            Roadmap hire #2: {proposal.secondaryOpportunity}
          </p>
        )}
        <p className="mt-3 text-xs text-zinc-600">{proposal.fitNotes}</p>
      </section>

      <section className="rounded-2xl border border-orange-500/25 bg-orange-500/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
          Optional next audit
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold text-zinc-50">
          Want a revenue pass next?
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          After the AI employee, we can rank lead-gen and digital presence —
          missed-call recovery, website, AI visibility, reviews — by fastest
          path to more profit.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 flex-1 font-semibold">
            <a href={PRIMARY_PHONE_HREF}>
              Yes — walk me through it
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 flex-1 border-white/15">
            <Link href="/calendar">Book a strategy call</Link>
          </Button>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="h-12 flex-1 font-semibold">
          <a href={PRIMARY_PHONE_HREF}>
            Call / text {PRIMARY_PHONE_DISPLAY}
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 flex-1 border-white/15">
          <Link href="/calendar">{proposal.ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
