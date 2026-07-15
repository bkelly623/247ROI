import type { DiscoveryState, HireProposal } from "./types";
import { impactFromNotes } from "./progress";

/** Fire-and-forget lead alert when someone unlocks a hire packet. */
export async function notifyHireUnlock(input: {
  sessionId: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  discovery: DiscoveryState;
  proposal: HireProposal;
}): Promise<void> {
  const url =
    process.env.HIRE_LEAD_WEBHOOK_URL ||
    process.env.ATHENA_WEBHOOK_URL ||
    process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const pain = input.discovery.pains.find((p) => p.id === "pain1");
  const impact = impactFromNotes(input.discovery.notes);
  const hours =
    pain?.time.computedHoursPerWeek ?? pain?.time.statedHoursPerWeek ?? null;

  const text = [
    `New hire audit unlock`,
    `${input.firstName}${input.lastName ? ` ${input.lastName}` : ""} · ${input.phone}`,
    input.email ? `Email: ${input.email}` : null,
    input.discovery.businessType
      ? `Industry: ${input.discovery.businessType}`
      : null,
    pain ? `Pain: ${pain.title}` : null,
    hours != null ? `Hours/wk: ${hours}` : null,
    `Hire: ${input.proposal.employeeName} (${input.proposal.hoursSavedPerWeek.low}–${input.proposal.hoursSavedPerWeek.high} hrs back)`,
    impact ? `Impact: ${impact}` : null,
    `Session: ${input.sessionId}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text,
        type: "hire_unlock",
        sessionId: input.sessionId,
        firstName: input.firstName,
        lastName: input.lastName || "",
        phone: input.phone,
        email: input.email || "",
        discovery: {
          businessType: input.discovery.businessType,
          pain: pain?.title ?? null,
          hours,
          impact,
        },
        proposal: {
          employeeName: input.proposal.employeeName,
          hoursSavedPerWeek: input.proposal.hoursSavedPerWeek,
        },
      }),
    });
  } catch (e) {
    console.error("hire notify failed", e);
  }
}
