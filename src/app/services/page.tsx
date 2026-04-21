import type { Metadata } from "next";
import ServicesPage from "@/components/ServicesPage";

export const metadata: Metadata = {
  title: "AI & Automation Services | 247ROI",
  description:
    "AI receptionist, review generation, web design, and automation — systems that capture revenue around the clock.",
};

export default function ServicesRoutePage() {
  return <ServicesPage />;
}
