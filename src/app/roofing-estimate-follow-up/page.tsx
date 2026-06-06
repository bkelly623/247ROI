import type { Metadata } from "next";
import AiEmployeeLandingPage from "@/components/AiEmployeeLandingPage";
import { getAiEmployeeOffer, type AiEmployeeOffer } from "@/lib/aiEmployees";

export const metadata: Metadata = {
  title: "Roofing Estimate Follow-Up AI | 247ROI",
  description:
    "AI follow-up for roofing companies: estimate reminders, storm lead response, inspection booking, and stale quote reactivation.",
};

export default function RoofingEstimateFollowUpPage() {
  const base = getAiEmployeeOffer("ai-follow-up-agent");
  if (!base) return null;

  const offer: AiEmployeeOffer = {
    ...base,
    title: "Roofing Estimate Follow-Up AI",
    shortTitle: "Roofing Follow-Up",
    eyebrow: "Roofing pipeline recovery",
    headline: "Stop letting roofing estimates die after the first touch.",
    subheadline:
      "An AI follow-up employee for roofing companies that responds to storm leads, books inspections, reminds homeowners, and reactivates open estimates until they reply or opt out.",
    bestFor:
      "Roofing companies with storm leads, inspection requests, open estimates, and homeowners who need multiple touches before booking.",
    route: "/roofing-estimate-follow-up",
    painPoints: [
      "Storm leads pile up faster than the team can respond",
      "Open estimates go cold without structured follow-up",
      "Inspection reminders and reschedules eat dispatcher time",
    ],
    handles: ["Storm lead response", "Inspection booking nudges", "Estimate reactivation", "Reminder texts", "Sales handoff notes"],
    outcomes: ["More inspections booked", "More estimates revived", "Fewer manual reminders", "Cleaner sales pipeline"],
  };

  return <AiEmployeeLandingPage offer={offer} />;
}
