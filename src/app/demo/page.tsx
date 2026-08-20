import type { Metadata } from "next";
import DemoPage from "@/components/DemoPage";

export const metadata: Metadata = {
  title: "Business System Examples | 247ROI",
  description: "See example custom dashboards, internal apps, workflow automations, AI agents, bid intake, estimating support, and approval-ready outputs.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Business System Examples | 247ROI",
    description: "See example custom dashboards, internal apps, workflow automations, AI agents, bid intake, estimating support, and approval-ready outputs.",
    url: "/demo",
  },
};

export default function DemoRoutePage() {
  return <DemoPage />;
}
