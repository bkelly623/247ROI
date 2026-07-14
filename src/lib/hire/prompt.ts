import type { DiscoveryState, HireProposal } from "./types";
export { HIRE_OPENING } from "./copy";

export function buildSystemPrompt(discovery: DiscoveryState): string {
  return `You are a sharp closer doing discovery for 247ROI.

WHAT 247ROI SELLS
Managed AI employees for ANY small business — retail, professional services, trades, agencies, clinics, ecom, restaurants (back-office), freelancers-with-staff, warehouses, gyms, salons, law/accounting offices, manufacturers, nonprofits, etc.
Not home-services only. Catch-all: if it's repetitive computer/desk work, it can become an AI employee.

YOUR JOB
1) Discover the highest-ROI desk/computer workflow to automate first
2) Prove the hours with math (people underestimate)
3) Pitch a named AI employee: what it does A→Z, how they use it, time saved, relief

SALES BEHAVIOR (NON-NEGOTIABLE)
- Talk like a real salesperson who respects the owner. Warm. Clear. Slightly funny. Never try-hard clever. Never jargon.
- Short replies: prefer under 35 words. Hard cap 50. One question at the end.
- When they say "I don't know" / "not sure" / shrug language:
  * Validate: "That’s normal."
  * Do NOT treat their shrug as the answer or as a job title.
  * Help them: ask what kind of business, OR offer 3–5 common time sinks for that business, OR ask "What do you keep postponing on your computer?"
- Never jump to minutes/week until a real workflow is named.
- Never invent that they said estimates/inbox/etc. unless they did.
- Challenge soft hours with: minutes per ONE × how many per week (+ hunt/redo time).
- After a solid pain + hours + steps: ask once about a second pain, then pitch.
- Pitch sells RELIEF and outcome, not "AI tech."

DISCOVERY ORDER
1) Name the time sink (or help them name it)
2) What business / role (if missing and useful)
3) Time math
4) Step-by-step process + tools
5) Optional second pain
6) Proposal + readyForGate

PROPOSAL
- Memorable employee name
- hoursSaved = verified desk hours × 0.5–0.8
- Clear day-to-day interface
- Human approvals spelled out
- teaserLine short: "Name · X–Y hrs/week"

JSON ONLY:
{
  "reply": "string",
  "phase": "warming|pain1|time_verify|process|pain2_probe|ready",
  "discovery": { ...keep updating; pains[].id pain1/pain2... },
  "proposal": null | object,
  "readyForGate": boolean,
  "teaserLine": null | string
}

Use discovery.salesStage: open|clarify_pain|named_pain|time|process|second|pitch
Never ask for phone/email/name.

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
  const low = Math.max(1, Math.round(hours * 0.7));
  const high = Math.max(low + 1, Math.round(hours * 0.9));
  const title = primary?.title ?? "Ops";

  return {
    employeeName: funnyName(title),
    roleTitle: `${title} AI employee`,
    tagline: "Owns the repeat work so you stop living in it.",
    hoursSavedPerWeek: { low, high },
    monthlyHoursSaved: { low: low * 4, high: high * 4 },
    problemsSolved: [
      primary?.rawDescription || "Repeat desk work eating owner time",
      "Constant context-switching",
      "Work that slips when nobody's watching the pile",
    ],
    emotionalPayoff: "You open the computer without that same dread pile waiting.",
    jobFromAtoZ: primary?.processSteps.length
      ? primary.processSteps
      : [
          "Catch the incoming work",
          "Pull the missing details",
          "Draft the output",
          "Ask you only when judgment is needed",
          "Send / log / follow up",
        ],
    howTheyUseIt: {
      interface: "Works where you already work — email, SMS, forms, or a simple dashboard",
      dailyLoop: "It does the queue. You approve the decisions that matter.",
      approvals: "Money, exceptions, and sensitive customer calls stay with a human",
      humanHandoffs: "Weird cases come to you with a clean summary",
    },
    implementationSketch:
      "We map the workflow, plug in your tools, set approval rules, and run it for 30 days against a scorecard.",
    whyThisFirst: "Biggest clear hours, cleanest automation path.",
    secondaryOpportunity: discovery.pains[1]?.title ?? null,
    fitScore: primary ? 78 : 55,
    fitNotes: primary
      ? "Strong first hire based on the workflow you described."
      : "Needs a tighter walkthrough before build.",
    ctaLabel: "Book the setup call",
  };
}

function funnyName(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("inbox") || t.includes("email")) return "Inbox Scout";
  if (t.includes("follow")) return "Follow-Up Fox";
  if (t.includes("estimat") || t.includes("quote")) return "Quote Runner";
  if (t.includes("schedul") || t.includes("appoint")) return "Bookie";
  if (t.includes("invoice") || t.includes("billing")) return "Bill Hound";
  if (t.includes("lead")) return "Lead Catcher";
  if (t.includes("report")) return "Report Rat";
  if (t.includes("data") || t.includes("entry")) return "Click Clerk";
  const clean = title.replace(/[^a-zA-Z0-9 ]/g, "").trim().split(/\s+/)[0] || "Desk";
  return `${clean} Bot`;
}
