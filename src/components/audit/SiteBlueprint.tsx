"use client";

import { useState } from "react";
import type { SiteAnnotation } from "@/lib/audit/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SiteBlueprintProps {
  businessName: string;
  websiteUrl: string;
  screenshotUrl?: string;
  before: SiteAnnotation[];
  after: SiteAnnotation[];
}

export function SiteBlueprint({
  businessName,
  websiteUrl,
  screenshotUrl,
  before,
  after,
}: SiteBlueprintProps) {
  const [showAfter, setShowAfter] = useState(false);
  const [imgError, setImgError] = useState(false);
  const annotations = showAfter ? after : before;
  const cleanUrl = websiteUrl.replace(/^https?:\/\//, "");

  return (
    <Card className="overflow-hidden border-border">
      <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Site Infrastructure Blueprint</CardTitle>
          <p className="text-sm text-muted-foreground">
            {businessName} · {cleanUrl}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {showAfter
              ? "Preview of your business on a Smart Site Foundation — same brand, upgraded infrastructure."
              : "Your live site with flagged gaps. Hover pins for details."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={!showAfter ? "default" : "secondary"}
            onClick={() => setShowAfter(false)}
          >
            Current Site
          </Button>
          <Button
            size="sm"
            variant={showAfter ? "default" : "secondary"}
            onClick={() => setShowAfter(true)}
          >
            Smart Site Preview
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative min-h-[360px] bg-muted/30">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
            </div>
            <div className="flex-1 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
              {showAfter ? "smart-site.247roi.preview" : cleanUrl}
            </div>
            <Badge
              variant="outline"
              className={
                showAfter
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-400"
              }
            >
              {showAfter ? "Foundation Build" : "Current State"}
            </Badge>
          </div>

          <div className="relative">
            {!showAfter && screenshotUrl && !imgError ? (
              <div className="relative mx-auto max-h-[420px] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotUrl}
                  alt={`Screenshot of ${cleanUrl}`}
                  className="w-full object-cover object-top opacity-90"
                  onError={() => setImgError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              </div>
            ) : showAfter ? (
              <div className="relative bg-gradient-to-br from-primary/5 via-background to-background p-8">
                <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-primary/20 bg-card/80 p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-24 rounded bg-primary/40" />
                    <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
                      AI-Ready
                    </Badge>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{businessName}</p>
                  <p className="text-sm text-muted-foreground">
                    Fast local service site · Schema injected · AI citation layer · Review & chat ready
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {["Services", "Reviews", "Book Now"].map((l) => (
                      <div key={l} className="rounded-lg bg-primary/10 py-3 text-center text-xs font-medium text-primary">
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative p-8">
                <div className="mx-auto max-w-2xl space-y-4 opacity-60">
                  <div className="h-8 w-2/3 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted/80" />
                  <div className="h-4 w-5/6 rounded bg-muted/80" />
                </div>
              </div>
            )}

            {annotations.map((pin) => (
              <div
                key={pin.id}
                className="absolute z-10"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                <div
                  className={`group relative -translate-x-1/2 -translate-y-1/2 rounded-full p-1 ${
                    pin.status === "fixed"
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "bg-destructive/20 ring-2 ring-destructive animate-pulse"
                  }`}
                >
                  <span className="block h-3 w-3 rounded-full bg-current opacity-80" />
                  <div className="absolute left-1/2 top-full z-20 mt-2 hidden w-48 -translate-x-1/2 rounded-lg border border-border bg-popover p-2 text-xs shadow-xl group-hover:block">
                    <p className="font-medium">{pin.label}</p>
                    <p className="text-muted-foreground">{pin.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
