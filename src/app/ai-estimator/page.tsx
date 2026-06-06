import type { Metadata } from "next";
import AiEmployeeLandingPage from "@/components/AiEmployeeLandingPage";
import { getAiEmployeeOffer } from "@/lib/aiEmployees";

export const metadata: Metadata = {
  title: "AI Estimator for Contractors | 247ROI",
  description:
    "AI estimating assistant for contractors: intake, photos, scope notes, quote-ready packets, and follow-up reminders.",
};

export default function AiEstimatorPage() {
  const offer = getAiEmployeeOffer("ai-estimator");
  if (!offer) return null;

  return <AiEmployeeLandingPage offer={offer} />;
}
