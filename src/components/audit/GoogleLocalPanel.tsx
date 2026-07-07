"use client";

import { MapPin, Star, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GoogleLocalProbe } from "@/lib/audit/types";

export function GoogleLocalPanel({
  googleLocal,
  businessName,
}: {
  googleLocal: GoogleLocalProbe;
  businessName: string;
}) {
  const results = googleLocal.primaryResults;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Google Local Results — Real Search
        </CardTitle>
        <p className="text-sm text-muted-foreground">{googleLocal.summary}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline" className="text-xs">
            Query: &quot;{googleLocal.primaryQuery}&quot;
          </Badge>
          {googleLocal.inMapPack ? (
            <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
              In map pack
            </Badge>
          ) : googleLocal.clientPosition ? (
            <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-400">
              Position #{googleLocal.clientPosition}
            </Badge>
          ) : (
            <Badge className="border-red-500/40 bg-red-500/10 text-red-400">
              Not in top results
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!googleLocal.configured ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Add SERPAPI_KEY or GOOGLE_PLACES_API_KEY to Vercel for live Google
            local results.
          </p>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No local results returned for this query.
          </p>
        ) : (
          <div className="space-y-2">
            {results.slice(0, 8).map((r) => (
              <div
                key={`${r.position}-${r.name}`}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  r.isClient
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card/50"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    r.position <= 3
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.position}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.name}</p>
                  {r.address && (
                    <p className="truncate text-xs text-muted-foreground">
                      {r.address}
                    </p>
                  )}
                </div>
                {r.rating && (
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    <Star className="h-3 w-3 fill-current" />
                    {r.rating}
                    {r.reviewCount && (
                      <span className="text-muted-foreground">
                        ({r.reviewCount})
                      </span>
                    )}
                  </div>
                )}
                {r.isClient ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-muted-foreground/30" />
                )}
              </div>
            ))}
            {!results.some((r) => r.isClient) && (
              <p className="pt-2 text-center text-sm font-medium text-red-400">
                {businessName} is not in these results — competitors are capturing
                the clicks.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
