"use client";

import { useEffect, useState } from "react";

const STATUSES = new Set(["invalid", "expired", "unpaid", "pending", "processing", "paid", "failed", "refunded", "partially_refunded", "unrecognized"]);

type Confirmation = {
  status: string;
  mode: "test" | "live";
  testPayment: boolean;
  message: string;
  onboardingPath: string | null;
  poll: boolean;
};

function isConfirmation(value: unknown): value is Confirmation {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return STATUSES.has(String(row.status)) && (row.mode === "test" || row.mode === "live") && typeof row.testPayment === "boolean" && typeof row.message === "string" && typeof row.poll === "boolean" && (row.onboardingPath === null || typeof row.onboardingPath === "string");
}

export default function ConfirmationStatus({ sessionId }: { sessionId: string }) {
  const [view, setView] = useState<Confirmation | null>(null);
  const [stopped, setStopped] = useState("");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      try {
        const response = await fetch(`/api/stripe/confirmation?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
        const body: unknown = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || !isConfirmation(body)) {
          attempts += 1;
          if (attempts < 5) timer = setTimeout(() => void load(), 3000);
          else setStopped(response.status === 503 ? "Payment lookup is not available right now. Refresh shortly or email brendan@get247roi.com." : "We couldn't confirm this payment. Refresh shortly or email brendan@get247roi.com.");
          return;
        }
        setView(body);
        setStopped("");
        if (body.poll && attempts < 20) {
          attempts += 1;
          timer = setTimeout(() => void load(), 3000);
        } else if (body.poll) {
          setStopped("Recording is still finishing. Refresh this page in a moment, or email brendan@get247roi.com.");
        }
      } catch {
        if (cancelled) return;
        attempts += 1;
        if (attempts < 5) timer = setTimeout(() => void load(), 3000);
        else setStopped("We couldn't reach the payment page. Check your connection, then refresh, or email brendan@get247roi.com.");
      }
    }
    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId]);

  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <p className="text-emerald-600 font-medium text-[15px] mb-4 tracking-tight">Payment</p>
        <h1 className="text-[38px] lg:text-[48px] font-semibold text-gray-900 tracking-tight leading-[1.1] mb-6">Payment confirmation</h1>
        {view?.testPayment ? <p className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-[15px] text-amber-950">Test payment. This is not a live charge.</p> : null}
        <p className="text-[18px] text-gray-700 tracking-tight leading-relaxed">{view?.message ?? (stopped || "Checking this payment…")}</p>
        {stopped && view ? <p className="mt-4 text-[16px] text-gray-600">{stopped}</p> : null}
        {view?.onboardingPath ? <a className="mt-8 inline-block text-[17px] font-medium text-emerald-700 underline" href={view.onboardingPath}>Continue to implementation onboarding</a> : null}
      </div>
    </main>
  );
}
