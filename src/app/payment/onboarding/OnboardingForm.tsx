"use client";

import { useEffect, useState, type FormEvent } from "react";

type Profile = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  serviceNotes: string;
  updatedAt: string;
};

export default function OnboardingForm({ token }: { token: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!token) return;
    void fetch(`/api/stripe/onboarding?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { profile?: Profile | null; error?: string }) => {
        if (body.profile) setProfile(body.profile);
        if (body.error) setError("This onboarding link is invalid or expired.");
      })
      .catch(() => setError("We couldn't load onboarding. Refresh shortly."));
  }, [token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/stripe/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          businessName: form.get("businessName"),
          contactName: form.get("contactName"),
          email: form.get("email"),
          phone: form.get("phone"),
          website: form.get("website") || "",
          serviceNotes: form.get("serviceNotes"),
        }),
      });
      const body = (await response.json()) as { profile?: Profile; error?: string };
      if (!response.ok || !body.profile) {
        setError(body.error === "browser_binding_required" ? "Open this page in the same browser used to pay, or email brendan@get247roi.com." : "We couldn't save that. Check the fields and try again.");
        return;
      }
      setProfile(body.profile);
    } catch {
      setError("We couldn't save that. Check your connection and try again, or email brendan@get247roi.com.");
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return <main className="min-h-screen bg-white px-6 py-20"><div className="max-w-3xl mx-auto"><h1 className="text-[38px] font-semibold text-gray-900">Implementation onboarding</h1><p className="mt-4 text-[18px] text-gray-700">This onboarding link is missing or invalid.</p></div></main>;
  }

  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <p className="text-emerald-600 font-medium text-[15px] mb-4">After payment</p>
        <h1 className="text-[38px] lg:text-[48px] font-semibold text-gray-900 tracking-tight leading-[1.1] mb-6">Implementation onboarding</h1>
        <p className="text-[18px] text-gray-600 mb-8">Tell us how to implement the service. Your package is already set by the payment; this form does not choose one.</p>
        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <label className="block text-[15px] text-gray-800">Business name<input className="mt-1 w-full border border-gray-300 px-3 py-2" name="businessName" required minLength={2} maxLength={160} defaultValue={profile?.businessName ?? ""} /></label>
          <label className="block text-[15px] text-gray-800">Contact name<input className="mt-1 w-full border border-gray-300 px-3 py-2" name="contactName" required minLength={2} maxLength={120} defaultValue={profile?.contactName ?? ""} /></label>
          <label className="block text-[15px] text-gray-800">Email<input className="mt-1 w-full border border-gray-300 px-3 py-2" name="email" type="email" required maxLength={254} defaultValue={profile?.email ?? ""} /></label>
          <label className="block text-[15px] text-gray-800">Phone<input className="mt-1 w-full border border-gray-300 px-3 py-2" name="phone" required maxLength={30} defaultValue={profile?.phone ?? ""} /></label>
          <label className="block text-[15px] text-gray-800">Website<input className="mt-1 w-full border border-gray-300 px-3 py-2" name="website" maxLength={200} defaultValue={profile?.website ?? ""} /></label>
          <label className="block text-[15px] text-gray-800">What should we implement?<textarea className="mt-1 w-full border border-gray-300 px-3 py-2" name="serviceNotes" required minLength={10} maxLength={4000} defaultValue={profile?.serviceNotes ?? ""} /></label>
          <button className="bg-gray-900 text-white px-4 py-2 text-[15px]" type="submit" disabled={pending}>{pending ? "Saving…" : "Save implementation details"}</button>
        </form>
        {error ? <p className="mt-4 text-[16px] text-red-700">{error}</p> : null}
        {profile ? <p className="mt-6 text-[16px] text-gray-800">Saved for {profile.businessName}. Notification delivery is at-least-once and may retry.</p> : null}
      </div>
    </main>
  );
}
