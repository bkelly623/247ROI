"use client";

import { useState } from "react";
import { ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SmartGuideProps {
  steps: string[];
  businessName: string;
}

export function SmartGuide({ steps, businessName }: SmartGuideProps) {
  const [step, setStep] = useState(0);
  const [askOpen, setAskOpen] = useState(false);

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-base">Infrastructure Advisor</CardTitle>
        </div>
        <p className="text-sm text-zinc-400">
          Personalized guidance for {businessName}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
          <p className="text-sm leading-relaxed text-zinc-200">
            {steps[step]}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Step {step + 1} of {steps.length}
          </span>
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setAskOpen(!askOpen)}>
                Got a question?
              </Button>
            )}
          </div>
        </div>
        {askOpen && (
          <p className="text-xs text-zinc-500">
            Call us at (917) 572-7734 — we&apos;ll walk you through your blueprint live.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
