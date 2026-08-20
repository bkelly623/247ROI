import type { Metadata } from "next";
import { HireAuditFlow } from "@/components/hire/HireAuditFlow";

export const metadata: Metadata = {
  title: "AI Opportunity Map | 247ROI",
  description:
    "Find where AI can save time or create ROI in your business first. Get a practical opportunity map before buying another tool.",
  alternates: { canonical: "/hire" },
  openGraph: {
    title: "AI Opportunity Map | 247ROI",
    description:
      "Find where AI can save time or create ROI in your business first. Get a practical opportunity map before buying another tool.",
    url: "/hire",
  },
};

export default function HirePage() {
  return <HireAuditFlow />;
}
