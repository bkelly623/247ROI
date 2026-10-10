"use client";

import { useState } from "react";
import { requestTestCheckout } from "./checkout-client";

export default function TestCheckout({ priceId }: { priceId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  async function start() {
    if (loading) return;
    setLoading(true);
    setError(false);
    try {
      window.location.assign(await requestTestCheckout(priceId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }
  return <div>
    <button type="button" onClick={start} disabled={loading} aria-busy={loading}
      className="mt-6 min-h-12 rounded-lg bg-cyan-300 px-6 py-3 font-semibold text-slate-950 disabled:opacity-60">
      {loading ? "Opening secure test checkout…" : error ? "Retry $1 test checkout" : "Start $1 test checkout"}
    </button>
    <p role="status" aria-live="polite" className="mt-3">{loading ? "Please wait. Opening Stripe in this browser." : ""}</p>
    {error && <p role="alert" className="mt-3">Test checkout could not be opened. No payment was completed here. Please retry.</p>}
  </div>;
}
