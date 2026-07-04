import { Suspense } from "react";
import type { Metadata } from "next";
import { AuditFlow } from "@/components/audit/AuditFlow";

export const metadata: Metadata = {
  title: "Free AI Infrastructure Blueprint | 247ROI",
  description:
    "Run a free audit on your website. See if AI and Google can find your business — and what to fix first.",
};

export default function AuditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Loading...
        </div>
      }
    >
      <AuditFlow />
    </Suspense>
  );
}
