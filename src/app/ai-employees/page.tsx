import type { Metadata } from "next";
import AiEmployeesPage from "@/components/AiEmployeesPage";

export const metadata: Metadata = {
  title: "AI Employees for Service Businesses | 247ROI",
  description:
    "Dedicated AI employee offers for missed calls, follow-up, estimating, bidding, takeoffs, and content — built around measurable ROI.",
};

export default function AiEmployeesRoutePage() {
  return <AiEmployeesPage />;
}
