import type { Metadata } from "next";
import ServicesPage from "@/components/ServicesPage";

export const metadata: Metadata = {
  title: "Business Systems, AI Agents & Automation Services | 247ROI",
  description:
    "Custom workflow automations, dashboards, internal apps, AI agents, and business systems for owners and operators who need cleaner operations.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Business Systems, AI Agents & Automation Services | 247ROI",
    description:
      "Custom workflow automations, dashboards, internal apps, AI agents, and business systems for owners and operators who need cleaner operations.",
    url: "/services",
  },
};

export default function ServicesRoutePage() {
  return <ServicesPage />;
}
