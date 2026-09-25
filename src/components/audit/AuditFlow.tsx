"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, Sparkles, Zap } from "lucide-react";
import { AuditShell } from "@/components/audit/AuditShell";
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
import { Badge } from "@/components/ui/badge";
import { BRAND } from "@/lib/audit/config";
import { normalizeUrl } from "@/lib/audit/utils";

export function AuditFlow() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [geography, setGeography] = useState<"local" | "national">("local");
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);

  const startAudit = useCallback(async () => {
    setError(null);
    if (!businessName.trim() || !websiteUrl.trim() || !zipCode.trim() || !phone.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!smsConsent) {
      setError("Please check the box to agree to receive SMS messages before continuing.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          websiteUrl: normalizeUrl(websiteUrl),
          zipCode: zipCode.trim(),
          geography,
          phone: phone.trim(),
          smsConsent,
          repToken: "demo-rep-247roi",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start");

      router.push(`/present/${data.session.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
      setLoading(false);
    }
  }, [businessName, websiteUrl, zipCode, geography, phone, smsConsent, router]);

  return (
    <AuditShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="space-y-8 animate-fade-in">
          <div className="text-center">
            <Badge
              variant="outline"
              className="mb-4 border-primary/30 bg-primary/10 text-primary"
            >
              Full Infrastructure Audit
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
              Infrastructure Blueprint
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Real measurement: PageSpeed Lighthouse, Google rankings, GBP
              reviews, schema analysis, site crawl.
            </p>
          </div>

          <Card className="border-zinc-800 glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                Business Details
              </CardTitle>
              <CardDescription>
                Run before your Meet. Live ChatGPT/Google tests you do in
                separate tabs on the call.
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
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-zinc-200">Service geography</legend>
                <p className="text-xs text-zinc-500">
                  Confirm local vs US-wide/remote. National buyer questions will not force ZIP wording.
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-zinc-300">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="geography"
                      checked={geography === "local"}
                      onChange={() => setGeography("local")}
                    />
                    Local (ZIP-based sampling)
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="geography"
                      checked={geography === "national"}
                      onChange={() => setGeography("national")}
                    />
                    National / remote (US-wide)
                  </label>
                </div>
              </fieldset>
              <div className="space-y-2">
                <Label htmlFor="zip">{geography === "local" ? "Zip Code" : "Zip Code (session reference)"}</Label>
                <Input
                  id="zip"
                  placeholder="19103"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(610) 555-0123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="flex items-start gap-2 rounded-md border border-zinc-800 bg-zinc-900/40 p-3">
                <input
                  id="sms-consent"
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-900 text-primary focus:ring-primary"
                />
                <label htmlFor="sms-consent" className="text-xs leading-relaxed text-zinc-400">
                  I agree to receive SMS messages from 247ROI, including my audit results and
                  follow-up (approx. 2-4 msgs). Msg &amp; data rates may apply. Msg frequency varies.
                  Reply STOP to cancel, HELP for help. See our{" "}
                  <a href="/terms-of-service" target="_blank" rel="noreferrer" className="underline hover:text-zinc-200">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy-policy" target="_blank" rel="noreferrer" className="underline hover:text-zinc-200">
                    Privacy Policy
                  </a>
                  .
                </label>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button
                size="lg"
                className="w-full h-14 text-lg font-semibold pulse-glow"
                onClick={startAudit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Run Full Audit
                    <Zap className="h-5 w-5" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
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
