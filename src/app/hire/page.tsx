import type { Metadata } from "next";
import { HireAuditFlow } from "@/components/hire/HireAuditFlow";

export const metadata: Metadata = {
  title: "AI Employee Audit | 247ROI",
  description:
    "Tap what’s stealing hours in your business. We’ll map the work, check the real time cost, and show if an AI employee can own it.",
};

export default function HirePage() {
  return <HireAuditFlow />;
}
