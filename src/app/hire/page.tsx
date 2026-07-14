import type { Metadata } from "next";
import { HireAuditFlow } from "@/components/hire/HireAuditFlow";

export const metadata: Metadata = {
  title: "AI Employee Audit | 247ROI",
  description:
    "A short conversation to find the first AI employee worth hiring — with real hours and a clear plan.",
};

export default function HirePage() {
  return <HireAuditFlow />;
}
