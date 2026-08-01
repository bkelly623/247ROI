import type { Metadata } from "next";
import AiEmployeesPage from "@/components/AiEmployeesPage";

export const metadata: Metadata = {
  title: "AI Employees for Service Businesses | 247ROI",
  description:
    "Dedicated AI employee offers for lead response, follow-up, estimating support, bidding, takeoffs, and operations handoffs.",
  alternates: { canonical: "/ai-employees" },
  openGraph: {
    title: "AI Employees for Service Businesses | 247ROI",
    description:
      "Dedicated AI employee offers for lead response, follow-up, estimating support, bidding, takeoffs, and operations handoffs.",
    url: "/ai-employees",
  },
};

export default function AiEmployeesRoutePage() {
  return <AiEmployeesPage />;
}
