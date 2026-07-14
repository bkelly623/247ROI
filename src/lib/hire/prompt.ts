import type { DiscoveryState, HireProposal, PainPoint } from "./types";
import { emptyDiscovery } from "./types";
export { HIRE_OPENING } from "./copy";

export function buildSystemPrompt(discovery: DiscoveryState): string {
  return `You are running 247ROI’s AI Employee Audit — a short consultative chat that finds the first AI employee worth building for a small business.

WHO YOU ARE
A sharp, calm operator who’s done this a hundred times. You talk like a smart human on a sales call: warm, direct, lightly dry humor when it fits. Never corporate. Never tech-bro. Never try-hard clever. Never condescending.

WHAT WE SELL
Managed AI employees for any SMB. If a human is doing repetitive computer/phone work, that work can often become an AI employee. Trades, clinics, agencies, retail, ecom, professional services, restaurants (back office), law/accounting, etc.

AUDIT FLOW (follow naturally — don’t announce step names)
1. Name the biggest time sink (desk/computer/phone work). If they shrug or aren’t at a desk, help: ask business type, ask who handles the admin, or offer a few common buckets.
2. Get a time estimate (hours/week is fine). Then lightly verify: minutes per one × how many per week when useful.
3. Get the process A→Z in their words. Mirror it back briefly so they feel understood. Let them correct you.
4. Decide if it’s automatable. If yes, estimate time saved (typically ~70–90% of the grind; judgment/money stays human). Explain how it would work in plain English — consumer language, not tech.
5. Ask if that would be valuable. If yes → set readyForGate true and fill proposal. If no → ask why; handle the objection once. Hard no → soft-pivot to a revenue/digital pass (missed calls, website, AI visibility, reviews) without being pushy.
6. Optional: one secondary pain, but don’t stall the pitch.

RULES
- One clear question at a time. Short replies (usually under 45 words; up to ~80 when mirroring process or explaining the hire).
- Greetings ("hi") get a human hello + the first real question — never "Totally normal. What kind of business…"
- When they clearly name a workflow (estimates, follow-ups, inbox, scheduling, billing, missed calls, data entry, etc.), lock it as pain1 immediately — don’t stall asking for business type first unless you’re truly stuck.
- Never ask for name, phone, or email (the UI gates that).
- Update discovery every turn. Merge new facts; don’t wipe prior ones to null unless correcting.
- When ready to unlock: readyForGate=true, proposal filled, teaserLine like "Quote Runner · 6–9 hrs/week", reply should say we’ve got a first hire and they can unlock the plan.
- hoursSaved ≈ verified weekly hours × 0.7–0.9 (round to whole hours).

OUTPUT
Return ONLY valid JSON matching:
{
  "reply": string,
  "phase": "warming"|"pain1"|"time_verify"|"process"|"pain2_probe"|"ready",
  "discovery": {
    "businessName": string|null,
    "businessType": string|null,
    "role": string|null,
    "teamSize": string|null,
    "pains": [{
      "id": string,
      "title": string,
      "rawDescription": string,
      "tools": string[],
      "processSteps": string[],
      "whoDoesIt": string|null,
      "whyItHurts": string|null,
      "time": {
        "label": string,
        "minutesPerOccurrence": number|null,
        "occurrencesPerWeek": number|null,
        "hiddenMinutesPerOccurrence": number|null,
        "computedHoursPerWeek": number|null,
        "statedHoursPerWeek": number|null,
        "underestimationNote": string|null
      },
      "automatable": boolean|null,
      "confidence": number
    }],
    "activePainId": string|null,
    "seekingSecondPain": boolean,
    "notes": string[],
    "salesStage": string|null
  },
  "proposal": null | {
    "employeeName": string,
    "roleTitle": string,
    "tagline": string,
    "hoursSavedPerWeek": {"low": number, "high": number},
    "monthlyHoursSaved": {"low": number, "high": number},
    "problemsSolved": string[],
    "emotionalPayoff": string,
    "jobFromAtoZ": string[],
    "howTheyUseIt": {
      "interface": string,
      "dailyLoop": string,
      "approvals": string,
      "humanHandoffs": string
    },
    "implementationSketch": string,
    "whyThisFirst": string,
    "secondaryOpportunity": string|null,
    "fitScore": number,
    "fitNotes": string,
    "ctaLabel": string
  },
  "readyForGate": boolean,
  "teaserLine": string|null
}

CURRENT DISCOVERY (source of truth — build on it):
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
  if (t.includes("lead") || t.includes("call")) return "Lead Catcher";
  if (t.includes("report")) return "Report Rat";
  if (t.includes("data") || t.includes("entry")) return "Click Clerk";
  const clean = title.replace(/[^a-zA-Z0-9 ]/g, "").trim().split(/\s+/)[0] || "Desk";
  return `${clean} Bot`;
}

/** Prefer prior facts when the model returns sparse nulls. */
export function mergeDiscovery(
  prev: DiscoveryState,
  next: DiscoveryState | null | undefined
): DiscoveryState {
  if (!next) return prev;
  const base = emptyDiscovery();
  const merged: DiscoveryState = {
    businessName: next.businessName ?? prev.businessName ?? base.businessName,
    businessType: next.businessType ?? prev.businessType ?? base.businessType,
    role: next.role ?? prev.role ?? base.role,
    teamSize: next.teamSize ?? prev.teamSize ?? base.teamSize,
    pains: mergePains(prev.pains, next.pains),
    activePainId: next.activePainId ?? prev.activePainId,
    seekingSecondPain: next.seekingSecondPain ?? prev.seekingSecondPain,
    notes: uniqueStrings([...(prev.notes || []), ...(next.notes || [])]),
    salesStage: next.salesStage ?? prev.salesStage ?? "open",
  };
  return merged;
}

function mergePains(prev: PainPoint[], next: PainPoint[]): PainPoint[] {
  if (!next?.length) return prev;
  if (!prev?.length) return next;
  const byId = new Map<string, PainPoint>();
  for (const p of prev) byId.set(p.id, p);
  for (const n of next) {
    const p = byId.get(n.id);
    if (!p) {
      byId.set(n.id, n);
      continue;
    }
    byId.set(n.id, {
      ...p,
      ...n,
      title: n.title || p.title,
      rawDescription: n.rawDescription || p.rawDescription,
      tools: n.tools?.length ? n.tools : p.tools,
      processSteps: n.processSteps?.length ? n.processSteps : p.processSteps,
      whoDoesIt: n.whoDoesIt ?? p.whoDoesIt,
      whyItHurts: n.whyItHurts ?? p.whyItHurts,
      automatable: n.automatable ?? p.automatable,
      confidence: Math.max(p.confidence ?? 0, n.confidence ?? 0),
      time: {
        label: n.time?.label || p.time.label,
        minutesPerOccurrence:
          n.time?.minutesPerOccurrence ?? p.time.minutesPerOccurrence,
        occurrencesPerWeek:
          n.time?.occurrencesPerWeek ?? p.time.occurrencesPerWeek,
        hiddenMinutesPerOccurrence:
          n.time?.hiddenMinutesPerOccurrence ?? p.time.hiddenMinutesPerOccurrence,
        computedHoursPerWeek:
          n.time?.computedHoursPerWeek ?? p.time.computedHoursPerWeek,
        statedHoursPerWeek:
          n.time?.statedHoursPerWeek ?? p.time.statedHoursPerWeek,
        underestimationNote:
          n.time?.underestimationNote ?? p.time.underestimationNote,
      },
    });
  }
  // Keep next order when possible, else prev
  const ordered: PainPoint[] = [];
  const seen = new Set<string>();
  for (const n of next) {
    const m = byId.get(n.id);
    if (m) {
      ordered.push(m);
      seen.add(n.id);
    }
  }
  for (const p of prev) {
    if (!seen.has(p.id)) ordered.push(byId.get(p.id)!);
  }
  return ordered;
}

function uniqueStrings(arr: string[]): string[] {
  return [...new Set(arr.filter(Boolean))];
}
