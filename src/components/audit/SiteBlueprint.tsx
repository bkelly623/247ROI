"use client";

import { useState } from "react";
import type { SiteAnnotation } from "@/lib/audit/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SiteBlueprintProps {
  businessName: string;
  websiteUrl: string;
  before: SiteAnnotation[];
  after: SiteAnnotation[];
}

export function SiteBlueprint({
  businessName,
  websiteUrl,
  before,
  after,
}: SiteBlueprintProps) {
  const [showAfter, setShowAfter] = useState(false);
  const annotations = showAfter ? after : before;

  return (
    <Card className="overflow-hidden border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-zinc-800/80 bg-zinc-900/50">
        <div>
          <CardTitle>Site Infrastructure Blueprint</CardTitle>
          <p className="text-sm text-zinc-500">
            {businessName} · {websiteUrl.replace(/^https?:\/\//, "")}
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
        <div className="relative min-h-[320px] bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
          {/* Mock browser chrome */}
          <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            </div>
            <div className="flex-1 rounded-md bg-zinc-900 px-3 py-1 text-xs text-zinc-500">
              {showAfter ? "smart-site.247roi.preview" : websiteUrl.replace(/^https?:\/\//, "")}
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

          {/* Mock page layout */}
          <div className="relative p-8">
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="h-8 w-2/3 rounded bg-zinc-800/80" />
              <div className="h-4 w-full rounded bg-zinc-800/50" />
              <div className="h-4 w-5/6 rounded bg-zinc-800/50" />
              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="h-20 rounded-lg bg-zinc-800/40" />
                <div className="h-20 rounded-lg bg-zinc-800/40" />
                <div className="h-20 rounded-lg bg-zinc-800/40" />
              </div>
              <div className="h-32 rounded-xl bg-zinc-800/30" />
            </div>

            {annotations.map((pin) => (
              <div
                key={pin.id}
                className="absolute"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                <div
                  className={`group relative -translate-x-1/2 -translate-y-1/2 rounded-full p-1 ${
                    pin.status === "fixed"
                      ? "bg-emerald-500/20 ring-2 ring-emerald-500"
                      : "bg-red-500/20 ring-2 ring-red-500 animate-pulse"
                  }`}
                >
                  <span className="block h-3 w-3 rounded-full bg-current opacity-80" />
                  <div className="absolute left-1/2 top-full z-10 mt-2 hidden w-44 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-xs shadow-xl group-hover:block">
                    <p className="font-medium text-zinc-100">{pin.label}</p>
                    <p className="text-zinc-500">{pin.detail}</p>
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
