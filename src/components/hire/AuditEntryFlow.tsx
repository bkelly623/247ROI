"use client";

import { FormEvent, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { HireAuditFlow } from "@/components/hire/HireAuditFlow";
import { normalizeUrl } from "@/lib/audit/utils";

const field = "min-h-11 w-full rounded-lg border border-white/20 bg-zinc-900 p-3 text-base";
const button = "min-h-11 rounded-lg border border-orange-400/50 px-4 py-3 text-base disabled:opacity-40";

/** Restore the visibility-first entry, without replacing the recovered chat. */
export function AuditEntryFlow() {
  const [showChat, setShowChat] = useState(false);
  const [business, setBusiness] = useState("");
  const [website, setWebsite] = useState("");
  const [zip, setZip] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    // Returning from a visibility report must not loop back to its intake.
    setShowChat(query.get("step") === "opportunity" || Boolean(query.get("visibility")));
  }, []);

  function skip() {
    const url = new URL(window.location.href);
    url.searchParams.set("step", "opportunity");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    setShowChat(true);
    window.scrollTo(0, 0);
  }

  async function scan(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: business.trim(), websiteUrl: normalizeUrl(website.trim()), zipCode: zip.trim() }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.session?.id) throw new Error("Could not start the visibility audit. Please retry, or skip to the Opportunity audit.");
      const assisted = new URLSearchParams(window.location.search).get("assisted") === "1";
      window.location.assign(`/present/${encodeURIComponent(data.session.id)}${assisted ? "?assisted=1" : ""}`);
    } catch (e) {
      setError(e instanceof Error && e.name !== "TimeoutError" ? e.message : "Starting the audit took too long. Please retry.");
      setBusy(false);
    }
  }

  if (showChat) return <HireAuditFlow />;

  return (
    <>
      <Navbar />
      <main id="audit" className="min-h-screen bg-zinc-950 px-5 pb-12 pt-28 text-zinc-100 sm:px-6">
        <section aria-label="Website and AI visibility audit" className="mx-auto max-w-xl space-y-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">AI Opportunity Audit</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Start with your website & AI visibility</h1>
          <p className="text-zinc-400">Check your website, SEO and available AI visibility evidence first. Or skip straight to the conversation about improving your business.</p>
          <form onSubmit={scan} className="space-y-4 rounded-xl border border-white/10 p-5">
            <label className="block">Website<input className={field} required value={website} onChange={e => setWebsite(e.target.value)} placeholder="yourbusiness.com" autoComplete="url" /></label>
            <label className="block">Business name<input className={field} required minLength={2} value={business} onChange={e => setBusiness(e.target.value)} autoComplete="organization" /></label>
            <label className="block">ZIP code<input className={field} required minLength={5} maxLength={10} value={zip} onChange={e => setZip(e.target.value)} autoComplete="postal-code" /></label>
            <button type="submit" className={`${button} w-full bg-orange-500 text-black`} disabled={busy}>{busy ? "Starting visibility audit…" : "Check website visibility"}</button>
            <p className="text-sm text-zinc-400">Website scans need business name and ZIP above. You can continue to the Opportunity conversation after viewing the findings.</p>
          </form>
          {error && <p role="alert" className="text-red-300">{error}</p>}
          <button type="button" className={`${button} w-full`} onClick={skip} disabled={busy}>Skip website — explore operations</button>
        </section>
      </main>
    </>
  );
}
