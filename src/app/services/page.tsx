import type { Metadata } from "next";
import ServicesPage from "@/components/ServicesPage";

export const metadata: Metadata = {
  title: "Business Systems, AI Agents & Automation Services | 247ROI",
  description:
    "Business systems consulting, AI agents, workflow automation, custom software, dashboards, and operational improvement for growing companies.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Business Systems, AI Agents & Automation Services | 247ROI",
    description:
      "Business systems consulting, AI agents, workflow automation, custom software, dashboards, and operational improvement for growing companies.",
    url: "/services",
  },
};

export default function ServicesRoutePage() {
  return <ServicesPage />;
}
