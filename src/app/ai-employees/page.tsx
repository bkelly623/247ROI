import type { Metadata } from "next";
import AiEmployeesPage from "@/components/AiEmployeesPage";

export const metadata: Metadata = {
  title: "Custom AI Employees for Service Businesses | 247ROI",
  description:
    "247ROI builds custom AI employee software for almost any computer-based workflow: lead response, follow-up, estimating support, bidding, takeoffs, inboxes, reporting, and operations.",
  alternates: { canonical: "/ai-employees" },
  openGraph: {
    title: "Custom AI Employees for Service Businesses | 247ROI",
    description:
      "247ROI builds custom AI employee software for almost any computer-based workflow: lead response, follow-up, estimating support, bidding, takeoffs, inboxes, reporting, and operations.",
    url: "/ai-employees",
  },
};

export default function AiEmployeesRoutePage() {
  return <AiEmployeesPage />;
}
