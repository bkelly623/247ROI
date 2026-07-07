"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Phone,
  RefreshCw,
  Star,
  XCircle,
} from "lucide-react";
import type { AuditReport, GoogleLocalProbe, ScanSession } from "@/lib/audit/types";
import { IndustryPulse } from "@/components/audit/IndustryPulse";
import { SiteBlueprint } from "@/components/audit/SiteBlueprint";
import { GrowthSimulator } from "@/components/audit/GrowthSimulator";
import { SectionScores } from "@/components/audit/SectionScores";
import { PageSpeedVitals } from "@/components/audit/PageSpeedVitals";
import { ScoreRing } from "@/components/audit/ScoreRing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "@/lib/audit/config";

function DataSourceStrip({ report }: { report: AuditReport }) {
  const meta = report.auditMeta;
  if (!meta) return null;

  const items = [
    { ok: meta.dataSources.siteCrawl, label: "Site Crawl" },
    { ok: meta.dataSources.pageSpeed, label: "Lighthouse" },
    { ok: meta.dataSources.googleSearch, label: "Google Rankings" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
            item.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-zinc-700 bg-zinc-900 text-zinc-500"
          }`}
        >
          {item.ok ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          {item.label}
        </span>
      ))}
      {meta.dataSources.missing.length > 0 && (
        <span className="text-xs text-amber-400">
          Missing: {meta.dataSources.missing.join(", ")}
        </span>
      )}
    </div>
  );
}

function GoogleRankings({ googleLocal, businessName }: {
  googleLocal?: GoogleLocalProbe;
  businessName: string;
}) {
  if (!googleLocal) return null;

  const localBlock =
    googleLocal.blocks.find((b) => b.query.includes("near")) ??
    googleLocal.blocks[0];
  const organicBlock = googleLocal.blocks.find((b) => b.query.includes("best"));

  const showBlock = (
    title: string,
    block: { query: string; results: GoogleLocalProbe["primaryResults"] } | undefined
  ) => {
    if (!block) return null;
    const clientIn = block.results.some((r) => r.isClient);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-300">{title}</p>
          {clientIn ? (
            <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
              You appear
            </Badge>
          ) : (
            <Badge className="border-red-500/40 bg-red-500/10 text-red-400">
              Not visible
            </Badge>
          )}
        </div>
        {block.results.length === 0 ? (
          <p className="text-sm text-zinc-500">No results for this search.</p>
        ) : (
          <div className="space-y-1.5">
            {block.results.slice(0, 6).map((r) => (
              <div
                key={`${title}-${r.position}-${r.name}`}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                  r.isClient
                    ? "border-primary/50 bg-primary/10"
                    : "border-zinc-800 bg-zinc-900/40"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                    r.position <= 3
                      ? "bg-primary/20 text-primary"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {r.position}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {r.name}
                    {r.isClient && (
                      <span className="ml-2 text-xs text-primary">(you)</span>
                    )}
                  </p>
                  {r.address && (
                    <p className="truncate text-xs text-zinc-500">
                      {title.includes("Organic")
                        ? r.address.replace(/^https?:\/\//, "")
                        : r.address}
                    </p>
                  )}
                </div>
                {r.rating && (
                  <div className="flex items-center gap-0.5 text-xs text-amber-400">
                    <Star className="h-3 w-3 fill-current" />
                    {r.rating}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-zinc-800 glass-panel h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          Google Visibility
        </CardTitle>
        <p className="text-sm text-zinc-500">{googleLocal.summary}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!googleLocal.configured ? (
          <div className="rounded-xl border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-500">
            Add <code className="text-primary">SERPAPI_KEY</code> in Vercel, redeploy,
            then re-run audit.
          </div>
        ) : googleLocal.rawError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
            {googleLocal.rawError}
          </div>
        ) : (
          <>
            {showBlock("Local map pack search", localBlock)}
            {organicBlock && showBlock("Organic search", organicBlock)}
            {!localBlock?.results.some((r) => r.isClient) &&
              !(organicBlock?.results.some((r) => r.isClient)) && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center text-sm text-red-400">
                  {businessName} isn&apos;t showing where customers search — competitors
                  are capturing those clicks.
                </p>
              )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PriorityFixes({ deficits }: { deficits: AuditReport["deficits"] }) {
  const severityStyle = {
    critical: "border-red-500/30 bg-red-500/5",
    warning: "border-amber-500/30 bg-amber-500/5",
    info: "border-zinc-700 bg-zinc-900/50",
  };

  return (
    <Card className="border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          Priority Fixes
        </CardTitle>
        <p className="text-sm text-zinc-500">
          Ranked by impact on leads and AI visibility
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {deficits.slice(0, 6).map((d, i) => (
          <div
            key={i}
            className={`rounded-xl border p-4 ${severityStyle[d.severity]}`}
          >
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-100">{d.finding}</p>
                <p className="mt-1.5 text-sm text-emerald-400/90">→ {d.fix}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function BlueprintReport({
  session,
  report,
  variant = "present",
  sessionId,
  onRefresh,
  refreshing,
  onCtaClick,
}: {
  session: ScanSession;
  report: AuditReport;
  variant?: "present" | "report";
  sessionId: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  onCtaClick?: (action: string) => void;
}) {
  const isPresent = variant === "present";

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
              Infrastructure Blueprint
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
              {session.business_name}
            </h1>
            <p className="max-w-2xl text-lg text-zinc-400">
              {report.executiveSummary ?? report.opportunityHeadline}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
              <a
                href={session.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-primary"
              >
                {session.website_url.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-3 w-3" />
              </a>
              <span>·</span>
              <span>ZIP {session.zip_code}</span>
            </div>
            <DataSourceStrip report={report} />
          </div>
          <div className="shrink-0">
            <ScoreRing
              score={report.opportunityIndex}
              label="Infrastructure Readiness"
              sublabel={
                report.opportunityIndex < 50
                  ? "High upside if you act now"
                  : "Room to dominate your market"
              }
            />
          </div>
        </div>
      </section>

      {isPresent && <IndustryPulse compact />}

      <SectionScores sections={report.sections} compact={isPresent} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PageSpeedVitals report={report} />
        <GoogleRankings
          googleLocal={report.googleLocal}
          businessName={session.business_name}
        />
      </div>

      <SiteBlueprint
        businessName={session.business_name}
        websiteUrl={session.website_url}
        screenshotUrl={report.sitePreview.screenshotUrl}
        before={report.sitePreview.beforeAnnotations}
        after={report.sitePreview.afterAnnotations}
      />

      <PriorityFixes deficits={report.deficits} />

      <GrowthSimulator report={report} />

      {isPresent ? (
        <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Recommended first step
          </p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-50">
            Smart Site Foundation — from $99/mo
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-400">
            Fixes the infrastructure gaps measured above. Growth ($297) and AI
            Visibility ($497+) build on this foundation.
          </p>
          <Button size="lg" className="mt-6 h-14 px-8 text-lg" asChild>
            <a href={BRAND.phoneHref}>
              <Phone className="h-5 w-5" />
              {BRAND.phoneDisplay}
            </a>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-primary/30 bg-primary/10 text-primary">
                Start Here
              </Badge>
              <CardTitle>{report.packages.primary.headline}</CardTitle>
              <p className="text-sm text-zinc-400">
                {report.packages.primary.description}
              </p>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm font-medium text-emerald-400">
                Starting as low as $99/mo
              </p>
              <Button className="w-full" onClick={() => onCtaClick?.("primary")}>
                {report.packages.primary.ctaLabel}
              </Button>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-amber-500/30 bg-amber-500/10 text-amber-400">
                Phase Two
              </Badge>
              <CardTitle>{report.packages.secondary.headline}</CardTitle>
              <p className="text-sm text-zinc-400">
                {report.packages.secondary.description}
              </p>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400"
                onClick={() => onCtaClick?.("secondary")}
              >
                {report.packages.secondary.ctaLabel}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!isPresent && (
        <Card className="border-zinc-800">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left">
            <CheckCircle2 className="h-10 w-10 shrink-0 text-emerald-400" />
            <div className="flex-1">
              <p className="font-semibold text-zinc-100">
                Ready to capture the opportunity?
              </p>
              <p className="text-sm text-zinc-400">
                Call for a free fix plan walkthrough — no pressure.
              </p>
            </div>
            <Button size="lg" onClick={() => onCtaClick?.("call")}>
              <Phone className="h-4 w-4" />
              {BRAND.phoneDisplay}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function BlueprintReportHeader({
  session,
  sessionId,
  variant,
  onRefresh,
  refreshing,
}: {
  session: ScanSession;
  sessionId: string;
  variant: "present" | "report";
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur sm:px-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          247ROI · {variant === "present" ? "Meet Close Tool" : "Infrastructure Blueprint"}
        </p>
        <p className="text-lg font-semibold text-zinc-50">{session.business_name}</p>
      </div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Re-run audit
          </Button>
        )}
        {variant === "present" ? (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/report/${sessionId}`}>Full report</Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/present/${sessionId}`}>Screen share mode</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
