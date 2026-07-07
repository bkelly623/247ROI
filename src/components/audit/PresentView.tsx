"use client";

import Link from "next/link";
import { Phone, Loader2 } from "lucide-react";
import { useLiveStream } from "@/components/audit/live/useLiveStream";
import { LiveGoogleWindow } from "@/components/audit/live/LiveGoogleWindow";
import { LiveAIWindow } from "@/components/audit/live/LiveAIWindow";
import { SiteBlueprint } from "@/components/audit/SiteBlueprint";
import { GrowthSimulator } from "@/components/audit/GrowthSimulator";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/audit/config";

export function PresentView({ sessionId }: { sessionId: string }) {
  const live = useLiveStream(sessionId);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            247ROI · Live Query Theater
          </p>
          <p className="text-lg font-semibold">
            {live.businessName || "Starting live audit..."}
            {live.zipCode && (
              <span className="ml-2 text-sm font-normal text-zinc-500">
                {live.tradeLabel} · {live.zipCode}
              </span>
            )}
          </p>
        </div>
        {!live.connected && !live.done && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting live probes...
          </div>
        )}
        {live.done && (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/report/${sessionId}`}>Full Report</Link>
          </Button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          {/* Google — full width, live */}
          <LiveGoogleWindow
            typingQuery={live.google.query}
            searching={live.google.searching}
            results={live.google.results}
            clientFound={live.google.clientFound}
            active={live.google.active}
          />

          {/* AI models — side by side, streaming live */}
          <div className="grid gap-4 lg:grid-cols-3">
            <LiveAIWindow
              provider="chatgpt"
              query={live.chatgpt.query}
              response={live.chatgpt.response}
              streaming={live.chatgpt.streaming}
              unavailable={live.chatgpt.unavailable}
              mentionedClient={live.chatgpt.mentioned}
              active={live.chatgpt.active}
            />
            <LiveAIWindow
              provider="gemini"
              query={live.gemini.query}
              response={live.gemini.response}
              streaming={live.gemini.streaming}
              unavailable={live.gemini.unavailable}
              mentionedClient={live.gemini.mentioned}
              active={live.gemini.active}
            />
            <LiveAIWindow
              provider="claude"
              query={live.claude.query}
              response={live.claude.response}
              streaming={live.claude.streaming}
              unavailable={live.claude.unavailable}
              mentionedClient={live.claude.mentioned}
              active={live.claude.active}
            />
          </div>

          {live.siteMessage && !live.done && (
            <p className="text-center text-xs text-zinc-500">{live.siteMessage}</p>
          )}

          {live.done && live.report && (
            <div className="space-y-6 pt-4 animate-fade-in">
              <SiteBlueprint
                businessName={live.businessName}
                websiteUrl={live.report.sitePreview.websiteUrl ?? ""}
                screenshotUrl={live.report.sitePreview.screenshotUrl}
                before={live.report.sitePreview.beforeAnnotations}
                after={live.report.sitePreview.afterAnnotations}
              />
              <GrowthSimulator report={live.report} />
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
                <h2 className="text-2xl font-bold">
                  Want to be the one AI and Google recommend?
                </h2>
                <p className="mt-2 text-zinc-400">
                  Smart Site $99/mo · Growth $297/mo · AI Visibility from $497/mo
                </p>
                <Button size="lg" className="mt-6" asChild>
                  <a href={BRAND.phoneHref}>
                    <Phone className="h-4 w-4" />
                    {BRAND.phoneDisplay}
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
