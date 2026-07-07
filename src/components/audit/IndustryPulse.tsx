"use client";

import { TrendingDown, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INDUSTRY_STATS } from "@/lib/audit/industry-stats";

export function IndustryPulse({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        {INDUSTRY_STATS.slice(0, 3).map((stat) => (
          <div key={stat.label} className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-zinc-50">{stat.value}</span>
            <span className="text-xs text-zinc-500">{stat.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          The Shift Happening Right Now
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Google search is flattening. AI recommendations are exploding. Leads
          are moving to whoever AI can see and trust.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRY_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card/80 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                {stat.trend === "up" && (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                )}
                {stat.trend === "down" && (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                {stat.trend === "opportunity" && (
                  <Sparkles className="h-4 w-4 text-amber-400" />
                )}
              </div>
              <p className="mt-1 text-xs font-medium text-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
