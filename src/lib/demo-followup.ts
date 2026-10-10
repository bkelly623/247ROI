/** Eligibility only. This function never sends, queues, or claims a follow-up text. */
export type DemoAudience = "demo_prospect" | "support" | "existing_customer" | "vendor" | "wrong_number" | "spam" | "unknown";
export type DemoBooking = "no_booking" | "booked" | "uncertain";
export type DemoFollowupFacts = {
  confirmedDemoProspect: boolean;
  explicitSmsPermission: boolean;
  recipient: string;
  callCompleted: boolean;
  booking: DemoBooking;
  previousFollowupClaim: boolean;
  audience: DemoAudience;
  optedOut: boolean;
  declined: boolean;
  duplicateCallback: boolean;
  model?: { booking?: DemoBooking; audience?: DemoAudience; smsPermission?: boolean };
};
export type DemoFollowupDecision = { eligible: boolean; delivery: "off"; reason: string };

const recipientKnown = (value: string) => /^\+[1-9]\d{7,14}$/.test(value);

export function demoFollowupEligibility(facts: DemoFollowupFacts): DemoFollowupDecision {
  const blocked = (reason: string): DemoFollowupDecision => ({ eligible: false, delivery: "off", reason });
  if (facts.duplicateCallback) return blocked("duplicate_callback");
  if (facts.optedOut || facts.declined) return blocked("opt_out_or_decline");
  if (!facts.explicitSmsPermission) return blocked("sms_permission_required");
  if (!facts.confirmedDemoProspect) return blocked("demo_prospect_required");
  if (facts.audience !== "demo_prospect") return blocked("audience_excluded");
  if (!recipientKnown(facts.recipient)) return blocked("recipient_unknown");
  if (!facts.callCompleted) return blocked("call_not_completed");
  if (facts.booking === "booked") return blocked("appointment_booked");
  if (facts.booking !== "no_booking") return blocked("booking_uncertain");
  if (facts.previousFollowupClaim) return blocked("followup_already_claimed");
  return { eligible: true, delivery: "off", reason: "eligible_delivery_off" };
}
