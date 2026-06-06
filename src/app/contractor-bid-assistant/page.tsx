import type { Metadata } from "next";
import AiEmployeeLandingPage from "@/components/AiEmployeeLandingPage";
import { getAiEmployeeOffer } from "@/lib/aiEmployees";

export const metadata: Metadata = {
  title: "AI Bid Assistant for Contractors | 247ROI",
  description:
    "AI bidding assistant for contractors: opportunity screening, requirements extraction, bid checklists, and deadline reminders.",
};

export default function ContractorBidAssistantPage() {
  const offer = getAiEmployeeOffer("ai-job-bidding-agent");
  if (!offer) return null;

  return <AiEmployeeLandingPage offer={offer} />;
}
