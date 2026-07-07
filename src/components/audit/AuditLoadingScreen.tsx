"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const STEPS = [
  "Crawling site structure & schema",
  "Running Google Lighthouse (mobile)",
  "Measuring local Google rankings",
  "Building your infrastructure blueprint",
];

export function AuditLoadingScreen({ businessName }: { businessName?: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
            247ROI Infrastructure Audit
          </p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-50">
            {businessName ? `Analyzing ${businessName}` : "Running full audit"}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Real measurements only — PageSpeed, Google, site crawl
          </p>
        </div>
        <ul className="space-y-3 text-left">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                i <= step
                  ? "border-primary/30 bg-primary/5 text-zinc-200"
                  : "border-zinc-800 text-zinc-600"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i < step
                    ? "bg-primary text-white"
                    : i === step
                      ? "border border-primary text-primary"
                      : "border border-zinc-700 text-zinc-600"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
