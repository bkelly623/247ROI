"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const field =
  "min-h-11 w-full rounded-lg border border-white/15 bg-background/60 p-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none";

export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError("Please fill in your name, phone number, and a short message.");
      return;
    }
    if (!smsConsent) {
      setError("Please check the box to consent to SMS messages so we can text you back.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          message: message.trim(),
          smsConsent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Thanks</p>
        <h3 className="mt-3 font-display text-2xl font-bold">We got your message</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We will follow up by phone or text shortly. If we call and you miss it, you will get a one-time automated
          text so you can reply whenever works for you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Send us a message</p>
        <h3 className="mt-3 font-display text-2xl font-bold">Tell us about the bottleneck</h3>
      </div>

      <div>
        <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-foreground/90">
          Name
        </label>
        <input
          id="contact-name"
          className={field}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
      </div>

      <div>
        <label htmlFor="contact-phone" className="mb-1 block text-sm font-medium text-foreground/90">
          Mobile phone number
        </label>
        <input
          id="contact-phone"
          type="tel"
          className={field}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 555-5555"
          required
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-foreground/90">
          Email <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="contact-email"
          type="email"
          className={field}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-foreground/90">
          What workflow should we look at?
        </label>
        <textarea
          id="contact-message"
          className={`${field} min-h-28 resize-y`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What keeps getting delayed, missed, or repeated?"
          required
        />
      </div>

      <label htmlFor="contact-sms-consent" className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
        <input
          id="contact-sms-consent"
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-background/60"
          checked={smsConsent}
          onChange={(e) => setSmsConsent(e.target.checked)}
          required
        />
        <span>
          I agree to receive SMS messages from 247ROI about my inquiry and follow-up (approx. 2-4 msgs). Msg &amp;
          data rates may apply. Msg frequency varies. Reply STOP to cancel, HELP for help. See our{" "}
          <Link href="/terms-of-service" className="underline underline-offset-2 hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {error && <p className="text-sm font-medium text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
      >
        {busy ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
