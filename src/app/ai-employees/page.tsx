import type { Metadata } from "next";
import AiEmployeesPage from "@/components/AiEmployeesPage";

export const metadata: Metadata = {
  title: "AI Employees for Service Businesses | 247ROI",
  description:
    "Dedicated AI employee offers for lead response, follow-up, estimating support, bidding, takeoffs, and operations handoffs.",
};

export default function AiEmployeesRoutePage() {
  return <AiEmployeesPage />;
}
