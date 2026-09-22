"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { AuditReport, ScanSession } from "@/lib/audit/types";
import { AuditLoadingScreen } from "@/components/audit/AuditLoadingScreen";
import { BlueprintReport, BlueprintReportHeader } from "@/components/audit/BlueprintReport";

async function runAudit(sessionId: string, force = false) {
  const res = await fetch(`/api/sessions/${sessionId}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ force }),
    signal: AbortSignal.timeout(165000),
  });
  const data = await res.json().catch(() => null);
  if (res.status === 202) {
    // Work is claimed and runs after the response. Reloading polls the same saved
    // job instead of dispatching duplicate provider requests.
    const deadline = Date.now() + 320000;
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 2500));
      const response = await fetch(`/api/sessions/${sessionId}`, {cache: "no-store", signal: AbortSignal.timeout(12000)});
      const current = await response.json().catch(() => null);
      if (current?.session?.status === "complete" && current.session.report) return current.session.report as AuditReport;
      if (current?.session?.status === "failed") throw new Error("The audit stopped before completion. This link remains saved; retry checks the same audit and does not automatically repeat paid samples.");
    }
    throw new Error("The report is still processing or needs review. Keep this saved audit link and reopen it shortly.");
  }
  if (!res.ok || !data?.report) {
    throw new Error(res.status === 504
      ? "The scan took too long. Your audit link is saved; retry to check for a completed report."
      : data?.error || "The scan could not finish this time. Please retry.");
  }
  return data.report as AuditReport;
}

export function PresentView({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<ScanSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const sessionRes = await fetch(`/api/sessions/${sessionId}`, { cache: "no-store" });
      const sessionData = await sessionRes.json().catch(() => null);
      if (!sessionRes.ok || !sessionData?.session) throw new Error("Your audit could not be reopened. Please retry.");
      setSession(sessionData.session);
      // Reopening a saved report must not rerun providers or overwrite evidence.
      if (sessionData.session.report) return;
      const report = await runAudit(sessionId, false);
      setSession({ ...sessionData.session, report });
    } catch (e) {
      setError(e instanceof Error && e.name !== "TimeoutError" ? e.message : "The scan took too long. Retry to check for a saved report.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <AuditLoadingScreen businessName={session?.business_name} />;

  if (!session?.report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6">
        <p role="alert" className="text-center text-red-400">{error || "Your report is not ready yet."}</p>
        <p className="max-w-md text-center text-sm text-zinc-400">An unavailable check is not a negative finding about your business. We will show only the evidence collected.</p>
        <Button onClick={() => { setLoading(true); void load(); }}>Retry</Button>
        <Button variant="outline" asChild><Link href="/audit">New audit</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <BlueprintReportHeader session={session} sessionId={sessionId} variant="present" />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl">
          {error && <p role="alert" className="mb-4 rounded-lg border border-amber-500/30 p-3 text-amber-200">{error} Showing your previously saved report.</p>}
          <BlueprintReport session={session} report={session.report} variant="present" sessionId={sessionId} />
        </div>
      </main>
    </div>
  );
}
