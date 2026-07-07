"use client";

import { Bot, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AIProbeResult } from "@/lib/audit/types";

const PROVIDER_COLORS: Record<string, string> = {
  ChatGPT: "border-emerald-500/30 bg-emerald-500/5",
  Claude: "border-orange-500/30 bg-orange-500/5",
  Gemini: "border-blue-500/30 bg-blue-500/5",
};

export function AIMirrorPanel({
  aiMirror,
  businessName,
}: {
  aiMirror: AIProbeResult;
  businessName: string;
}) {
  const byProvider = aiMirror.queries.reduce(
    (acc, q) => {
      if (!acc[q.providerLabel]) acc[q.providerLabel] = [];
      acc[q.providerLabel].push(q);
      return acc;
    },
    {} as Record<string, typeof aiMirror.queries>
  );

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Live AI Visibility — Real Queries
        </CardTitle>
        <p className="text-sm text-muted-foreground">{aiMirror.summary.verdict}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge
            variant="outline"
            className={
              aiMirror.summary.mentionRate > 0
                ? "border-emerald-500/40 text-emerald-400"
                : "border-red-500/40 text-red-400"
            }
          >
            {businessName} mentioned in {aiMirror.summary.mentionCount}/
            {aiMirror.summary.totalQueries} queries
          </Badge>
          {aiMirror.summary.configuredProviders.map((p) => (
            <Badge key={p} variant="secondary" className="text-xs">
              {p} ✓
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {Object.entries(byProvider).map(([provider, queries]) => {
            const mentioned = queries.some((q) => q.mentionedClient);
            const ok = queries.some((q) => q.status === "ok");
            return (
              <div
                key={provider}
                className={`rounded-xl border p-4 ${PROVIDER_COLORS[provider] ?? "border-border"}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold">{provider}</p>
                  {!ok ? (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  ) : mentioned ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                {queries
                  .filter((q) => q.status === "ok" && q.response)
                  .slice(0, 1)
                  .map((q) => (
                    <div key={q.query}>
                      <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                        Asked: {q.query.slice(0, 60)}…
                      </p>
                      <p className="line-clamp-6 text-sm leading-relaxed text-foreground/90">
                        {q.response}
                      </p>
                      <p className="mt-2 text-xs font-medium">
                        {q.mentionedClient ? (
                          <span className="text-emerald-400">
                            ✓ Recommends {businessName}
                          </span>
                        ) : (
                          <span className="text-red-400">
                            ✗ {businessName} not mentioned
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                {queries.every((q) => q.status === "not_configured") && (
                  <p className="text-xs text-muted-foreground">API key not configured</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
