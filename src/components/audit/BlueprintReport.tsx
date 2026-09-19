"use client";

import Link from "next/link";
import { ReportEmail } from "@/components/audit/ReportEmail";
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
import { SiteBlueprint } from "@/components/audit/SiteBlueprint";
import { SectionScores } from "@/components/audit/SectionScores";
import { PageSpeedVitals } from "@/components/audit/PageSpeedVitals";
import { inferServiceFromName } from "@/lib/audit/infer-service";
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
    { ok: meta.dataSources.googleSearch, label: "Google Search Samples" },
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
          Some checks were unavailable; see measurement limits below.
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
    googleLocal.blocks.find((b) => b.type === "local" || (!b.type && b.query.includes("near"))) ??
    googleLocal.blocks.find((b) => !b.type);
  const organicBlock = googleLocal.blocks.find((b) => b.type === "organic" || (!b.type && b.query.includes("best")));

  const showBlock = (
    title: string,
    block: GoogleLocalProbe["blocks"][number] | undefined
  ) => {
    if (!block) return null;
    const clientIn = block.results.some((r) => r.isClient);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-300">{title}</p>
          {clientIn ? (
            <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
              Matched in sample
            </Badge>
          ) : (
            <Badge className="border-red-500/40 bg-red-500/10 text-red-400">
              {block.results.length ? "Not found in sample" : "Unmeasured"}
            </Badge>
          )}
        </div>
        <p className="break-words text-sm text-zinc-300">Query: “{block.query}”</p>
        <p className="text-xs text-zinc-500">
          {block.source === "places" ? "Places discovery order — not a Google ranking" : block.source === "serpapi" ? "SerpAPI search snapshot" : "Legacy sample — source not retained"}
          {block.location ? ` · ${block.location}` : " · location not retained"}
          {block.observedAt ? ` · ${block.observedAt}` : " · capture time not retained"}
          {` · ${block.results.length} returned results`}
        </p>
        {block.results.length === 0 ? (
          <p className="text-sm text-zinc-500">No usable results returned; this does not establish absence.</p>
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
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm text-zinc-400">
          <p className="font-medium text-zinc-200">Keywords & improvement opportunities</p>
          <p className="mt-2">These are audit-generated test queries, not a verified list of keywords your website targets. Confirm the service and geography before using them as SEO targets.</p>
          <p className="mt-2">{organicBlock?.source === "serpapi" && organicBlock.results.some((r) => r.isClient)
            ? `Your site appears at organic position ${organicBlock.results.find((r) => r.isClient)?.position} in the returned sample. Review the matched page against this exact query before changing its title, service detail or internal links.`
            : "No unbranded organic ranking is established by this sample. Confirm relevant target queries and collect dated organic samples before prioritizing new content."}</p>
          <p className="mt-2 text-xs">Search volume, clicks, impressions, average position and traffic upside are not available in this report. Authorized Google Search Console query/page data is needed to identify high-impression, low-CTR or near-page-one opportunities; access to 247ROI does not authorize access to another business.</p>
          {/\b247\s*roi\b/i.test(businessName) && googleLocal.searchQueries.some((q) => /home services/i.test(q)) && (
            <p className="mt-2 text-amber-400">This saved report used an incorrect home-services query for 247ROI. Do not treat that sample as a relevant opportunity. A new audit must use AI business automation services; old observations have not been relabeled.</p>
          )}
        </div>
        {!googleLocal.configured ? (
          <div className="rounded-xl border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-500">
            Search collection is unavailable for this report. Rankings and keyword performance remain unmeasured.
          </div>
        ) : googleLocal.rawError && !googleLocal.blocks.length ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
            {googleLocal.rawError}
          </div>
        ) : (
          <>
            {googleLocal.rawError && <p className="text-sm text-amber-400">Collection was partial. Only the returned samples below are available.</p>}
            {showBlock(localBlock?.source === "places" ? "Places discovery" : "Local search sample", localBlock)}
            {googleLocal.blocks.filter(b => b.type === "organic").map((block, i) => <div key={`organic-${i}`}>{showBlock(block.query === businessName ? "Branded organic search" : "Unbranded organic search", block)}</div>)}
            {!localBlock?.results.some((r) => r.isClient) &&
              !googleLocal.blocks.some(b => b.results.some(r => r.isClient)) && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center text-sm text-red-400">
                  {businessName} was not matched in these returned samples. This does not establish overall rankings, lost clicks, or AI-answer visibility.
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
          Observed issues to review — traffic and lead impact not measured
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
                <p className="mt-1.5 text-sm text-emerald-400/90">Suggested: {d.fix}</p>
                <p className="mt-2 text-xs text-zinc-500">247ROI service fit: {d.category === "reputation" ? "Review & reputation workflows" : d.category === "social" ? "Content & profile consistency" : d.category === "ai" ? "AI visibility evidence & content review" : "Technical SEO & website optimization"}. Confirm scope before implementation.</p>
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
            <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-8 border-zinc-800 text-center">
              <span className="text-lg font-semibold text-zinc-100">Evidence first</span>
              <span className="px-3 text-xs text-zinc-400">No composite visibility score</span>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-400">
        <p>Service context: {inferServiceFromName(session.business_name).tradeLabel} — inferred from the name, not confirmed. ZIP is a sampling context, not proof of your full service area.</p>
        <p className="mt-2">Measured: available website checks and returned search samples. Suggested: fixes and service options. ChatGPT and Google AI Mode are unmeasured here; technical structure alone does not establish AI recommendations.</p>
      </div>

      <ReportEmail sessionId={sessionId} />
      <SectionScores sections={report.sections} compact={isPresent} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PageSpeedVitals report={report} />
        <GoogleRankings
          googleLocal={report.googleLocal}
          businessName={session.business_name}
        />
      </div>

      <p className="text-xs text-zinc-500">Website preview annotations are illustrative placements. Proposed changes below have not been deployed or measured.</p>
      {report.googleLocal?.aiOverviews?.map((sample, i) => (
        <Card key={`ai-overview-${i}`} className="border-zinc-800">
          <CardHeader><CardTitle>Google AI Overview — sampled evidence</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-400">
            <p>Query: “{sample.query}” · {sample.location} · {sample.observedAt} · SerpAPI</p>
            <p>{sample.state === "observed" ? "Answer observed in this organic search response. This is one sample, not an overall visibility score." : "No usable AI answer retained in this sample. This does not establish brand absence."}</p>
            {sample.answer && <p className="whitespace-pre-wrap text-zinc-200">{sample.answer}</p>}
            {sample.citations.map((citation, j) => <p key={j}><a href={/^https?:\/\//i.test(citation.url) ? citation.url : undefined} target="_blank" rel="noopener noreferrer" className="text-primary underline">{citation.title}</a></p>)}
          </CardContent>
        </Card>
      ))}
      <SiteBlueprint
        businessName={session.business_name}
        websiteUrl={session.website_url}
        screenshotUrl={report.sitePreview.screenshotUrl}
        before={report.sitePreview.beforeAnnotations}
        after={report.sitePreview.afterAnnotations}
      />

      <PriorityFixes deficits={report.deficits} />



      {isPresent ? (
        <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Recommended first step
          </p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-50">
            {report.packages.primary.headline}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-400">
            {report.packages.primary.description}
          </p>
          <Button size="lg" className="mt-6 h-14 px-8 text-lg" asChild>
            <a href={BRAND.phoneHref}>
              <Phone className="h-5 w-5" />
              {BRAND.phoneDisplay}
            </a>
          </Button>
          <div className="mt-4"><Link className="text-primary underline" href={`/ai-opportunity-audit?visibility=${encodeURIComponent(sessionId)}`}>Discuss your SEO and AI visibility priorities</Link></div>
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
              <p className="mb-4 text-sm font-medium text-emerald-400">Free quote after audit</p>
              <Button className="w-full" asChild>
                <a href={BRAND.phoneHref} onClick={() => onCtaClick?.("primary")}>
                  {report.packages.primary.ctaLabel}
                </a>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-amber-500/30 bg-amber-500/10 text-amber-400">
                Optional next step
              </Badge>
              <CardTitle>{report.packages.secondary.headline}</CardTitle>
              <p className="text-sm text-zinc-400">
                {report.packages.secondary.description}
              </p>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400"
                asChild
              >
                <a href={BRAND.schedulingUrl.startsWith("#") || BRAND.schedulingUrl === "/ai-opportunity-audit" ? `/ai-opportunity-audit?visibility=${encodeURIComponent(sessionId)}` : BRAND.schedulingUrl} onClick={() => onCtaClick?.("secondary")}>
                  {report.packages.secondary.ctaLabel}
                </a>
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
            <Button size="lg" asChild>
              <a href={BRAND.phoneHref} onClick={() => onCtaClick?.("call")}>
                <Phone className="h-4 w-4" />
                {BRAND.phoneDisplay}
              </a>
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
