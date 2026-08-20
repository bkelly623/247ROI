import type { Metadata } from "next";
import { HireAuditFlow } from "@/components/hire/HireAuditFlow";

export const metadata: Metadata = {
  title: "Business Systems Audit | 247ROI",
  description:
    "Find the first workflow worth improving with AI, automation, or a cleaner business system. Get a practical diagnostic before anything is built.",
  alternates: { canonical: "/hire" },
  openGraph: {
    title: "Business Systems Audit | 247ROI",
    description:
      "Find the first workflow worth improving with AI, automation, or a cleaner business system. Get a practical diagnostic before anything is built.",
    url: "/hire",
  },
};

export default function HirePage() {
  return <HireAuditFlow />;
}
