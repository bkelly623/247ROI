import type { Metadata } from "next";
import { HireAuditFlow } from "@/components/hire/HireAuditFlow";

export const metadata: Metadata = {
  title: "Business Systems Audit & AI Opportunity Map | 247ROI",
  description:
    "Find the first business system worth improving with AI, automation, custom software, or better workflow design.",
  alternates: { canonical: "/hire" },
  openGraph: {
    title: "Business Systems Audit & AI Opportunity Map | 247ROI",
    description:
      "Find the first business system worth improving with AI, automation, custom software, or better workflow design.",
    url: "/hire",
  },
};

export default function HirePage() {
  return <HireAuditFlow />;
}
