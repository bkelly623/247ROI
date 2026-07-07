import type { AuditSection } from "@/lib/audit/types";
import { scoreColor, scoreLabel } from "@/lib/audit/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SectionScores({
  sections,
  compact,
}: {
  sections: AuditSection[];
  compact?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {sections.map((section) => {
        const score = section.score;
        const display = score !== null ? String(score) : "—";
        const label =
          score !== null ? scoreLabel(score) : section.measured ? "N/A" : "Not measured";

        return (
          <Card key={section.key} className="border-zinc-800/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{section.label}</CardTitle>
                <Badge
                  variant="outline"
                  className={
                    score === null
                      ? "border-zinc-600 text-zinc-500"
                      : score >= 70
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : score >= 45
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                  }
                >
                  {label}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">{section.plainQuestion}</p>
              {!compact && (
                <p className="text-[10px] text-zinc-600">{section.dataSource}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-end gap-2">
                <span
                  className="text-4xl font-bold"
                  style={{
                    color: score !== null ? scoreColor(score) : "#71717a",
                  }}
                >
                  {display}
                </span>
                {score !== null && (
                  <span className="mb-1 text-sm text-zinc-500">/ 100</span>
                )}
              </div>
              <p className="text-sm text-zinc-400">{section.summary}</p>
              <p className="mt-3 text-xs text-primary/90">
                Fix: {section.topFix}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
