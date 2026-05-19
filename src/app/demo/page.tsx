import type { Metadata } from "next";
import DemoPage from "@/components/DemoPage";

export const metadata: Metadata = {
  title: "Demo | 247ROI",
  description: "Call the demo line and see how 247ROI captures missed calls, follows up, and books jobs 24/7.",
};

export default function DemoRoutePage() {
  return <DemoPage />;
}
