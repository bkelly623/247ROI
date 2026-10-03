import type { Metadata } from "next";
import DemoPage from "@/components/DemoPage";

export const metadata: Metadata = {
  title: "Business System Examples | 247ROI",
  description: "Try an interactive sample dashboard and approval workflow. Explore missed-call text back and AI receptionist examples.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Business System Examples | 247ROI",
    description: "Try an interactive sample dashboard and approval workflow. Explore missed-call text back and AI receptionist examples.",
    url: "/demo",
  },
};

export default function DemoRoutePage() {
  return <DemoPage />;
}
