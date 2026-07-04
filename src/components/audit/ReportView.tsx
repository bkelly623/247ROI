"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Phone,
  Shield,
} from "lucide-react";
import { AuditShell } from "@/components/audit/AuditShell";
import { FauxTerminal } from "@/components/audit/FauxTerminal";
import { ScoreRing } from "@/components/audit/ScoreRing";
import { SectionScores } from "@/components/audit/SectionScores";
import { SiteBlueprint } from "@/components/audit/SiteBlueprint";
import { SmartGuide } from "@/components/audit/SmartGuide";
import { RevenuePathway } from "@/components/audit/RevenuePathway";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuditReport, ScanSession } from "@/lib/audit/types";
import { BRAND } from "@/lib/audit/config";

export function ReportView({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<ScanSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSession(data.session);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const trackCta = async (action: string) => {
    await fetch(`/api/sessions/${sessionId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cta_click" }),
    });
    if (action === "call") {
      window.location.href = BRAND.phoneHref;
    } else if (BRAND.schedulingUrl !== "#schedule") {
      window.open(BRAND.schedulingUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Loading your blueprint...</p>
      </div>
    );
  }

  if (error || !session?.report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950">
        <p className="text-red-400">{error || "Report not found"}</p>
        <Button asChild>
          <Link href="/audit">Run New Audit</Link>
        </Button>
      </div>
    );
  }

  const report: AuditReport = session.report;

  return (
    <AuditShell compact>
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {/* Hero */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-4">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              Infrastructure Blueprint Ready
            </Badge>
            <h1 className="text-3xl font-bold text-zinc-50 sm:text-4xl">
              {session.business_name}
            </h1>
            <p className="max-w-2xl text-lg text-zinc-400">
              {report.opportunityHeadline}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => trackCta("call")}>
                <Phone className="h-4 w-4" />
                Get Your Free Fix Plan Call
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/portal">
                  Preview Command Center
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <Card className="border-zinc-800 lg:w-72">
            <CardContent className="flex flex-col items-center pt-6">
              <ScoreRing
                score={report.opportunityIndex}
                label="Infrastructure Readiness"
                sublabel="Lower score = more upside if you act first"
              />
            </CardContent>
          </Card>
        </div>

        {/* Critical deficits */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <Shield className="h-5 w-5" />
              Top Priority Fixes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.deficits.slice(0, 3).map((d, i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
              >
                <p className="font-medium text-zinc-100">{d.finding}</p>
                <p className="mt-1 text-sm text-emerald-400/90">→ {d.fix}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Four plain scores */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-zinc-50">
            Your Visibility Breakdown
          </h2>
          <SectionScores sections={report.sections} />
        </div>

        {/* Social findings */}
        {report.socialFindings && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">What we checked on your website</CardTitle>
              <CardDescription>{report.socialFindings.note}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Linked on site</p>
                {report.socialFindings.found.length ? (
                  <ul className="space-y-1 text-sm text-primary">
                    {report.socialFindings.found.map((s) => (
                      <li key={s}>✓ {s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">None detected in homepage HTML</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Not linked on site</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {report.socialFindings.notLinked.map((s) => (
                    <li key={s}>○ {s}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Site blueprint */}
        <SiteBlueprint
          businessName={session.business_name}
          websiteUrl={session.website_url}
          screenshotUrl={report.sitePreview.screenshotUrl}
          before={report.sitePreview.beforeAnnotations}
          after={report.sitePreview.afterAnnotations}
        />

        {/* Two-package recommendation */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-primary/30 bg-primary/10 text-primary">
                Start Here · Package #1
              </Badge>
              <CardTitle>{report.packages.primary.headline}</CardTitle>
              <CardDescription>
                {report.packages.primary.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm font-medium text-emerald-400">
                Starting as low as $99/mo
              </p>
              <Button className="w-full" onClick={() => trackCta("primary")}>
                {report.packages.primary.ctaLabel}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-amber-500/30 bg-amber-500/10 text-amber-400">
                Your Biggest Opportunity · Package #2
              </Badge>
              <CardTitle>{report.packages.secondary.headline}</CardTitle>
              <CardDescription>
                {report.packages.secondary.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-zinc-400">
                Custom pricing — see if you qualify
              </p>
              <Button
                className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400"
                onClick={() => trackCta("secondary")}
              >
                {report.packages.secondary.ctaLabel}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Locked upsell previews */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-zinc-50">
            Additional Growth Modules
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "Social Authority Pipeline",
              "AI Receptionist",
              "Review Automation",
            ].map((name) => (
              <Card key={name} className="relative overflow-hidden border-zinc-800">
                <div className="blurred-preview p-6 opacity-60">
                  <div className="h-24 rounded bg-zinc-800" />
                  <p className="mt-3 font-medium">{name}</p>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/60">
                  <Lock className="h-6 w-6 text-amber-400" />
                  <p className="mt-2 text-xs text-zinc-400">
                    Unlocks with Foundation
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <RevenuePathway />

        <SmartGuide steps={report.guideSteps} businessName={session.business_name} />

        <FauxTerminal lines={report.progressEvents} intervalMs={1200} />

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left">
            <CheckCircle2 className="h-10 w-10 shrink-0 text-emerald-400" />
            <div className="flex-1">
              <p className="font-semibold text-zinc-100">
                Ready to capture the opportunity?
              </p>
              <p className="text-sm text-zinc-400">
                Most businesses in your area aren&apos;t AI-ready yet. Call us for
                a free fix plan walkthrough — no pressure, no catch.
              </p>
            </div>
            <Button size="lg" onClick={() => trackCta("call")}>
              {BRAND.phoneDisplay}
            </Button>
          </CardContent>
        </Card>
      </main>
    </AuditShell>
  );
}
