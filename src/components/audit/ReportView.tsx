"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AuditShell } from "@/components/audit/AuditShell";
import { Button } from "@/components/ui/button";
import type { AuditReport, ScanSession } from "@/lib/audit/types";
import { BRAND } from "@/lib/audit/config";
import { AuditLoadingScreen } from "@/components/audit/AuditLoadingScreen";
import {
  BlueprintReport,
  BlueprintReportHeader,
} from "@/components/audit/BlueprintReport";

export function ReportView({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<ScanSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Report not found");
    return data.session as ScanSession;
  }, [sessionId]);

  useEffect(() => {
    loadSession()
      .then(setSession)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [loadSession]);

  const trackCta = async (action: string) => {
    await fetch(`/api/sessions/${sessionId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cta_click" }),
    });
    if (action === "call" || action === "primary") {
      window.location.href = BRAND.phoneHref;
    } else if (BRAND.schedulingUrl !== "#schedule") {
      window.open(BRAND.schedulingUrl, "_blank");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Re-run failed");
      setSession((s) =>
        s ? { ...s, report: data.report as AuditReport } : s
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Re-run failed");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <AuditLoadingScreen />;
  }

  if (error && !session?.report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950">
        <p className="text-red-400">{error}</p>
        <Button asChild>
          <Link href="/audit">Run New Audit</Link>
        </Button>
      </div>
    );
  }

  if (!session?.report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950">
        <p className="text-zinc-400">No report yet — run the audit first.</p>
        <Button asChild>
          <Link href={`/present/${sessionId}`}>Run audit</Link>
        </Button>
      </div>
    );
  }

  return (
    <AuditShell compact>
      <BlueprintReportHeader
        session={session}
        sessionId={sessionId}
        variant="report"
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-400">
            {error}
          </p>
        )}
        <BlueprintReport
          session={session}
          report={session.report}
          variant="report"
          sessionId={sessionId}
          onCtaClick={trackCta}
        />
      </main>
    </AuditShell>
  );
}
