import type { Metadata } from "next";
import ServicesPage from "@/components/ServicesPage";

export const metadata: Metadata = {
  title: "AI Employee Services | 247ROI",
  description:
    "Managed AI employees for service businesses: revenue response, estimator support, bid discipline, inbox operations, dashboards, and clean handoffs.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "AI Employee Services | 247ROI",
    description:
      "Managed AI employees for service businesses: revenue response, estimator support, bid discipline, inbox operations, dashboards, and clean handoffs.",
    url: "/services",
  },
};

export default function ServicesRoutePage() {
  return <ServicesPage />;
}
