import type { Metadata } from "next";
import { HireAuditFlow } from "@/components/hire/HireAuditFlow";

export const metadata: Metadata = {
  title: "AI Readiness Check | 247ROI",
  description:
    "Most owners lose 10–20 hours a week on work AI can handle. Find your first AI employee.",
};

export default function HirePage() {
  return <HireAuditFlow />;
}
