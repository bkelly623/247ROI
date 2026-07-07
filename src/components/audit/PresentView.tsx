"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { AuditReport, ScanSession } from "@/lib/audit/types";
import { AuditLoadingScreen } from "@/components/audit/AuditLoadingScreen";
import {
  BlueprintReport,
  BlueprintReportHeader,
} from "@/components/audit/BlueprintReport";

async function runAudit(sessionId: string, force = true) {
  const res = await fetch(`/api/sessions/${sessionId}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ force }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Audit failed");
  return data.report as AuditReport;
}

export function PresentView({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<ScanSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = true) => {
    setError(null);
    try {
      const sessionRes = await fetch(`/api/sessions/${sessionId}`);
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionData.error || "Session not found");

      setSession(sessionData.session);
      const report = await runAudit(sessionId, force);
      setSession({ ...sessionData.session, report });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load(true);
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  if (loading || refreshing) {
    return <AuditLoadingScreen businessName={session?.business_name} />;
  }

  if (error || !session?.report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6">
        <p className="text-center text-red-400">{error || "Audit failed"}</p>
        <p className="max-w-md text-center text-sm text-zinc-500">
          If you just updated API keys in Vercel, redeploy first, then try again.
        </p>
        <Button onClick={() => { setLoading(true); load(true); }}>Retry</Button>
        <Button variant="outline" asChild>
          <Link href="/audit">New audit</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <BlueprintReportHeader
        session={session}
        sessionId={sessionId}
        variant="present"
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <BlueprintReport
            session={session}
            report={session.report}
            variant="present"
            sessionId={sessionId}
          />
        </div>
      </main>
    </div>
  );
}
