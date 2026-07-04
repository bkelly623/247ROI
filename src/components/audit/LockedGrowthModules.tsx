import { Lock, Star, Share2, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/audit/config";

const MODULES = [
  {
    id: "seo",
    title: "SEO Growth Engine",
    icon: Star,
    preview: (
      <div className="space-y-2 p-2">
        <div className="flex justify-between text-xs">
          <span>Keyword rank</span>
          <span className="text-primary">↑ 12</span>
        </div>
        <div className="h-16 rounded bg-muted/80" />
        <div className="h-2 w-3/4 rounded bg-muted/60" />
      </div>
    ),
  },
  {
    id: "social",
    title: "Social Authority Pipeline",
    icon: Share2,
    preview: (
      <div className="grid grid-cols-3 gap-1 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-square rounded bg-muted/80" />
        ))}
      </div>
    ),
  },
  {
    id: "voice",
    title: "AI Receptionist",
    icon: Phone,
    preview: (
      <div className="space-y-2 p-2">
        <div className="rounded-lg bg-muted/80 p-2 text-[10px]">
          Incoming call answered · Lead qualified
        </div>
        <div className="h-2 w-1/2 rounded bg-muted/60" />
      </div>
    ),
  },
];

export function LockedGrowthModules() {
  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        Additional Growth Modules
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Included in AI Visibility Growth Program — unlock after Smart Site
        Foundation.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {MODULES.map(({ id, title, icon: Icon, preview }) => (
          <Card
            key={id}
            className="relative overflow-hidden border-amber-500/20 bg-card/50"
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Icon className="h-4 w-4 text-primary" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="blurred-preview rounded-lg border border-border bg-muted/40">
                {preview}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/75 backdrop-blur-[2px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 ring-2 ring-amber-500">
                  <Lock className="h-5 w-5 text-amber-400" />
                </div>
                <p className="mt-3 text-xs font-medium text-amber-400">
                  Unlocks with Foundation
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 border-amber-500/40 text-xs"
                  asChild
                >
                  <a href={BRAND.phoneHref}>Ask About This Module</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
