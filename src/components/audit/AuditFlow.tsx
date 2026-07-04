"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Lock,
  Phone,
  Sparkles,
  Zap,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BRAND } from "@/lib/audit/config";
import { normalizeUrl } from "@/lib/audit/utils";
import { validateGateClient } from "@/lib/audit/gate-validation";

type FlowStep = "entry" | "scanning" | "gate" | "submitting";

const SCAN_LINES = [
  "Initializing regional infrastructure scan...",
  "Checking if AI can understand your business...",
  "Analyzing Google search readiness...",
  "Reviewing site speed and mobile experience...",
  "Mapping first-mover opportunity in your zip code...",
];

export function AuditFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repToken = searchParams.get("s") ?? undefined;
  const isRep = Boolean(repToken);

  const [step, setStep] = useState<FlowStep>("entry");
  const [progress, setProgress] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [zipCode, setZipCode] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const startScan = useCallback(async () => {
    setError(null);
    if (!businessName.trim() || !websiteUrl.trim() || !zipCode.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setStep("scanning");
    setProgress(8);

    let newSessionId: string;
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          websiteUrl: normalizeUrl(websiteUrl),
          zipCode: zipCode.trim(),
          repToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start scan");

      newSessionId = data.session.id;
      setSessionId(newSessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
      setStep("entry");
      return;
    }

    let p = 8;
    const interval = setInterval(() => {
      p += 6 + Math.random() * 8;
      if (p >= 75) {
        p = 75;
        clearInterval(interval);
        setProgress(75);
        setStep("gate");
        fetch(`/api/sessions/${newSessionId}/gate`, { method: "PATCH" });
      } else {
        setProgress(Math.round(p));
      }
    }, 700);
  }, [businessName, websiteUrl, zipCode, repToken]);

  useEffect(() => {
    if (step === "gate" && sessionId) {
      fetch(`/api/sessions/${sessionId}/gate`, { method: "PATCH" });
    }
  }, [step, sessionId]);

  const submitGate = async () => {
    if (!sessionId) return;
    setError(null);

    if (isRep) {
      // Rep mode: minimal gate — can skip to report with placeholder contact
      setStep("submitting");
      setProgress(92);
    } else if (!firstName || !lastName || !phone || !email) {
      setError("All contact fields are required.");
      return;
    } else {
      const validationError = validateGateClient({ firstName, lastName, phone, email });
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setStep("submitting");
    setProgress(88);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/gate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName || "Rep",
          lastName: lastName || "Session",
          phone: phone || BRAND.phone,
          email: email || BRAND.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "rate_limit") {
          setError(data.message);
          return;
        }
        throw new Error(data.error || "Could not unlock report");
      }

      setProgress(100);
      router.push(`/report/${sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
      setStep("gate");
    }
  };

  return (
    <AuditShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {step === "entry" && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary">
                Free · No Catch · From $99/mo if you want us to build it
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
                Run Your Free AI Infrastructure Blueprint
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-zinc-400">
                See if AI and Google can find your business — and what to fix
                first. Most competitors in your area aren&apos;t doing this yet.
                That&apos;s your window.
              </p>
            </div>

            <Card className="border-zinc-800 glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  Business Details
                </CardTitle>
                <CardDescription>
                  Takes about 30 seconds. We&apos;ll scan your live website.
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
                  Run Local AI Audit
                  <Zap className="h-5 w-5" />
                </Button>
                <p className="text-center text-xs text-zinc-500">
                  Honest upfront: free audit. If you want someone to implement
                  the fix, we hope you&apos;ll use us — services start as low as
                  $99/mo.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {(step === "scanning" || step === "submitting") && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-zinc-50">
                {step === "submitting"
                  ? "Building your blueprint..."
                  : "Scanning your infrastructure..."}
              </h2>
              <p className="mt-2 text-zinc-400">
                Analyzing {businessName || "your business"} in {zipCode}
              </p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-zinc-500">{progress}% complete</p>
            <FauxTerminal lines={SCAN_LINES} intervalMs={1600} />
          </div>
        )}

        <Dialog open={step === "gate"} onOpenChange={() => {}}>
          <DialogContent className="max-w-md border-emerald-500/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-400" />
                Scan Complete — Critical Gaps Found
              </DialogTitle>
              <DialogDescription>
                Your blueprint contains local visibility data. Enter your details
                to unlock your full interactive report and protect it from
                unauthorized access.
              </DialogDescription>
            </DialogHeader>
            {!isRep ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>First Name</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Last Name</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Mobile Phone</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">
                Rep session — click below to unlock the full blueprint for your
                Meet presentation.
              </p>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button size="lg" className="w-full" onClick={submitGate}>
              Unlock My Revenue Blueprint
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogContent>
        </Dialog>

        {step === "submitting" && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-900 px-4 py-6 text-center text-xs text-zinc-600">
        <a href={BRAND.phoneHref} className="inline-flex items-center gap-1 hover:text-primary">
          <Phone className="h-3 w-3" />
          {BRAND.phoneDisplay}
        </a>
        {" · "}
        {BRAND.email}
      </footer>
    </AuditShell>
  );
}
