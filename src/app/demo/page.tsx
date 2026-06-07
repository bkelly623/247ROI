import type { Metadata } from "next";
import DemoPage from "@/components/DemoPage";

export const metadata: Metadata = {
  title: "AI Employee Workflow Examples | 247ROI",
  description: "See example AI employee workflows for lead response, estimating support, bid intake, receptionist coverage, and weekly scorecards.",
};

export default function DemoRoutePage() {
  return <DemoPage />;
}
