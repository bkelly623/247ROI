"use client";

import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import type { AuditReport, GrowthTier } from "@/lib/audit/types";
import { GROWTH_TIERS } from "@/lib/audit/industry-stats";

export function GrowthSimulator({ report }: { report: AuditReport }) {
  const tiers = report.growthTiers ?? GROWTH_TIERS;
  const [jobsPerMonth, setJobsPerMonth] = useState(12);
  const [avgJobValue, setAvgJobValue] = useState(4500);
  const [selectedTier, setSelectedTier] = useState<GrowthTier["id"]>("foundation");

  const baseAi = report.sections.find((s) => s.key === "ai")?.score ?? 0;
  const baseGoogle = report.googleLocal?.inMapPack
    ? 85
    : report.googleLocal?.clientPosition
      ? Math.max(20, 70 - (report.googleLocal.clientPosition ?? 10) * 12)
      : report.googleLocal?.configured
        ? 25
        : 0;

  const metrics = useMemo(() => {
    const tier =
      tiers.find((t) => t.id === selectedTier) ?? tiers[0];
    const aiScore = Math.min(95, baseAi + tier.lifts.aiMention);
    const googleScore = Math.min(95, baseGoogle + tier.lifts.googleRank * 8);
    const captureBoost = 1 + tier.lifts.leadCapture / 100;
    const projectedJobs = Math.round(jobsPerMonth * captureBoost);
    const addedJobs = projectedJobs - jobsPerMonth;
    const monthlyRevenue = projectedJobs * avgJobValue;
    const addedRevenue = addedJobs * avgJobValue;

    return {
      tier,
      aiScore,
      googleScore,
      projectedJobs,
      addedJobs,
      monthlyRevenue,
      addedRevenue,
    };
  }, [tiers, selectedTier, baseAi, baseGoogle, jobsPerMonth, avgJobValue]);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Growth Projection Simulator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Adjust inputs and packages to model where you could be in 90 days.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Jobs booked per month: {jobsPerMonth}
            </label>
            <Slider
              value={[jobsPerMonth]}
              onValueChange={([v]) => setJobsPerMonth(v)}
              min={4}
              max={40}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Avg job value: ${avgJobValue.toLocaleString()}
            </label>
            <Slider
              value={[avgJobValue]}
              onValueChange={([v]) => setAvgJobValue(v)}
              min={1500}
              max={15000}
              step={250}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tiers.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTier(t.id)}
              className={`rounded-lg border px-4 py-2 text-left transition ${
                selectedTier === t.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <p className="text-sm font-medium">{t.name}</p>
              <p className="text-xs text-primary">{t.priceLabel}</p>
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricBar label="AI Visibility" value={metrics.aiScore} color="emerald" />
          <MetricBar label="Google Standing" value={metrics.googleScore} color="blue" />
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Projected jobs/mo</p>
            <p className="text-2xl font-bold text-foreground">
              {metrics.projectedJobs}
            </p>
            {metrics.addedJobs > 0 && (
              <p className="text-xs text-emerald-400">
                +{metrics.addedJobs} vs today
              </p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Monthly revenue</p>
            <p className="text-2xl font-bold text-foreground">
              ${metrics.monthlyRevenue.toLocaleString()}
            </p>
            {metrics.addedRevenue > 0 && (
              <p className="text-xs text-emerald-400">
                +${metrics.addedRevenue.toLocaleString()} potential
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="mb-2 text-sm font-medium">
            {metrics.tier.name} — {metrics.tier.priceLabel}
          </p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {metrics.tier.features.map((f) => (
              <li key={f} className="text-xs text-muted-foreground">
                ✓ {f}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "emerald" | "blue";
}) {
  const bar =
    color === "emerald" ? "bg-emerald-500" : "bg-blue-500";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Badge variant="outline" className="text-xs">
          {value}%
        </Badge>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
