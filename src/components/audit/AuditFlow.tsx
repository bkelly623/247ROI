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

  const startAudit = useCallback(async () => {
    setError(null);
    if (!businessName.trim() || !websiteUrl.trim() || !zipCode.trim()) {
      setError("Please fill in all fields.");
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
  }, [businessName, websiteUrl, zipCode, router]);

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
