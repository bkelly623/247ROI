import type { Metadata } from "next";
import { HireAuditFlow } from "@/components/hire/HireAuditFlow";

export const metadata: Metadata = {
  title: "AI Employee Audit | 247ROI",
  description:
    "We start with your industry, find where desk time disappears, then name the AI employee worth hiring first.",
};

export default function HirePage() {
  return <HireAuditFlow />;
}
