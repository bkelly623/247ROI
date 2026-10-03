"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getInquiryAttribution, trackSiteEvent } from "@/lib/analytics/client";

const field = "min-h-12 w-full rounded-lg border border-white/20 bg-background/60 p-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
const topics = [
  ["unsure", "Not sure yet"], ["missed-call-text-back", "Missed-call text back"], ["ai-receptionist", "AI receptionist"], ["lead-capture", "Lead capture & follow-up"],
  ["custom-software", "Custom software & AI"], ["workflow-automation", "Workflow automation"], ["dashboard", "Custom dashboard"],
];
export function ContactForm() {
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState("");
  const [message, setMessage] = useState(""); const [topic, setTopic] = useState("unsure"); const [smsConsent, setSmsConsent] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [reference, setReference] = useState("");
  const submissionId = useRef("");
  useEffect(() => {
    const offer = new URLSearchParams(window.location.search).get("offer");
    if (offer && topics.some(([value]) => value === offer)) setTopic(offer);
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    setError(""); setBusy(true);
    if (!submissionId.current) submissionId.current = crypto.randomUUID();
    const params = new URLSearchParams(window.location.search);
    const attribution = getInquiryAttribution();
    try {
      const response = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(55000),
        body: JSON.stringify({ submissionId: submissionId.current, name: name.trim(), phone: phone.trim(), email: email.trim(), message: message.trim(), topic, smsConsent,
          website: new FormData(form).get("website") || "", source: [params.get("source") || "contact", attribution.source].filter(Boolean).join(" | ").slice(0, 200),
          campaign: (attribution.campaign || [params.get("utm_source"), params.get("utm_medium"), params.get("utm_campaign")].filter(Boolean).join(" / ")).slice(0, 200) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true || data.saved !== true || !data.reference) throw new Error(data.error || "We could not confirm receipt. Please try again or call (610) 300-3001.");
      setReference(data.reference);
      trackSiteEvent({ eventName: "inquiry_saved", source: topic, metadata: { topic, reference: data.reference } });
    } catch (error) {
      setError(error instanceof Error && error.name !== "TimeoutError" ? error.message : "We could not confirm receipt. Your message is still here. Retry or call (610) 300-3001.");
    } finally { setBusy(false); }
  }
  if (reference) return <div role="status" className="rounded-3xl border border-primary/30 bg-primary/5 p-7">
    <h2 className="font-display text-2xl font-bold">Your message is saved.</h2>
    <p className="mt-4 leading-relaxed text-muted-foreground">Brendan will follow up using the details you provided. Need to speak sooner? Call <a href="tel:+16103003001" className="font-semibold text-primary underline">(610) 300-3001</a>.</p>
    <p className="mt-5 break-all text-xs text-muted-foreground">Reference: {reference}</p>
  </div>;
  return <form onSubmit={submit} className="relative space-y-4 rounded-3xl border border-white/15 bg-white/[0.04] p-5 sm:p-7" aria-busy={busy}>
    <h2 className="font-display text-2xl font-bold">Tell us what you need.</h2>
    <div className="absolute -left-[10000px]" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <div><label htmlFor="contact-topic" className="mb-1 block text-sm font-medium">I’m interested in</label><select id="contact-topic" className={field} value={topic} onChange={e => setTopic(e.target.value)}>{topics.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    <div><label htmlFor="contact-name" className="mb-1 block text-sm font-medium">Name</label><input id="contact-name" name="name" autoComplete="name" className={field} value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={120} required /></div>
    <div><label htmlFor="contact-phone" className="mb-1 block text-sm font-medium">Phone number</label><input id="contact-phone" name="phone" type="tel" autoComplete="tel" className={field} value={phone} onChange={e => setPhone(e.target.value)} maxLength={30} required /></div>
    <div><label htmlFor="contact-email" className="mb-1 block text-sm font-medium">Email <span className="text-muted-foreground">(optional)</span></label><input id="contact-email" name="email" type="email" autoComplete="email" className={field} value={email} onChange={e => setEmail(e.target.value)} maxLength={254} /></div>
    <div><label htmlFor="contact-message" className="mb-1 block text-sm font-medium">What would you like to improve?</label><textarea id="contact-message" name="message" className={`${field} min-h-28 resize-y`} value={message} onChange={e => setMessage(e.target.value)} minLength={5} maxLength={1800} placeholder="Missed calls, slow follow-up, repeated admin work, scattered data…" required /></div>
    <label htmlFor="contact-sms-consent" className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"><input id="contact-sms-consent" type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={smsConsent} onChange={e => setSmsConsent(e.target.checked)} /><span>(Optional) I agree to receive SMS from 247ROI about my inquiry and follow-up (approx. 2–4 messages). Consent is not required to submit or purchase. Message frequency varies; message and data rates may apply. Reply STOP to cancel, HELP for help. <Link href="/terms-of-service" className="underline">Terms</Link> · <Link href="/privacy-policy" className="underline">Privacy</Link>.</span></label>
    {error && <p role="alert" className="text-sm font-medium text-red-300">{error}</p>}
    <button type="submit" disabled={busy} className="min-h-12 w-full rounded-full bg-orange-700 px-6 py-3 font-semibold text-primary-foreground hover:bg-orange-800 disabled:opacity-50">{busy ? "Saving your message…" : "Send message"}</button>
  </form>;
}
