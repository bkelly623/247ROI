import type { Metadata } from "next";
import { HireAuditFlow } from "@/components/hire/HireAuditFlow";

export const metadata: Metadata = {
  title: "AI Employee Audit | 247ROI",
  description:
    "A real conversation to uncover what an AI employee should own in your business — then unlock a clear first hire plan.",
};

export default function HirePage() {
  return <HireAuditFlow />;
}
