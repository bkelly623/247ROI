import type { Metadata } from "next";
import ServicesPage from "@/components/ServicesPage";

export const metadata: Metadata = {
  title: "Revenue Recovery Systems | 247ROI",
  description:
    "Missed-call capture, instant follow-up, booking, and reporting — revenue recovery systems for trades businesses.",
};

export default function ServicesRoutePage() {
  return <ServicesPage />;
}
