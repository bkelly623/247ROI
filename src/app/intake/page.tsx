"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const inputClass =
  "w-full border border-gray-300 rounded-xl px-4 py-3 text-[16px] sm:text-[15px] text-gray-900 placeholder:text-gray-700 sm:placeholder:text-gray-500";

const selectClass =
  "w-full border border-gray-300 rounded-xl px-4 py-3 text-[16px] sm:text-[15px] bg-white text-gray-900 invalid:text-gray-800";

export default function IntakePage() {
  const [businessType, setBusinessType] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    setLoading(true);
    await fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: fd.get("businessName"),
        businessType: fd.get("businessType"),
        businessTypeOther: fd.get("businessTypeOther"),
        callsPerDay: fd.get("callsPerDay"),
        missCallOutcome: fd.get("missCallOutcome"),
        averageJobValue: fd.get("averageJobValue"),
        fixTimeline: fd.get("fixTimeline"),
        notes: fd.get("notes"),
      }),
    });

    setLoading(false);
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-[38px] lg:text-[48px] font-semibold text-gray-900 tracking-tight leading-[1.1] mb-4">
          Quick Questions Before Your Call
        </h1>
        <p className="text-[18px] text-gray-600 tracking-tight mb-10">
          Takes 60 seconds. Helps me see where you&apos;re likely losing jobs.
        </p>

        {submitted ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-[30px] sm:text-[34px] font-semibold text-gray-900 tracking-tight leading-[1.1] mb-4">
              You&apos;re all set.
            </h2>
            <p className="text-[17px] text-gray-700 tracking-tight leading-relaxed mb-3">
              I&apos;ll review this before our call so we can get straight to what matters.
            </p>
            <p className="text-[16px] text-gray-600 tracking-tight leading-relaxed mb-6">
              If you want a quick breakdown of what we&apos;ll cover before we talk, use the button
              below.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center bg-emerald-600 text-white px-7 py-3.5 rounded-full hover:bg-emerald-700 transition-all text-[15px] font-medium"
            >
              See what we&apos;ll go over →
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">Business Name</label>
              <input
                name="businessName"
                required
                placeholder="e.g. Smith Plumbing"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                What kind of business do you run?
              </label>
              <select
                name="businessType"
                required
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className={selectClass}
              >
                <option value="">Select…</option>
                <option value="Plumbing">Plumbing</option>
                <option value="HVAC">HVAC</option>
                <option value="Electrical">Electrical</option>
                <option value="Roofing">Roofing</option>
                <option value="Garage Door">Garage Door</option>
                <option value="Locksmith">Locksmith</option>
                <option value="Pest Control">Pest Control</option>
                <option value="Other">Other</option>
              </select>
              {businessType === "Other" ? (
                <input
                  name="businessTypeOther"
                  required
                  placeholder="Describe your trade"
                  className={`${inputClass} mt-3`}
                />
              ) : null}
            </div>

            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                How many calls do you get per day?
              </label>
              <select name="callsPerDay" required className={selectClass}>
                <option value="">Select…</option>
                <option value="0–10">0–10</option>
                <option value="10–30">10–30</option>
                <option value="30+">30+</option>
              </select>
            </div>

            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                What happens when you miss a call?
              </label>
              <select name="missCallOutcome" required className={selectClass}>
                <option value="">Select…</option>
                <option value="Goes to voicemail">Goes to voicemail</option>
                <option value="We call back later">We call back later</option>
                <option value="We usually lose the job">We usually lose the job</option>
                <option value="Not sure">Not sure</option>
              </select>
            </div>

            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                What&apos;s your average job value?
              </label>
              <select name="averageJobValue" required className={selectClass}>
                <option value="">Select…</option>
                <option value="Under $200">Under $200</option>
                <option value="$200–$500">$200–$500</option>
                <option value="$500–$1,000">$500–$1,000</option>
                <option value="$1,000+">$1,000+</option>
              </select>
            </div>

            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                How soon are you looking to fix this?
              </label>
              <select name="fixTimeline" required className={selectClass}>
                <option value="">Select…</option>
                <option value="ASAP">ASAP</option>
                <option value="This month">This month</option>
                <option value="Just exploring">Just exploring</option>
              </select>
            </div>

            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                Anything I should know before we talk?{" "}
                <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                name="notes"
                rows={4}
                placeholder="Optional — e.g. service area, seasonality, current tools"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center bg-emerald-600 text-white px-7 py-3.5 rounded-full hover:bg-emerald-700 transition-all text-[15px] font-medium disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
