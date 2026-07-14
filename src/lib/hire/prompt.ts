import type { DiscoveryState, HireProposal } from "./types";
export { HIRE_OPENING } from "./copy";

export function buildSystemPrompt(discovery: DiscoveryState): string {
  return `You run the AI Employee Audit for 247ROI. You find the first AI employee that automates desk work.

VOICE
- Simple words. Short sentences. Sound human. Credible. Helpful. A little funny.
- Do NOT sound smart, fancy, corporate, or "AI-ish."
- Sell relief: stop hiring humans for robotic work.
- Use THEIR numbers only. No fake case studies.

REPLY STYLE (STRICT)
- Maximum 40 words per reply. Prefer under 25.
- 1–3 short lines. Blank line between lines is fine.
- End with ONE clear question (unless readyForGate).
- No bullet essays. No lectures.

DISCOVERY ORDER
1) Business type if unknown.
2) Biggest desk time sink (computer / paperwork). If stuck: estimates, follow-ups, inbox, scheduling, data entry.
3) TIME CHECK (required): minutes per one job × how many per week. Add hunt/redo/wait time. Do the math. Call out underestimates bluntly and funny.
4) How it works start to finish (steps). Tools. Who does it.
5) Ask once for a second time sink. Don't force it.
6) When you have steps + verified hours + a real automateable job → readyForGate=true + proposal.

PROPOSAL
- Fun employee name (not "AI Assistant").
- Hours saved = their desk hours × 50–80%.
- A→Z job steps, how they use it, what stays human.
- teaserLine: short, like "QuoteBot · 8–12 hrs/week back"

OUTPUT: JSON only
{
  "reply": "...",
  "phase": "warming|pain1|time_verify|process|pain2_probe|ready",
  "discovery": {updated},
  "proposal": null OR object,
  "readyForGate": boolean,
  "teaserLine": null OR string
}

Keep discovery fields updated. Stable pain ids: pain1, pain2.
computedHoursPerWeek = ((minutes + hiddenMinutes) * occurrencesPerWeek) / 60.
Never ask for name/phone/email. Never skip time math.

CURRENT DISCOVERY:
${JSON.stringify(discovery)}
`;
}

export function proposalFallback(discovery: DiscoveryState): HireProposal {
  const primary = discovery.pains[0];
  const hours =
    primary?.time.computedHoursPerWeek ??
    primary?.time.statedHoursPerWeek ??
    8;
  const low = Math.max(2, Math.round(hours * 0.5));
  const high = Math.max(low + 1, Math.round(hours * 0.75));

  return {
    employeeName: primary ? `${primary.title} Bot` : "Desk Relief Unit",
    roleTitle: primary?.title ?? "Operations Assistant",
    tagline: "Takes the desk grind so you can stop living in it.",
    hoursSavedPerWeek: { low, high },
    monthlyHoursSaved: { low: low * 4, high: high * 4 },
    problemsSolved: [
      primary?.rawDescription || "Repeatable desk work eating owner time",
      "Context-switching and after-hours catch-up",
      "Slow response / stalled admin loops",
    ],
    emotionalPayoff:
      "The quiet relief of opening your laptop and not dreading the same pile.",
    jobFromAtoZ: primary?.processSteps.length
      ? primary.processSteps
      : [
          "Ingest the incoming work item",
          "Structure the details",
          "Draft the next action",
          "Route for human approval when needed",
          "Log outcome and follow up",
        ],
    howTheyUseIt: {
      interface: "Chat / SMS / email thread attached to your existing tools",
      dailyLoop: "It queues work; you approve the consequential bits",
      approvals: "Pricing, edge cases, and customer-sensitive decisions stay human",
      humanHandoffs: "Exceptions escalate to you with a clean summary",
    },
    implementationSketch:
      "We map your workflow, connect intake channels, set approval rules, and put the employee on a 30-day scorecard.",
    whyThisFirst: "Highest verified desk-hours with the cleanest automation path.",
    secondaryOpportunity: discovery.pains[1]?.title ?? null,
    fitScore: primary ? 72 : 55,
    fitNotes: primary
      ? "Viable first hire based on stated workflow."
      : "Needs a live workflow walkthrough to tighten scope.",
    ctaLabel: "Book the install consult",
  };
}
