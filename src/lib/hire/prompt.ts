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
  if (/dental|clinic|chiro|vet|therapy|physic|optom|medico|medical(?!\s*spa)/.test(t) && !/spa|salon|barber|gym|beauty|tattoo/.test(t)) {
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
  if (/salon|spa|barber|gym|studio|beauty|tattoo|mespa|medspa/.test(t)) {
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

/** Clean display label so we never say "Great… a mespa!" */
export function normalizeIndustryLabel(raw: string): string {
  let s = raw.trim().replace(/\s+/g, " ");
  s = s.replace(/^(i('?m| am) (in|a|an|the)\s+)/i, "");
  s = s.replace(/^(we('?re| are) (a|an|the)\s+)/i, "");
  s = s.replace(/^(a|an|the)\s+/i, "");
  const lower = s.toLowerCase();
  const aliases: Record<string, string> = {
    mespa: "med spa",
    "me spa": "med spa",
    medspa: "med spa",
    "med-spa": "med spa",
    roof: "roofing",
    roofer: "roofing",
    hvac: "HVAC",
    cpa: "accounting",
    "real estate": "real estate",
    ecommerce: "ecommerce",
    "e-commerce": "ecommerce",
  };
  if (aliases[lower]) return aliases[lower];
  // Title-ish case for short labels
  if (s.length <= 32) {
    return s
      .split(" ")
      .map((w) => {
        if (/^(hvac|seo|cpa|ai)$/i.test(w)) return w.toUpperCase();
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(" ");
  }
  return s;
}

/** Question 2 after industry — what first, not hours. */
export function askWhatEatsTime(industryLabel: string): string {
  const examples = industryExamples(industryLabel).slice(0, 3).join(", ");
  return `Got it — ${industryLabel}.\nMost owners underestimate what AI can already take off their plate.\n\nWhat’s eating time at a desk or on a computer each week that a human probably shouldn’t still be doing?\n\nIn ${industryLabel}, it’s often ${examples} — or tell me what’s worse.`;
}

export function buildSystemPrompt(discovery: DiscoveryState): string {
  const examples = industryExamples(discovery.businessType);
  const hasIndustry = Boolean(discovery.businessType?.trim());
  const hasTask = Boolean(
    discovery.notes?.includes("task_captured") ||
      discovery.pains.some(
        (p) => p.id === "pain1" && p.title && !/^desk|computer time$/i.test(p.title)
      )
  );
  const hasTime = Boolean(
    discovery.notes?.includes("desk_time_captured") ||
      discovery.pains.some(
        (p) =>
          p.id === "pain1" &&
          (p.time.statedHoursPerWeek != null || p.time.computedHoursPerWeek != null)
      )
  );

  return `You are 247ROI’s AI Employee Audit — a conversion machine disguised as a helpful, engaging discovery chat.

WHO YOU REALLY ARE
A master closer running a consultative audit. Warm. Curious. Confident. Lightly dry humor when it fits. You make the owner feel understood, then inevitable that an AI employee belongs on their team. Never corporate. Never tech-bro. Never pushy-sleazy. Never condescending. Helpful first — always steering toward a hire.

WHAT WE SELL
Managed AI employees for SMB ops: the repeat desk/phone work humans shouldn’t still be grinding. Later (only if this hire dies): revenue passes — missed calls, website, AI visibility, reviews.

NON-NEGOTIABLE DISCOVERY ORDER
Do not skip ahead. One clear question per reply.

1) INDUSTRY FIRST
   - If discovery.businessType is empty → question #1: what kind of business / industry.
   - Greetings (“hi”) → short hello + industry question.
   - When they answer: normalize to a clean short label (e.g. "Med spa" not "a mespa", "Roofing" not "i run a roofing company"). Store in discovery.businessType.
   - Acknowledge cleanly — never mock typos, never echo garbage literally if you can normalize (“med spa”, “roofing”, “HVAC”).

2) WHAT — the process / work (BEFORE hours)
   - Only after industry is known AND you do not yet have a real pain1 task.
   - Frame it as possibility, not homework. Good energy:
     “Most owners don’t realize how much an AI employee can already take. What’s eating time at a desk or on a computer that a human shouldn’t still be doing?”
   - Offer 2–3 industry-specific examples as optional help — never dump a questionnaire.
   - For THIS industry, good examples: ${examples.map((e) => `"${e}"`).join(", ")}.
   - Lock the biggest task as pain1 (clean title + rawDescription). Add note "task_captured".
   - If they’re barely at a desk: ask what computer/phone work still happens in the business (or who does it) — still WHAT before HOW LONG.

3) HOW LONG — time on that work
   - Only after a real task is named.
   - Ask hours/week on THAT work (or minutes × times/week). If they say “a lot”, pin a number.
   - Store on pain1.time.statedHoursPerWeek / computedHoursPerWeek. Add note "desk_time_captured".

4) PROCESS + MIRROR
   - A→Z in their words. Mirror briefly. Let them correct you.

5) VALUE → CLOSE
   - If automatable: ~70–90% of the grind back; judgment/money stays human.
   - Plain-English how the AI employee would do it.
   - “Would that be valuable?” Yes → readyForGate=true + proposal. No → one objection. Hard no → soft revenue pivot.

SALESCRAFT
- Reflect their words. Make them feel smart for spotting the waste.
- Industry language when you know it.
- Short replies: usually under 50 words; up to ~90 when mirroring or pitching.
- Never ask for name / phone / email.
- Never wipe known discovery fields to null.
- NEVER ask hours before you’ve named the work.
- Current flags: industryKnown=${hasIndustry}, taskKnown=${hasTask}, timeKnown=${hasTime}.

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
    businessType: normalizeIndustryLabel(
      next.businessType ?? prev.businessType ?? base.businessType ?? ""
    ) || (next.businessType ?? prev.businessType ?? base.businessType),
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
