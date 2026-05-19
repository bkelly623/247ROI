import type { Metadata } from "next";
import PlumbingLandingPage from "@/components/PlumbingLandingPage";

export const metadata: Metadata = {
  title: "Plumbing Missed-Call Recovery | 247ROI",
  description:
    "24/7 missed-call capture and instant follow-up for plumbing companies. No upfront setup cost for qualified businesses — continue only if it creates value.",
};

export default function PlumbingRoutePage() {
  return <PlumbingLandingPage />;
}
