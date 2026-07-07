"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Phone,
} from "lucide-react";
import type { AuditReport, ScanSession } from "@/lib/audit/types";
import { IndustryPulse } from "@/components/audit/IndustryPulse";
import { AIMirrorPanel } from "@/components/audit/AIMirrorPanel";
import { GoogleLocalPanel } from "@/components/audit/GoogleLocalPanel";
import { SiteBlueprint } from "@/components/audit/SiteBlueprint";
import { GrowthSimulator } from "@/components/audit/GrowthSimulator";
import { SectionScores } from "@/components/audit/SectionScores";
import { ScoreRing } from "@/components/audit/ScoreRing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BRAND } from "@/lib/audit/config";

const SLIDES = [
  "pulse",
  "ai",
  "google",
  "site",
  "scores",
  "growth",
  "close",
] as const;

export function PresentView({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<ScanSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((d) => setSession(d.session))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading presentation...
      </div>
    );
  }

  if (!session?.report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950">
        <p className="text-red-400">Presentation not found</p>
        <Button asChild>
          <Link href="/audit">Run New Blueprint</Link>
        </Button>
      </div>
    );
  }

  const report: AuditReport = session.report;
  const aiMention = report.aiMirror?.summary.mentionRate ?? 0;
  const inGoogle = report.googleLocal?.inMapPack;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            247ROI · Live Blueprint
          </p>
          <p className="font-semibold">{session.business_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-zinc-700">
            {slide + 1} / {SLIDES.length}
          </Badge>
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/report/${sessionId}`}>
              <Maximize2 className="h-4 w-4" />
              Full Report
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {SLIDES[slide] === "pulse" && <IndustryPulse />}

          {SLIDES[slide] === "ai" &&
            (report.aiMirror ? (
              <AIMirrorPanel
                aiMirror={report.aiMirror}
                businessName={session.business_name}
              />
            ) : (
              <p className="text-center text-zinc-500">AI probe data unavailable.</p>
            ))}

          {SLIDES[slide] === "google" &&
            (report.googleLocal ? (
              <GoogleLocalPanel
                googleLocal={report.googleLocal}
                businessName={session.business_name}
              />
            ) : (
              <p className="text-center text-zinc-500">Google probe data unavailable.</p>
            ))}

          {SLIDES[slide] === "site" && (
            <SiteBlueprint
              businessName={session.business_name}
              websiteUrl={session.website_url}
              screenshotUrl={report.sitePreview.screenshotUrl}
              before={report.sitePreview.beforeAnnotations}
              after={report.sitePreview.afterAnnotations}
            />
          )}

          {SLIDES[slide] === "scores" && (
            <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
              <div className="flex justify-center">
                <ScoreRing
                  score={report.opportunityIndex}
                  label="Readiness"
                  sublabel="Room to win"
                />
              </div>
              <SectionScores sections={report.sections} />
            </div>
          )}

          {SLIDES[slide] === "growth" && <GrowthSimulator report={report} />}

          {SLIDES[slide] === "close" && (
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-8 text-center">
              <p className="text-sm uppercase tracking-widest text-primary">
                The Opportunity
              </p>
              <h2 className="mt-4 text-3xl font-bold">
                {aiMention === 0 && !inGoogle
                  ? "You're invisible to AI and Google right now."
                  : "You have gaps — and a window to fix them first."}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-zinc-400">
                Smart Site Foundation from $99/mo fixes the infrastructure.
                Growth at $297/mo automates SEO + reviews. AI Visibility from
                $497/mo makes you the business AI recommends.
              </p>
              <Button size="lg" className="mt-8" asChild>
                <a href={BRAND.phoneHref}>
                  <Phone className="h-4 w-4" />
                  {BRAND.phoneDisplay}
                </a>
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="flex items-center justify-between border-t border-zinc-800 px-4 py-4">
        <Button
          variant="outline"
          disabled={slide === 0}
          onClick={() => setSlide((s) => s - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-1">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlide(i)}
              className={`h-2 w-2 rounded-full ${
                i === slide ? "bg-primary" : "bg-zinc-700"
              }`}
            />
          ))}
        </div>
        <Button
          disabled={slide === SLIDES.length - 1}
          onClick={() => setSlide((s) => s + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}
