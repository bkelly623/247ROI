"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X, Phone, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/audit/config";
import type { AuditReport } from "@/lib/audit/types";

interface ReportAdvisorProps {
  report: AuditReport;
  businessName: string;
  onCtaClick?: () => void;
}

export function ReportAdvisor({
  report,
  businessName,
  onCtaClick,
}: ReportAdvisorProps) {
  const steps = report.advisorSteps ?? report.guideSteps;
  const [open, setOpen] = useState(false);
  const [prompted, setPrompted] = useState(false);
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => {
      setPrompted(true);
    }, 18000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const isLast = step >= steps.length - 1;

  if (dismissed) return null;

  return (
    <>
      {/* Prompt bubble */}
      {prompted && !open && (
        <div className="fixed bottom-24 right-4 z-50 max-w-xs animate-fade-in sm:right-6">
          <div className="rounded-xl border border-primary/30 bg-card p-4 shadow-2xl">
            <p className="text-sm font-medium text-foreground">
              Want a 60-second walkthrough of your results?
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              I&apos;ll explain what this means for {businessName} — no jargon.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => setOpen(true)}>
                Yes, walk me through it
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissed(true)}
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating trigger */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105 sm:right-6"
          aria-label="Open report advisor"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Advisor panel */}
      {open && (
        <div className="fixed bottom-6 right-4 z-50 flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:right-6">
          <div className="flex items-center justify-between border-b border-border bg-primary/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Infrastructure Advisor
              </p>
              <p className="text-xs text-muted-foreground">
                Your personalized blueprint guide
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto p-4">
            {report.executiveSummary && step === 0 && (
              <p className="mb-3 text-xs text-muted-foreground border-b border-border pb-3">
                {report.executiveSummary}
              </p>
            )}
            <p className="text-sm leading-relaxed text-foreground">
              {steps[step]}
            </p>
          </div>

          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Step {step + 1} of {steps.length}
              </span>
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${
                      i <= step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {step > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </Button>
              )}
              {!isLast ? (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setStep((s) => s + 1)}
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    onCtaClick?.();
                    window.location.href = BRAND.phoneHref;
                  }}
                >
                  <Phone className="h-4 w-4" />
                  Get Your Fix Plan Call
                </Button>
              )}
            </div>

            {isLast && (
              <p className="text-center text-[10px] text-muted-foreground">
                Smart Site from $99/mo · AI Visibility Program custom
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
