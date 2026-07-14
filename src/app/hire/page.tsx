import type { Metadata } from "next";
import { HireAuditFlow } from "@/components/hire/HireAuditFlow";

export const metadata: Metadata = {
  title: "AI Employee Audit | 247ROI",
  description:
    "Find the first AI employee worth hiring for your small business. Short discovery. Clear hours. Real hire plan.",
};

export default function HirePage() {
  return <HireAuditFlow />;
}
