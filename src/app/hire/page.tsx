import type { Metadata } from "next";
import { HireAuditFlow } from "@/components/hire/HireAuditFlow";

export const metadata: Metadata = {
  title: "AI Employee Audit | 247ROI",
  description:
    "Interactive audit that finds your highest-ROI first AI employee — verified desk hours, workflow map, and a named hire plan.",
};

export default function HirePage() {
  return <HireAuditFlow />;
}
