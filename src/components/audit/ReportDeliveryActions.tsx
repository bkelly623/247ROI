"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  canonicalReportPath,
  canonicalReportUrl,
} from "@/lib/audit/report-presentation";

/**
 * Direct online delivery: copy link + print/PDF.
 * Email is deferred — no form, gate, unlock, or marketing opt-in.
 */
export function ReportDeliveryActions({ sessionId, mode = "short" }: { sessionId: string; mode?: "short" | "full" }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const fallbackId = useId();
  const suffix = mode === "full" ? "?view=full" : "";
  const reportPath = canonicalReportPath(sessionId) + suffix;
  useEffect(() => {
    let closed: HTMLDetailsElement[]=[];
    const before=()=>{if(mode !== 'full' || closed.length)return;closed=Array.from(document.querySelectorAll<HTMLDetailsElement>('.report-blueprint details:not([open])'));closed.forEach(d=>{d.open=true;});};
    const after=()=>{closed.forEach(d=>{d.open=false;});closed=[];};
    window.addEventListener('beforeprint',before);
    window.addEventListener('afterprint',after);
    return ()=>{window.removeEventListener('beforeprint',before);window.removeEventListener('afterprint',after);after();};
  }, [mode]);

  const copyLink = async () => {
    setBusy(true);
    setMessage("");
    setFallbackUrl(null);
    const url = canonicalReportUrl(window.location.origin, sessionId) + suffix;
    try {
      await navigator.clipboard.writeText(url);
      setMessage(
        "Report link copied. Anyone with this link can view this report — share only with people you trust."
      );
    } catch {
      setFallbackUrl(url);
      setMessage(
        "Clipboard permission was denied or unavailable. Select the link below and copy it manually."
      );
      // Select fallback after paint so keyboard users can Cmd/Ctrl+C immediately.
      requestAnimationFrame(() => {
        const el = document.getElementById(fallbackId) as HTMLInputElement | null;
        el?.focus();
        el?.select();
      });
    } finally {
      setBusy(false);
    }
  };

  const printReport = () => {
    try {
      window.print();
      setMessage(
        "Choose Save as PDF or a printer in your browser’s print dialog. Nothing has been emailed."
      );
    } catch {
      setMessage(
        "Could not open the print dialog. Use your browser’s Print menu to print or save as PDF."
      );
    }
  };

  return (
    <section
      aria-label="Save or share your report"
      data-testid="report-delivery-actions"
      className="my-6 rounded-2xl border border-zinc-700 bg-zinc-900/60 p-5 text-zinc-100 print:hidden"
    >
      <h2 className="text-lg font-semibold">Keep your {mode} report</h2>
      <p className="mt-2 text-sm text-zinc-300">
        Copy this saved view or print it as a PDF. Switch views above to save the other version. Email delivery is not available.
      </p>
      <p className="mt-2 text-xs text-amber-200/90">
        Permission notice: anyone with the link can view this saved report. Do not post it publicly.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-testid="copy-report-link"
          onClick={copyLink}
          disabled={busy}
          className="min-h-11 rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:opacity-50"
        >
          {busy ? "Copying…" : "Copy report link"}
        </button>
        <button
          type="button"
          data-testid="print-report"
          onClick={printReport}
          className="min-h-11 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          Print / Save as PDF
        </button>
        <Link
          href={reportPath}
          className="text-sm text-cyan-300 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          Open saved report
        </Link>
      </div>
      {fallbackUrl && (
        <label className="mt-4 block text-sm text-zinc-300" htmlFor={fallbackId}>
          Select and copy this report link
          <input
            id={fallbackId}
            data-testid="copy-fallback-input"
            type="text"
            readOnly
            value={fallbackUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-2 w-full min-w-0 rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          />
        </label>
      )}
      <p className="mt-3 text-xs text-zinc-400">
        These actions do not subscribe you to marketing or request an email address.
      </p>
      <p role="status" aria-live="polite" className="mt-2 text-sm text-zinc-300">
        {message}
      </p>
    </section>
  );
}

/** @deprecated Prefer ReportDeliveryActions — kept for offline harness compatibility. */
export { ReportDeliveryActions as ReportEmail };
