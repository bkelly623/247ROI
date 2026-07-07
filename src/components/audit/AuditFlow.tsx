"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, Sparkles, Zap } from "lucide-react";
import { AuditShell } from "@/components/audit/AuditShell";
import { FauxTerminal } from "@/components/audit/FauxTerminal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BRAND } from "@/lib/audit/config";
import { normalizeUrl } from "@/lib/audit/utils";

type FlowStep = "entry" | "scanning";

const SCAN_LINES = [
  "Initializing regional infrastructure scan...",
  "Querying ChatGPT, Claude, and Gemini live...",
  "Pulling Google local search results...",
  "Analyzing site schema and AI readability...",
  "Building your presentation blueprint...",
];

export function AuditFlow() {
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>("entry");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [zipCode, setZipCode] = useState("");

  const startScan = useCallback(async () => {
    setError(null);
    if (!businessName.trim() || !websiteUrl.trim() || !zipCode.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setStep("scanning");
    setProgress(5);

    let sessionId: string;
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          websiteUrl: normalizeUrl(websiteUrl),
          zipCode: zipCode.trim(),
          repToken: "demo-rep-247roi",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start scan");
      sessionId = data.session.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
      setStep("entry");
      return;
    }

    let p = 5;
    const interval = setInterval(() => {
      p += 4 + Math.random() * 6;
      if (p < 88) setProgress(Math.round(p));
    }, 600);

    try {
      const runRes = await fetch(`/api/sessions/${sessionId}/run`, {
        method: "POST",
      });
      const runData = await runRes.json();
      clearInterval(interval);

      if (!runRes.ok) {
        throw new Error(runData.error || "Audit failed");
      }

      setProgress(100);
      router.push(`/present/${sessionId}`);
    } catch (e) {
      clearInterval(interval);
      setError(e instanceof Error ? e.message : "Audit failed");
      setStep("entry");
    }
  }, [businessName, websiteUrl, zipCode, router]);

  return (
    <AuditShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {step === "entry" && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <Badge
                variant="outline"
                className="mb-4 border-primary/30 bg-primary/10 text-primary"
              >
                Live Presentation Mode
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
                Infrastructure Blueprint
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-zinc-400">
                Enter the business. We run live AI + Google probes and build a
                screen-share ready presentation.
              </p>
            </div>

            <Card className="border-zinc-800 glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  Business Details
                </CardTitle>
                <CardDescription>
                  Takes 30–60 seconds. Real queries to AI models and Google.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business">Business Name</Label>
                  <Input
                    id="business"
                    placeholder="Elite Roofing Specialists"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Website URL</Label>
                  <Input
                    id="url"
                    placeholder="yourbusiness.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">Zip Code</Label>
                  <Input
                    id="zip"
                    placeholder="19103"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-semibold pulse-glow"
                  onClick={startScan}
                >
                  Run Live Blueprint
                  <Zap className="h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "scanning" && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-emerald-400" />
              <h2 className="text-2xl font-semibold text-zinc-50">
                Running live probes...
              </h2>
              <p className="mt-2 text-zinc-400">
                {businessName} · {zipCode}
              </p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-zinc-500">
              {progress}% — querying AI models & Google
            </p>
            <FauxTerminal lines={SCAN_LINES} intervalMs={1400} />
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-900 px-4 py-6 text-center text-xs text-zinc-600">
        <a
          href={BRAND.phoneHref}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <Phone className="h-3 w-3" />
          {BRAND.phoneDisplay}
        </a>
      </footer>
    </AuditShell>
  );
}
