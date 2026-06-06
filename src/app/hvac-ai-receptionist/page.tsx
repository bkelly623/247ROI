import type { Metadata } from "next";
import AiEmployeeLandingPage from "@/components/AiEmployeeLandingPage";
import { getAiEmployeeOffer, type AiEmployeeOffer } from "@/lib/aiEmployees";

export const metadata: Metadata = {
  title: "HVAC AI Receptionist | 247ROI",
  description:
    "24/7 AI receptionist for HVAC companies that captures after-hours calls, urgent service requests, tune-ups, and replacement inquiries.",
};

export default function HvacAiReceptionistPage() {
  const base = getAiEmployeeOffer("ai-receptionist");
  if (!base) return null;

  const offer: AiEmployeeOffer = {
    ...base,
    title: "HVAC AI Receptionist",
    shortTitle: "HVAC Receptionist",
    eyebrow: "HVAC missed-call recovery",
    headline: "Book more HVAC calls after hours, during rushes, and between dispatches.",
    subheadline:
      "A 24/7 AI receptionist for HVAC companies that captures service calls, urgency, system details, availability, and replacement inquiries before the lead calls the next company.",
    bestFor:
      "HVAC companies missing calls during heat waves, cold snaps, installs, lunch rushes, weekends, and after-hours service windows.",
    route: "/hvac-ai-receptionist",
    painPoints: [
      "Emergency calls hit voicemail when demand spikes",
      "Replacement leads do not get captured with enough detail",
      "Dispatchers lose time collecting the same system and availability info",
    ],
    handles: ["After-hours answering", "System detail capture", "Urgency routing", "Tune-up booking prompts", "Replacement lead summaries"],
    outcomes: ["More service calls captured", "Cleaner dispatch notes", "Faster urgent handoffs", "More replacement inquiries preserved"],
  };

  return <AiEmployeeLandingPage offer={offer} />;
}
