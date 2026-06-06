import type { Metadata } from "next";
import AiEmployeeLandingPage from "@/components/AiEmployeeLandingPage";
import { getAiEmployeeOffer } from "@/lib/aiEmployees";

export const metadata: Metadata = {
  title: "AI Follow-Up Agent | 247ROI",
  description:
    "AI follow-up employee for instant lead response, appointment reminders, estimate reactivation, and booked-call handoffs.",
};

export default function AiFollowUpAgentPage() {
  const offer = getAiEmployeeOffer("ai-follow-up-agent");
  if (!offer) return null;

  return <AiEmployeeLandingPage offer={offer} />;
}
