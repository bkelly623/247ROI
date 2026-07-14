import type { DiscoveryState, HireProposal, PainPoint } from "./types";
import { emptyDiscovery } from "./types";
export { HIRE_OPENING } from "./copy";

/** Industry-specific time sinks — for prompt + offline fallback. */
export function industryExamples(businessType: string | null | undefined): string[] {
  const t = (businessType || "").toLowerCase();

  if (/roof|plumb|hvac|electric|contrac|landscap|pest|clean|paint|remodel|construct|handyman/.test(t)) {
    return [
      "missed calls / slow lead response",
      "estimates & follow-ups that never close",
      "scheduling / dispatch juggling",
      "invoice chase after the job",
    ];
  }
  if (/dental|medico|clinic|chiro|vet|therapy|physic|optom|health|wellness/.test(t)) {
    return [
      "appointment reminders & no-show chase",
      "intake / insurance paperwork",
      "patient follow-ups after visits",
      "inbox and voicemail triage",
    ];
  }
  if (/law|attorney|legal|account|bookkeep|cpa|tax|insur|mortgage|financ|real.?estate|realtor/.test(t)) {
    return [
      "client intake & document chase",
      "follow-ups on proposals / retainers",
      "scheduling consults",
      "status updates nobody has time to write",
    ];
  }
  if (/salon|spa|barber|gym|studio|beauty|tattoo/.test(t)) {
    return [
      "booking & reschedules",
      "no-show / rebook texts",
      "review requests",
      "membership / package follow-ups",
    ];
  }
  if (/restaurant|cafe|bar|food|cater|hotel|motel|hospitality/.test(t)) {
    return [
      "reservations & private-event follow-ups",
      "vendor / inventory admin",
      "staff schedule chaos",
      "review replies & inbox",
    ];
  }
  if (/agency|market|seo|ad.?agency|creative|design|media|pr\b/.test(t)) {
    return [
      "proposal writing & scope follow-ups",
      "client status reporting",
      "lead nurture that dies in the inbox",
      "onboarding checklists",
    ];
  }
  if (/e-?comm|shopify|amazon|retail|store|wholesale|d2c/.test(t)) {
    return [
      "customer service tickets / DMs",
      "order exception handling",
      "review & return follow-ups",
      "inventory / listing busywork",
    ];
  }
  if (/auto|dealership|mechanic|detail|tire/.test(t)) {
    return [
      "service appointment booking",
      "estimate follow-ups",
      "reminder texts",
      "review requests after service",
    ];
  }
  if (/school|tutor|coach|consult|freelance|saas|software|nonprofit|church/.test(t)) {
    return [
      "lead / inquiry response",
      "scheduling calls",
      "proposal or invoice follow-ups",
      "onboarding admin",
    ];
  }

  return [
    "follow-ups that fall through the cracks",
    "inbox / messages / voicemail",
    "scheduling & rescheduling",
    "quotes, invoices, or admin busywork",
  ];
}

export function buildSystemPrompt(discovery: DiscoveryState): string {
  const examples = industryExamples(discovery.businessType);
  const hasIndustry = Boolean(discovery.businessType?.trim());
  const hasDeskTime = Boolean(
    discovery.notes?.includes("desk_time_captured") ||
      discovery.pains.some(
        (p) =>
          p.time.statedHoursPerWeek != null || p.time.computedHoursPerWeek != null
      )
  );

  return `You are 247ROI’s AI Employee Audit — a conversion machine disguised as a helpful, engaging discovery chat.

WHO YOU REALLY ARE
A master closer running a consultative audit. Warm. Curious. Confident. Lightly dry humor when it fits. You make the owner feel understood, then inevitable that an AI employee belongs on their team. Never corporate. Never tech-bro. Never pushy-sleazy. Never condescending. Helpful first — always steering toward a hire.

WHAT WE SELL
Managed AI employees for SMB ops: the repeat desk/phone work humans shouldn’t still be grinding. Later (only if this hire dies): revenue passes — missed calls, website, AI visibility, reviews.

NON-NEGOTIABLE DISCOVERY ORDER
Do not skip ahead. Do not invent steps. One question at a time.

1) INDUSTRY FIRST
   - If discovery.businessType is empty: that is question #1. Ask what kind of business / industry.
   - Greetings (“hi”) → friendly hello + industry question.
   - As soon as they answer, set discovery.businessType (short label, e.g. "roofing", "dental", "marketing agency").
   - Next turn must acknowledge the industry and tailor everything after this.

2) DESK / COMPUTER TIME
   - Only after industry is known.
   - Ask how much time they (or their team) spend at a desk / on a computer / on the phone doing admin each day or week.
   - If they say “a lot” — pin a number. “Ballpark hours per week is fine.”
   - If they’re barely at a desk: ask who handles the computer/paperwork side, then ask THAT person’s time load.
   - Store hours on pains[0].time.statedHoursPerWeek when you get a number (create a temporary pain titled "Desk / computer time" if needed). Add note "desk_time_captured".

3) WHAT EATS THAT TIME (highest-ROI task)
   - Only after you have industry + a sense of desk time.
   - Ask what they’re doing in that time — what takes most of it.
   - Offer 3–4 INDUSTRY-SPECIFIC examples as help if they shrug (never a wall of 10).
   - For THIS lead’s industry, good examples include: ${examples.map((e) => `"${e}"`).join(", ")}.
   - Lock the biggest task as pain1 with a clean title + rawDescription.
   - Lightly verify: minutes per one × how many per week when useful.

4) PROCESS + MIRROR
   - Get A→Z in their words. Mirror it back briefly. Let them correct you.

5) VALUE → CLOSE
   - If automatable: estimate hours saved (~70–90% of the grind; judgment/money stays human).
   - Explain how the AI employee would do it in plain English (consumer language).
   - Ask: would that be valuable?
   - Yes / soft yes → readyForGate=true, fill proposal, teaserLine like "Estimate Closer · 8–11 hrs/week".
   - No → one objection handle. Hard no → soft pivot to revenue/digital pass.

SALESCRAFT
- Reflect their words. Make them feel smart for noticing the waste.
- Industry language when you know it (trades ≠ clinics ≠ agencies).
- Short replies: usually under 45 words; up to ~90 when mirroring or pitching the hire.
- Never ask for name / phone / email (UI gate handles that).
- Never wipe known discovery fields to null.
- Never jump to “what’s your biggest pain?” before industry + desk time.
- Current flags: industryKnown=${hasIndustry}, deskTimeKnown=${hasDeskTime}.

OUTPUT — valid JSON only:
{
  "reply": string,
  "phase": "warming"|"pain1"|"time_verify"|"process"|"pain2_probe"|"ready",
  "discovery": { ...full updated discovery... },
  "proposal": null | { employeeName, roleTitle, tagline, hoursSavedPerWeek{low,high}, monthlyHoursSaved{low,high}, problemsSolved[], emotionalPayoff, jobFromAtoZ[], howTheyUseIt{interface,dailyLoop,approvals,humanHandoffs}, implementationSketch, whyThisFirst, secondaryOpportunity, fitScore, fitNotes, ctaLabel },
  "readyForGate": boolean,
  "teaserLine": string|null
}

CURRENT DISCOVERY (build on this — do not erase):
${JSON.stringify(discovery)}
`;
}

export function proposalFallback(discovery: DiscoveryState): HireProposal {
  const primary = discovery.pains.find((p) => p.id === "pain1") ?? discovery.pains[0];
  const hours =
    primary?.time.computedHoursPerWeek ??
    primary?.time.statedHoursPerWeek ??
    8;
  const low = Math.max(1, Math.round(hours * 0.7));
  const high = Math.max(low + 1, Math.round(hours * 0.9));
  const title = primary?.title ?? "Ops";
  const industry = discovery.businessType ? ` for ${discovery.businessType}` : "";

  return {
    employeeName: funnyName(title),
    roleTitle: `${title} AI employee`,
    tagline: `Owns the repeat work${industry} so humans stop living in it.`,
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
    whyThisFirst: "Biggest clear hours, cleanest automation path for this industry.",
    secondaryOpportunity: discovery.pains[1]?.title ?? null,
    fitScore: primary ? 78 : 55,
    fitNotes: primary
      ? `Strong first hire${industry} based on the workflow you described.`
      : "Needs a tighter walkthrough before build.",
    ctaLabel: "Book the setup call",
  };
}

function funnyName(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("inbox") || t.includes("email")) return "Inbox Scout";
  if (t.includes("follow") || t.includes("chas")) return "Follow-Up Fox";
  if (t.includes("estimat") || t.includes("quote")) return "Quote Runner";
  if (t.includes("schedul") || t.includes("appoint") || t.includes("book")) return "Bookie";
  if (t.includes("invoice") || t.includes("billing")) return "Bill Hound";
  if (t.includes("lead") || t.includes("call")) return "Lead Catcher";
  if (t.includes("report")) return "Report Rat";
  if (t.includes("data") || t.includes("entry")) return "Click Clerk";
  if (t.includes("desk") || t.includes("computer")) return "Desk Dealer";
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
  return {
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
