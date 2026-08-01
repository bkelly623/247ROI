import type { Metadata } from "next";
import DemoPage from "@/components/DemoPage";

export const metadata: Metadata = {
  title: "AI Employee Workflow Examples | 247ROI",
  description: "See example AI employee workflows for follow-up, estimating support, bid intake, operations coordination, and approval-ready outputs.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "AI Employee Workflow Examples | 247ROI",
    description: "See example AI employee workflows for follow-up, estimating support, bid intake, operations coordination, and approval-ready outputs.",
    url: "/demo",
  },
};

export default function DemoRoutePage() {
  return <DemoPage />;
}
