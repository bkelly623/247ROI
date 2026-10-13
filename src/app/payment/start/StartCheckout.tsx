"use client";
import { useState } from "react";
import { requestTestCheckout as requestCheckout } from "../test/checkout-client";
export default function StartCheckout({ offerToken }: { offerToken: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function start() {
    if (busy) return;
    setBusy(true); setError(false);
    try { window.location.assign(await requestCheckout(offerToken, fetch, true)); }
    catch { setError(true); setBusy(false); }
  }
  return <div>
    <button type="button" disabled={busy} aria-busy={busy} onClick={start} className="mt-6 min-h-12 rounded-lg bg-cyan-300 px-6 py-3 font-semibold text-slate-950 disabled:opacity-60">{busy ? "Opening secure checkout…" : "Review and pay securely"}</button>
    <p role="status" aria-live="polite">{busy ? "Opening Stripe in this browser." : ""}</p>
    {error && <p role="alert">Checkout could not be opened. No payment was completed here. Please retry or contact us.</p>}
  </div>;
}
