"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Phone } from "lucide-react";
import type { AuditReport, ScanSession } from "@/lib/audit/types";
import { IndustryPulse } from "@/components/audit/IndustryPulse";
import { SiteBlueprint } from "@/components/audit/SiteBlueprint";
import { GrowthSimulator } from "@/components/audit/GrowthSimulator";
import { SectionScores } from "@/components/audit/SectionScores";
import { AuditMetrics } from "@/components/audit/AuditMetrics";
import { GoogleLocalPanel } from "@/components/audit/GoogleLocalPanel";
import { ScoreRing } from "@/components/audit/ScoreRing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "@/lib/audit/config";

export function PresentView({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<ScanSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then(async (d) => {
        if (d.session?.report) {
          setSession(d.session);
          return;
        }
        setRunning(true);
        const runRes = await fetch(`/api/sessions/${sessionId}/run`, {
          method: "POST",
        });
        const runData = await runRes.json();
        if (!runRes.ok) throw new Error(runData.error || "Audit failed");
        setSession({ ...d.session, report: runData.report });
      })
      .catch((e) => setError(e.message))
      .finally(() => {
        setLoading(false);
        setRunning(false);
      });
  }, [sessionId]);

  if (loading || running) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-zinc-400">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p>{running ? "Running full infrastructure audit..." : "Loading..."}</p>
        <p className="text-xs text-zinc-600">
          PageSpeed · Google · Site crawl · Schema analysis
        </p>
      </div>
    );
  }

  if (error || !session?.report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950">
        <p className="text-red-400">{error || "Audit failed"}</p>
        <Button asChild>
          <Link href="/audit">Try Again</Link>
        </Button>
      </div>
    );
  }

  const report: AuditReport = session.report;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            247ROI · Meet Close Tool
          </p>
          <p className="text-lg font-semibold">{session.business_name}</p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href={`/report/${sessionId}`}>Full Report</Link>
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <IndustryPulse />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <Card className="border-zinc-800 lg:w-56">
              <CardContent className="flex flex-col items-center pt-6">
                <ScoreRing
                  score={report.opportunityIndex}
                  label="Readiness"
                  sublabel="Measured pillars only"
                />
              </CardContent>
            </Card>
            <div className="flex-1">
              <SectionScores sections={report.sections} />
            </div>
          </div>

          <AuditMetrics report={report} />

          {report.googleLocal?.configured && (
            <GoogleLocalPanel
              googleLocal={report.googleLocal}
              businessName={session.business_name}
            />
          )}

          <SiteBlueprint
            businessName={session.business_name}
            websiteUrl={session.website_url}
            screenshotUrl={report.sitePreview.screenshotUrl}
            before={report.sitePreview.beforeAnnotations}
            after={report.sitePreview.afterAnnotations}
          />

          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-amber-400">Priority Fixes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.deficits.slice(0, 5).map((d, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 p-3">
                  <p className="text-sm font-medium">{d.finding}</p>
                  <p className="mt-1 text-xs text-emerald-400">→ {d.fix}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <GrowthSimulator report={report} />

          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Smart Site Foundation — $99/mo</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-400">
              Fixes the infrastructure gaps measured in this audit. Growth ($297)
              and AI Visibility ($497+) build from there.
            </p>
            <Button size="lg" className="mt-6" asChild>
              <a href={BRAND.phoneHref}>
                <Phone className="h-4 w-4" />
                {BRAND.phoneDisplay}
              </a>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
