"use client";

import Link from "next/link";
import { Activity, Lock, Phone, Sparkles, TrendingUp } from "lucide-react";
import { AuditShell } from "@/components/audit/AuditShell";
import { FauxTerminal } from "@/components/audit/FauxTerminal";
import { ScoreRing } from "@/components/audit/ScoreRing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BRAND } from "@/lib/audit/config";
import { PRIMARY_PHONE_HREF } from "@/app/components/cta";

const CLIENT_LOGS = [
  "Smart Site Foundation: active on edge cluster.",
  "AI citation layer sync: nominal.",
  "Google index ping: successful.",
  "Review request automation: 3 sent this week.",
  "Monitoring semantic integrity: all systems go.",
];

const LOCKED_MODULES = [
  "SEO Growth Engine",
  "Social Authority Pipeline",
  "AI Receptionist",
];

export default function PortalPage() {
  return (
    <AuditShell compact>
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-2 border-primary/30 bg-primary/10 text-primary">
              ● Connected · Smart Site Active
            </Badge>
            <h1 className="text-3xl font-bold">Client Command Center</h1>
            <p className="text-muted-foreground">
              Included with Smart Site Foundation — ongoing monitoring & proof-of-work
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/audit">Run New Prospect Audit</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="flex justify-center pt-8">
              <ScoreRing score={94} label="AI Readiness" sublabel="Post-Foundation target" size={180} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Live Infrastructure Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FauxTerminal lines={CLIENT_LOGS} intervalMs={2500} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "AI Visibility", score: 91, icon: Sparkles },
            { label: "Google Search", score: 88, icon: TrendingUp },
            { label: "Reputation", score: 85, icon: Activity },
            { label: "Social", score: 72, icon: TrendingUp },
          ].map(({ label, score, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <Icon className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-3xl font-bold">{score}%</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Growth Modules</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {LOCKED_MODULES.map((name) => (
              <Card key={name} className="relative overflow-hidden">
                <CardContent className="blurred-preview pt-6 opacity-50">
                  <div className="h-16 rounded bg-muted" />
                  <p className="mt-3 font-medium">{name}</p>
                </CardContent>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70">
                  <Lock className="h-5 w-5 text-amber-400" />
                  <p className="mt-2 text-xs text-amber-400/90">Upgrade to unlock</p>
                  <Button size="sm" className="mt-3" asChild>
                    <a href={PRIMARY_PHONE_HREF}>Request Activation</a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card className="border-primary/20">
          <CardContent className="flex flex-col items-center gap-4 py-8 sm:flex-row">
            <Phone className="h-8 w-8 text-primary" />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold">This is what $99/mo clients see every day.</p>
              <p className="text-sm text-muted-foreground">
                Preview mode — activate Foundation to go live.
              </p>
            </div>
            <Button asChild>
              <a href={BRAND.phoneHref}>{BRAND.phoneDisplay}</a>
            </Button>
          </CardContent>
        </Card>
      </main>
    </AuditShell>
  );
}
