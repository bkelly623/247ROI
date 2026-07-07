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
  const hasScreenshot = Boolean(screenshotUrl && !imgError);

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
              ? "Same site — upgraded with schema, speed, AI layer, and lead capture (annotated fixes)."
              : "Your live site — red markers show gaps AI and Google hit today."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={!showAfter ? "default" : "secondary"}
            onClick={() => setShowAfter(false)}
          >
            Current Gaps
          </Button>
          <Button
            size="sm"
            variant={showAfter ? "default" : "secondary"}
            onClick={() => setShowAfter(true)}
          >
            Smart Site Fixes
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
              {cleanUrl}
            </div>
            <Badge
              variant="outline"
              className={
                showAfter
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-400"
              }
            >
              {showAfter ? "With Foundation" : "As-Is"}
            </Badge>
          </div>

          <div className="relative">
            {hasScreenshot ? (
              <div className="relative mx-auto max-h-[480px] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotUrl}
                  alt={`Screenshot of ${cleanUrl}`}
                  className={`w-full object-cover object-top transition ${
                    showAfter ? "brightness-105 saturate-110" : "opacity-95"
                  }`}
                  onError={() => setImgError(true)}
                />
                {showAfter && (
                  <div className="pointer-events-none absolute inset-0 bg-primary/5" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="relative p-8">
                <div className="mx-auto max-w-2xl space-y-4 opacity-60">
                  <div className="h-8 w-2/3 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted/80" />
                  <div className="h-4 w-5/6 rounded bg-muted/80" />
                  <p className="text-center text-xs text-muted-foreground">
                    Screenshot unavailable — annotations still apply to your live
                    site structure.
                  </p>
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
                  className={`group relative -translate-x-1/2 -translate-y-1/2 rounded-full p-1.5 ${
                    pin.status === "fixed"
                      ? "bg-primary/30 ring-2 ring-primary shadow-lg shadow-primary/30"
                      : "bg-destructive/30 ring-2 ring-destructive animate-pulse shadow-lg shadow-destructive/20"
                  }`}
                >
                  <span
                    className={`block h-3 w-3 rounded-full ${
                      pin.status === "fixed" ? "bg-primary" : "bg-destructive"
                    }`}
                  />
                  <div className="absolute left-1/2 top-full z-20 mt-2 hidden w-52 -translate-x-1/2 rounded-lg border border-border bg-popover p-2 text-xs shadow-xl group-hover:block">
                    <p className="font-semibold">{pin.label}</p>
                    <p className="text-muted-foreground">{pin.detail}</p>
                  </div>
                </div>
                {showAfter && pin.status === "fixed" && (
                  <div
                    className="pointer-events-none absolute -translate-x-1/2"
                    style={{ left: "50%", top: "-28px" }}
                  >
                    <span className="whitespace-nowrap rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                      FIX
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showAfter && (
            <div className="border-t border-border bg-card/90 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-primary">Smart Site Foundation</span>{" "}
                injects LocalBusiness schema, speeds up mobile load, adds service-area
                pages, and wires review + chat capture — without changing your brand.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
