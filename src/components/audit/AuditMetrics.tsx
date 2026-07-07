"use client";

import type { AuditReport } from "@/lib/audit/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

export function AuditMetrics({ report }: { report: AuditReport }) {
  const meta = report.auditMeta;
  if (!meta) return null;

  const { dataSources, pageSpeed, technical, gbp } = meta;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base">Measured Data Sources</CardTitle>
        <p className="text-sm text-muted-foreground">
          {meta.note}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <SourceBadge ok={dataSources.siteCrawl} label="Site Crawl" />
          <SourceBadge ok={dataSources.pageSpeed} label="PageSpeed API" />
          <SourceBadge ok={dataSources.googleSearch} label="Google SerpAPI" />
        </div>

        {dataSources.missing.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-400">
            Missing API keys: {dataSources.missing.join(", ")} — add to Vercel
            for full audit accuracy.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pageSpeed && (
            <MetricBlock title="Lighthouse (Mobile)">
              <Row label="Performance" value={fmt(pageSpeed.performanceScore)} />
              <Row label="SEO" value={fmt(pageSpeed.seoScore)} />
              <Row label="LCP" value={pageSpeed.lcpSeconds ? `${pageSpeed.lcpSeconds.toFixed(1)}s` : "—"} />
              <Row label="CLS" value={pageSpeed.cls?.toFixed(3) ?? "—"} />
            </MetricBlock>
          )}

          {technical && (
            <MetricBlock title="Site Technical">
              <Row label="HTTP" value={String(technical.httpStatus ?? "—")} />
              <Row label="Word count" value={String(technical.contentWordCount)} />
              <Row label="Schema blocks" value={String(technical.schemaBlocks)} />
              <Row label="LocalBusiness" value={technical.hasLocalBusinessSchema ? "Yes" : "No"} />
              <Row label="Sitemap" value={technical.hasSitemap ? "Yes" : "No"} />
            </MetricBlock>
          )}

          {gbp?.found && (
            <MetricBlock title="Google Business Profile">
              <Row label="Rating" value={gbp.rating ? `${gbp.rating}★` : "—"} />
              <Row label="Reviews" value={String(gbp.reviewCount ?? "—")} />
              <Row label="Phone" value={gbp.phone ?? "—"} />
            </MetricBlock>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SourceBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={
        ok
          ? "border-emerald-500/40 text-emerald-400"
          : "border-zinc-600 text-zinc-500"
      }
    >
      {ok ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  );
}

function MetricBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function fmt(n: number | null | undefined) {
  return n !== null && n !== undefined ? `${n}/100` : "—";
}
