"use client";

import type { AuditReport } from "@/lib/audit/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge } from "lucide-react";

function ScoreGauge({
  label,
  value,
  target,
}: {
  label: string;
  value: number | null | undefined;
  target?: string;
}) {
  const score = value ?? null;
  const color =
    score === null
      ? "#52525b"
      : score >= 90
        ? "#22c55e"
        : score >= 50
          ? "#f59e0b"
          : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="#27272a"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${score !== null ? (score / 100) * 97.4 : 0} 97.4`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-zinc-50">
          {score !== null ? score : "—"}
        </div>
      </div>
      <p className="text-xs font-medium text-zinc-300">{label}</p>
      {target && (
        <p className="text-[10px] text-zinc-500">{target}</p>
      )}
    </div>
  );
}

export function PageSpeedVitals({ report }: { report: AuditReport }) {
  const ps = report.auditMeta?.pageSpeed;
  const error = report.auditMeta?.apiErrors?.pageSpeed;
  const keyMissing = report.auditMeta?.dataSources.missing.some((m) =>
    m.includes("PAGESPEED")
  );

  return (
    <Card className="border-zinc-800 glass-panel h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-5 w-5 text-primary" />
          Google Lighthouse
        </CardTitle>
        <p className="text-sm text-zinc-500">Mobile performance & SEO scores</p>
      </CardHeader>
      <CardContent>
        {keyMissing ? (
          <div className="rounded-xl border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-500">
            Add <code className="text-primary">GOOGLE_PAGESPEED_API_KEY</code> in
            Vercel, then re-run audit.
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
            {error}
          </div>
        ) : !ps ? (
          <p className="text-sm text-zinc-500">No Lighthouse data returned.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ScoreGauge label="Performance" value={ps.performanceScore} />
              <ScoreGauge label="SEO" value={ps.seoScore} target="Target 90+" />
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-4 text-center">
              <div>
                <p className="text-lg font-semibold text-zinc-100">
                  {ps.lcpSeconds != null ? `${ps.lcpSeconds.toFixed(1)}s` : "—"}
                </p>
                <p className="text-[10px] uppercase text-zinc-500">LCP</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-100">
                  {ps.cls != null ? ps.cls.toFixed(3) : "—"}
                </p>
                <p className="text-[10px] uppercase text-zinc-500">CLS</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-100">
                  {ps.fcpSeconds != null ? `${ps.fcpSeconds.toFixed(1)}s` : "—"}
                </p>
                <p className="text-[10px] uppercase text-zinc-500">FCP</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
