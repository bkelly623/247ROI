"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BRAND } from "@/lib/audit/config";

const QUESTIONS = [
  {
    id: "calls",
    question: "Roughly how many inbound calls do you get per week?",
    options: ["Under 20", "20–50", "50–100", "100+"],
  },
  {
    id: "missed",
    question: "What percent go to voicemail during business hours?",
    options: ["Under 10%", "10–30%", "30–50%", "Over 50%"],
  },
  {
    id: "social",
    question: "How often do you post on social media?",
    options: ["Rarely", "Monthly", "Weekly", "Daily"],
  },
  {
    id: "reviews",
    question: "How many new Google reviews do you get per month?",
    options: ["0–2", "3–5", "6–10", "10+"],
  },
  {
    id: "jobValue",
    question: "What's your average job value?",
    options: ["Under $500", "$500–2K", "$2K–5K", "$5K+"],
  },
];

type Recommendation = {
  primary: string;
  reason: string;
  notNow?: string;
};

function computeRecommendation(answers: Record<string, string>): Recommendation {
  const missed = answers.missed;
  const calls = answers.calls;
  const social = answers.social;
  const reviews = answers.reviews;

  if (missed === "30–50%" || missed === "Over 50%") {
    return {
      primary: "Missed-Call Text-Back + AI Receptionist",
      reason: "You're losing warm leads every time a call goes unanswered.",
      notNow:
        calls === "Under 20"
          ? "Paid ads — call volume is low enough to fix capture first."
          : undefined,
    };
  }

  if (reviews === "0–2") {
    return {
      primary: "Automated Review Generation",
      reason:
        "Trust is the fastest lever — more reviews = more calls and better AI visibility.",
    };
  }

  if (social === "Rarely" || social === "Monthly") {
    return {
      primary: "Social Authority Pipeline",
      reason:
        "Consistent project content keeps your brand alive where customers scroll.",
    };
  }

  return {
    primary: "AI Visibility Optimization",
    reason:
      "Your biggest ROI is making sure AI and Google understand and recommend you first.",
  };
}

export function RevenuePathway() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const q = QUESTIONS[step];
  const rec = done ? computeRecommendation(answers) : null;

  if (done && rec) {
    return (
      <Card className="border-emerald-500/20">
        <CardHeader>
          <Badge variant="outline" className="w-fit border-primary/30 bg-primary/10 text-primary">
            Revenue Pathway
          </Badge>
          <CardTitle>Your Highest-ROI Next Step</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="font-semibold text-emerald-400">{rec.primary}</p>
            <p className="mt-2 text-sm text-zinc-300">{rec.reason}</p>
          </div>
          <p className="text-sm text-zinc-500">
            Still start with Smart Site Foundation — everything plugs into it.
          </p>
          {rec.notNow && (
            <p className="text-xs text-zinc-600">Not recommended now: {rec.notNow}</p>
          )}
          <Button asChild className="w-full">
            <a href={BRAND.phoneHref}>Discuss on a Fix Plan Call</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800">
      <CardHeader>
        <Badge variant="outline" className="w-fit border-amber-500/30 bg-amber-500/10 text-amber-400">
          Optional · 60 seconds
        </Badge>
        <CardTitle>Revenue Pathway Scan</CardTitle>
        <p className="text-sm text-zinc-500">
          Answer {QUESTIONS.length} quick questions — we&apos;ll recommend the
          highest-ROI service for your business.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-medium text-zinc-100">{q.question}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {q.options.map((opt) => (
            <Button
              key={opt}
              variant="secondary"
              className="justify-start"
              onClick={() => {
                const next = { ...answers, [q.id]: opt };
                setAnswers(next);
                if (step < QUESTIONS.length - 1) {
                  setStep(step + 1);
                } else {
                  setDone(true);
                }
              }}
            >
              {opt}
            </Button>
          ))}
        </div>
        <p className="text-xs text-zinc-600">
          Question {step + 1} of {QUESTIONS.length}
        </p>
      </CardContent>
    </Card>
  );
}
