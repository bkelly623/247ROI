import type { AuditSection } from "@/lib/audit/types";
import { scoreColor, scoreLabel } from "@/lib/audit/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SectionScores({ sections }: { sections: AuditSection[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {sections.map((section) => (
        <Card key={section.key} className="border-zinc-800/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{section.label}</CardTitle>
              <Badge
                variant="outline"
                className={
                  section.score >= 70
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : section.score >= 45
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                }
              >
                {scoreLabel(section.score)}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500">{section.plainQuestion}</p>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-end gap-2">
              <span
                className="text-4xl font-bold"
                style={{ color: scoreColor(section.score) }}
              >
                {section.score}
              </span>
              <span className="mb-1 text-sm text-zinc-500">/ 100</span>
            </div>
            <p className="text-sm text-zinc-400">{section.summary}</p>
            <p className="mt-3 text-xs text-primary/90">
              Fix: {section.topFix}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
