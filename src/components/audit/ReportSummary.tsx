"use client";

import Link from "next/link";
import type { AuditReport, ScanSession } from "@/lib/audit/types";
import {
  buildReportPresentation,
  type PresentationCard,
  type ReportPresentation,
} from "@/lib/audit/report-presentation";

function MetricCard({
  card,
  tone,
  testId,
}: {
  card: PresentationCard;
  tone: "seo" | "ai";
  testId: string;
}) {
  const border =
    tone === "seo"
      ? "border-cyan-500/35 bg-cyan-500/5"
      : "border-violet-500/35 bg-violet-500/5";
  const labelColor = tone === "seo" ? "text-cyan-300" : "text-violet-300";

  return (
    <article
      data-testid={testId}
      className={`min-w-0 rounded-xl border p-4 sm:p-5 ${border}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide ${labelColor}`}>
        {card.label}
      </p>
      <p
        data-testid={`${testId}-value`}
        className="mt-2 break-words text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl"
      >
        {card.value}
      </p>
      <span className="mt-2 inline-block rounded border border-zinc-700 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
        {card.tag}
      </span>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{card.detail}</p>
      {card.supporting.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-zinc-500">
          {card.supporting.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function ReportSummary({
  session,
  report,
  sessionId,
  presentation: provided,
  onCtaClick,
}: {
  session: ScanSession;
  report: AuditReport;
  sessionId: string;
  presentation?: ReportPresentation;
  onCtaClick?: (action: string) => void;
}) {
  const presentation =
    provided ?? buildReportPresentation(session, report, sessionId);

  return (
    <section
      data-testid="report-summary"
      aria-labelledby="report-summary-headline"
      className="min-w-0 space-y-6 motion-safe:animate-fade-in"
    >
      <div className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
          247ROI · Your opportunity brief
        </p>
        <h1
          id="report-summary-headline"
          className="max-w-3xl text-balance text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl lg:text-4xl"
        >
          {presentation.headline}
        </h1>
        <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">{presentation.intro}</p>
        <p className="text-xs text-zinc-500">
          {presentation.businessName}
          {presentation.isLegacy ? " · Legacy report format" : ""} · {presentation.geographyNote}
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard card={presentation.seoCard} tone="seo" testId="report-seo-card" />
        <MetricCard card={presentation.aiCard} tone="ai" testId="report-ai-card" />
      </div>

      {presentation.findings.length > 0 && (
        <div data-testid="report-findings" className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Key findings
          </h2>
          <ul className="space-y-2 text-sm text-zinc-300">
            {presentation.findings.map((f) => (
              <li
                key={f}
                className="rounded-lg border-l-2 border-primary/60 bg-zinc-900/50 py-2 pl-3 pr-2"
              >
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {presentation.opportunities.length > 0 && (
        <div data-testid="report-opportunities" className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">Focused next moves</h2>
          <ol className="space-y-3">
            {presentation.opportunities.map((o, i) => (
              <li
                key={o.id}
                className="grid grid-cols-[2rem_1fr] gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-zinc-950">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-zinc-100">{o.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">{o.summary}</p>
                  {o.evidence && (
                    <p className="mt-2 text-xs text-zinc-500">{o.evidence}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div
        data-testid="report-consultation-cta"
        className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-transparent p-5 sm:p-6 print:hidden"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
          Recommended next step
        </p>
        <h2 className="mt-2 text-xl font-bold text-zinc-50 sm:text-2xl">
          Let’s choose the right next step
        </h2>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          Review priorities with 247ROI. This opens the opportunity conversation — nothing is booked until you continue.
        </p>
        <Link
          href={presentation.consultationHref}
          onClick={()=>onCtaClick?.("discuss_priorities")}
          data-testid="consultation-link"
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {presentation.consultationLabel}
        </Link>
      </div>

      {presentation.provenanceNotes.length > 0 && (
        <details className="text-xs text-zinc-400" data-testid="report-provenance">
          <summary className="cursor-pointer py-2">Scope and sources</summary>
          <p className="mt-2">{presentation.provenanceNotes.join(" ")}</p>
        </details>
      )}
    </section>
  );
}
