"use client";

import { useState } from "react";
import Link from "next/link";

/** Honest fallback until an authorized transactional transport is configured.
 * Mount only after the existing report has loaded. No email collection or sends.
 */
export function ReportEmail({ sessionId }: { sessionId: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const reportPath = `/report/${encodeURIComponent(sessionId)}`;

  const copyLink = async () => {
    setBusy(true);
    setMessage("");
    try {
      // Use the current site, never a browser-supplied destination or report URL.
      await navigator.clipboard.writeText(new URL(reportPath, window.location.origin).href);
      setMessage("Report link copied. Keep it private; anyone with the link may be able to view this report.");
    } catch {
      setMessage("Could not copy automatically. Open the saved report link below and copy its address from your browser.");
    } finally {
      setBusy(false);
    }
  };

  const printReport = () => {
    try {
      window.print();
      // Opening a dialog does not prove a PDF was saved or a page was printed.
      setMessage("Choose Save as PDF or a printer in your browser’s print dialog. Nothing has been emailed.");
    } catch {
      setMessage("Could not open the print dialog. Use your browser’s Print menu to print or save as PDF.");
    }
  };

  return (
    <section aria-label="Save your report" className="my-6 rounded-2xl border border-zinc-700 bg-zinc-900/60 p-5 text-zinc-100 print:hidden">
      <h2 className="text-lg font-semibold">Keep a copy of your report</h2>
      <p className="mt-2 text-sm text-zinc-300">
        Email delivery is currently unavailable. You can print this report or use your browser’s Save as PDF option instead.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={printReport} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
          Print / Save as PDF
        </button>
        <button type="button" onClick={copyLink} disabled={busy} className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
          {busy ? "Copying…" : "Copy report link"}
        </button>
        <Link href={reportPath} className="text-sm text-cyan-300 underline underline-offset-4">
          Open saved report
        </Link>
      </div>
      <p className="mt-3 text-xs text-zinc-400">Keep the report link private. These actions do not subscribe you to marketing or request an email.</p>
      <p role="status" aria-live="polite" className="mt-2 text-sm text-zinc-300">{message}</p>
    </section>
  );
}
