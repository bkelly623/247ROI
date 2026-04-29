import type { Metadata } from "next";
import PlumbingLandingPage from "@/components/PlumbingLandingPage";

export const metadata: Metadata = {
  title: "Plumbing AI Receptionist Case Study | 247ROI",
  description:
    "Apply for the 247ROI 30-day plumbing AI receptionist case study. No upfront setup cost, 24/7 missed-call recovery, lead qualification, follow-up, and result tracking.",
};

export default function PlumbingAiReceptionistRoutePage() {
  return <PlumbingLandingPage />;
}
