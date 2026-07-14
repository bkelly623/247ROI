"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { HireGate } from "@/components/hire/HireGate";
import { HireReport } from "@/components/hire/HireReport";
import type { HireProposal, HireSession } from "@/lib/hire/types";

export default function HireReportPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [session, setSession] = useState<HireSession | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needGate, setNeedGate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/hire/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Not found");
        if (cancelled) return;

        if (data.unlocked && data.session?.proposal) {
          setSession(data.session as HireSession);
          setUnlocked(true);
        } else if (data.session?.proposal || data.session?.status === "gate_ready") {
          setNeedGate(true);
          setSession(data.session as HireSession);
        } else {
          setError("This audit is not ready yet. Finish the chat first.");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function reloadUnlocked() {
    const res = await fetch(`/api/hire/${id}`);
    const data = await res.json();
    if (res.ok && data.unlocked) {
      setSession(data.session);
      setUnlocked(true);
      setNeedGate(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20">
        {loading && (
          <div className="flex min-h-[50vh] items-center justify-center gap-2 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
            Loading hire packet…
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-20 text-center">
            <p className="text-red-400">{error}</p>
            <Button asChild>
              <Link href="/hire">Start a new audit</Link>
            </Button>
          </div>
        )}

        {!loading && unlocked && session?.proposal && (
          <HireReport session={session} proposal={session.proposal as HireProposal} />
        )}

        {!loading && needGate && !unlocked && (
          <div className="mx-auto max-w-lg px-6 py-20 text-center">
            <h1 className="font-display text-3xl font-bold text-zinc-50">
              Your hire plan is sealed
            </h1>
            <p className="mt-3 text-zinc-400">
              Unlock it with your details — then we can actually staff the role.
            </p>
          </div>
        )}
      </main>
      <Footer />

      {needGate && !unlocked && (
        <HireGate
          sessionId={id}
          teaserLine={
            session && "proposal" in session && session.proposal
              ? `${(session.proposal as HireProposal).employeeName} · locked`
              : null
          }
          employeeName={
            session && "proposal" in session && session.proposal
              ? (session.proposal as HireProposal).employeeName
              : undefined
          }
          onUnlocked={() => {
            void reloadUnlocked();
          }}
        />
      )}
    </div>
  );
}
