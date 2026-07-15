import type { DiscoveryState, HireProposal, PainPoint } from "./types";
import { emptyDiscovery } from "./types";
export { HIRE_OPENING } from "./copy";

/** Industry-specific time sinks — for prompt + offline fallback. */
export function industryExamples(businessType: string | null | undefined): string[] {
  const t = (businessType || "").toLowerCase();

  if (/chiro/.test(t)) {
    return [
      "patient scheduling & no-shows",
      "insurance / billing follow-ups",
      "bookkeeping you still do yourself",
      "inbox that never dies",
    ];
  }
  if (/roof|plumb|hvac|electric|contrac|landscap|pest|clean|paint|remodel|construct|handyman/.test(t)) {
    return [
      "missed calls / slow lead reply",
      "estimates that never get followed up",
      "scheduling / dispatch",
      "invoice chase after the job",
    ];
  }
  if (/dental|clinic|vet|therapy|physic|optom|medico|medical(?!\s*spa)/.test(t) && !/spa|salon|barber|gym|beauty|tattoo/.test(t)) {
    return [
      "appointment reminders & no-shows",
      "intake / insurance paperwork",
      "patient follow-ups",
      "inbox and voicemail",
    ];
  }
  if (/law|attorney|legal|account|bookkeep|cpa|tax|insur|mortgage|financ|real.?estate|realtor/.test(t)) {
    return [
      "client intake & document chase",
      "proposal / retainer follow-ups",
      "scheduling consults",
      "bookkeeping / admin you still own",
    ];
  }
  if (/salon|spa|barber|gym|studio|beauty|tattoo|mespa|medspa/.test(t)) {
    return [
      "booking & reschedules",
      "no-show / rebook texts",
      "review requests",
      "membership follow-ups",
    ];
  }
  if (/restaurant|cafe|bar|food|cater|hotel|motel|hospitality/.test(t)) {
    return [
      "reservations & event follow-ups",
      "vendor / inventory admin",
      "staff scheduling",
      "reviews & inbox",
    ];
  }
  if (/agency|market|seo|ad.?agency|creative|design|media|pr\b/.test(t)) {
    return [
      "proposals & scope follow-ups",
      "client status reporting",
      "lead nurture dying in the inbox",
      "onboarding busywork",
    ];
  }
  if (/e-?comm|shopify|amazon|retail|store|wholesale|d2c/.test(t)) {
    return [
      "support tickets / DMs",
      "order exceptions",
      "review & return follow-ups",
      "listing / inventory busywork",
    ];
  }
  if (/auto|dealership|mechanic|detail|tire/.test(t)) {
    return [
      "service booking",
      "estimate follow-ups",
      "reminder texts",
      "review requests",
    ];
  }

  return [
    "follow-ups that slip",
    "inbox / voicemail",
    "scheduling",
    "bookkeeping or billing admin",
  ];
}

export function normalizeIndustryLabel(raw: string): string {
  let s = raw.trim().replace(/\s+/g, " ");
  s = s.replace(/^(i('?m| am) (in|a|an|the)\s+)/i, "");
  s = s.replace(/^(we('?re| are) (a|an|the)\s+)/i, "");
  s = s.replace(/^(a|an|the)\s+/i, "");
  s = s.replace(/\bi('?m| am) a?\s+/i, "");
  const lower = s.toLowerCase();
  const aliases: Record<string, string> = {
    mespa: "med spa",
    "me spa": "med spa",
    medspa: "med spa",
    "med-spa": "med spa",
    chiropractor: "chiropractic",
    chiro: "chiropractic",
    roof: "roofing",
    roofer: "roofing",
    hvac: "HVAC",
    cpa: "accounting",
    "real estate": "real estate",
    ecommerce: "ecommerce",
    "e-commerce": "ecommerce",
    "business owner": "",
    owner: "",
    entrepreneur: "",
  };
  if (aliases[lower] !== undefined) return aliases[lower];
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

export function askWhatEatsTime(industryLabel: string): string {
  const examples = industryExamples(industryLabel).slice(0, 3).join("; ");
  return `${industryLabel}. What’s burning the most time on a computer that AI should own?\nOften: ${examples}. Yours?`;
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
  const mirrored = discovery.notes?.includes("mirrored") ?? false;

  return `You are running 247ROI’s AI Employee Audit in chat.
You are NOT a helpdesk bot. You are an unattached, elite SDR/closer doing discovery — disguised as a sharp, useful audit.

PRODUCT
247ROI builds managed AI employees for SMB desk/phone work (the repeatable grind). Unlocking the hire plan is the goal after they confirm value. Do NOT sell pricing, packages, or company lore in this chat. Do NOT ask for name/phone/email (a gate handles that).

VOICE (non-negotiable)
- Short. Direct. Curious. Calm. Zero fluff.
- Sound like a smart human who’s done 50 of these today and doesn’t need this deal.
- One question per reply. Prefer under 35 words. Cap ~70 only for a full process mirror or A→Z AI pitch.
- Plain words. No corporate, no “solutions,” no “journey,” no cheerleading.

BANNED PHRASES (never write these or close cousins)
- “Thanks for that” / “Great,” / “Awesome!” / “Absolutely”
- “That can definitely be time-consuming”
- “I’d like to see how” / “helps me understand” / “tailor the best AI solutions”
- “Can you walk me through” used as filler when they already said it’s trivial
- “Got it, you’re a business owner” as if that answers industry
- Soft apology energy when they say no

DISCOVERY OS — FOLLOW IN ORDER. DO NOT SKIP.
Flags now: industry=${hasIndustry} task=${hasTask} time=${hasTime} mirrored=${mirrored}

1) INDUSTRY
   If businessType empty → ask what kind of business. Hello + ask is fine.
   Vague (“business owner”, “entrepreneur”, “small business”) is NOT industry.
   → Re-pitch once, then ask again:
   “Fair. Quick version — we automate desk work that burns 10–20+ hours a week. What industry is the business in?”
   Normalize label (Chiropractic, Roofing, Med spa). Never echo typos (“a mespa”).

2) THE PROBLEM (WHAT) — before hours
   After industry: ask the opening discovery question in this energy:
   “What’s taking up the most time that some sharp AI could own for you?”
   Industry hints (use sparingly, only if stuck): ${examples.map((e) => e).join("; ")}.
   If they name TWO+ tasks (e.g. email + bookkeeping): park both in notes/pains, ask which burns more hours — then lock THAT as pain1. Never dig the light one first.
   If the task sounds tiny (inbox “I just reply”), do NOT run a full workflow dig. Ask for hours. If ≤3 hrs/week OR they say “not a big deal” → isolate and pivot to the other parked task / ask what’s actually heavy.

3) DETAIL (only if the problem is real)
   “Walk me through it step by step — how you do it now.”
   Dig until you could explain it to a third party.

4) QUANTIFY
   “How many hours a week does that eat?”
   “A lot” → pin a number. Store statedHoursPerWeek / computedHoursPerWeek. Note desk_time_captured.
   Soft problems (<~4 hrs) without a bigger parked pain → ask what else eats time before pitching.

5) MIRROR + CONFIRM
   Recap problem + steps + hours in their words.
   End with: “Do I have that right?”
   On confirm, add note "mirrored". Aim for the feeling of “that’s right.”

6) SECOND-ORDER (one short ask)
   “If that were off your plate — say most of those hours — what would you actually do with the time?”

7) MICRO-COMMIT
   “Is this something you want solved, or have you just accepted it?”
   If they don’t want it → pivot once to another pain or soft exit. Don’t pitch.

8) PITCH (only after commit)
   Frame AI as a new hire with perfect memory.
   Mirror THEIR steps as “the system does X, then Y…”
   People keep approvals on money/judgment; grind is automated (~70–90%).
   “Does that make sense?”
   Then: “If we built that for you, would it be valuable?”
   Yes / soft yes → readyForGate=true, fill proposal + teaserLine, brief unlock line.
   No → LARIC-lite once (listen, acknowledge, restate, isolate, re-ask). Hard no → offer revenue/digital pass in one line, don’t beg.

SALES LAWS
- No clear problem = no pitch. Re-pitch / dig / pivot.
- Always pursue highest-ROI hours on the table.
- Update discovery every turn. Never wipe facts to null.
- notes should track: task_captured, desk_time_captured, mirrored, valued, parked:[other tasks].

OUTPUT — JSON only:
{
  "reply": string,
  "phase": "warming"|"pain1"|"time_verify"|"process"|"pain2_probe"|"ready",
  "discovery": { ...updated... },
  "proposal": null | object,
  "readyForGate": boolean,
  "teaserLine": string|null
}

CURRENT DISCOVERY:
${JSON.stringify(discovery)}
`;
}

export function proposalFallback(discovery: DiscoveryState): HireProposal {
  const primary =
    discovery.pains.find((p) => p.id === "pain1") ?? discovery.pains[0];
  const hours =
    primary?.time.computedHoursPerWeek ??
    primary?.time.statedHoursPerWeek ??
    8;
  const low = Math.max(1, Math.round(hours * 0.7));
  const high = Math.max(low + 1, Math.round(hours * 0.9));
  const title = primary?.title ?? "Ops";
  const industry = discovery.businessType
    ? ` for ${discovery.businessType}`
    : "";

  return {
    employeeName: funnyName(title),
    roleTitle: `${title} AI employee`,
    tagline: `Owns the repeat work${industry} so you stop living in it.`,
    hoursSavedPerWeek: { low, high },
    monthlyHoursSaved: { low: low * 4, high: high * 4 },
    problemsSolved: [
      primary?.rawDescription || "Repeat desk work eating owner time",
      "Context-switching",
      "Work that slips when nobody owns the pile",
    ],
    emotionalPayoff: "You get the hours back without babysitting a person.",
    jobFromAtoZ: primary?.processSteps.length
      ? primary.processSteps
      : [
          "Catch the incoming work",
          "Pull what’s missing",
          "Do the repeat steps",
          "Ask only when judgment or money matters",
          "Log / send / follow up",
        ],
    howTheyUseIt: {
      interface: "Runs where the work already lives — email, spreadsheet, forms, CRM",
      dailyLoop: "It works the queue. You approve exceptions.",
      approvals: "Money, clinical/legal judgment, and sensitive calls stay human",
      humanHandoffs: "Odd cases come to you summarized",
    },
    implementationSketch:
      "Map the workflow, wire your tools, set approvals, run 30 days against a scorecard.",
    whyThisFirst: "Most hours, cleanest path to automate.",
    secondaryOpportunity: discovery.pains[1]?.title ?? null,
    fitScore: primary ? 80 : 55,
    fitNotes: primary
      ? `First hire${industry} based on the workflow you described.`
      : "Needs a tighter walkthrough before build.",
    ctaLabel: "Book the setup call",
  };
}

function funnyName(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("inbox") || t.includes("email")) return "Inbox Scout";
  if (t.includes("bookkeep") || t.includes("ledger") || t.includes("account"))
    return "Ledger Hawk";
  if (t.includes("follow") || t.includes("chas")) return "Follow-Up Fox";
  if (t.includes("estimat") || t.includes("quote")) return "Quote Runner";
  if (t.includes("schedul") || t.includes("appoint") || t.includes("book"))
    return "Bookie";
  if (t.includes("invoice") || t.includes("billing") || t.includes("insurance"))
    return "Bill Hound";
  if (t.includes("lead") || t.includes("call")) return "Lead Catcher";
  if (t.includes("data") || t.includes("entry")) return "Click Clerk";
  const clean =
    title.replace(/[^a-zA-Z0-9 ]/g, "").trim().split(/\s+/)[0] || "Desk";
  return `${clean} Bot`;
}

export function mergeDiscovery(
  prev: DiscoveryState,
  next: DiscoveryState | null | undefined
): DiscoveryState {
  if (!next) return prev;
  const base = emptyDiscovery();
  const rawType = next.businessType ?? prev.businessType ?? base.businessType;
  const normalized = rawType ? normalizeIndustryLabel(rawType) : null;
  return {
    businessName: next.businessName ?? prev.businessName ?? base.businessName,
    businessType: normalized || rawType,
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
          n.time?.hiddenMinutesPerOccurrence ??
          p.time.hiddenMinutesPerOccurrence,
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
