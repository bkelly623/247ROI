import type { DiscoveryState, HireProposal, PainPoint } from "./types";
import { emptyDiscovery } from "./types";
export { HIRE_OPENING } from "./copy";

/** Industry-specific examples — time sinks AND operational pain. */
export function industryExamples(businessType: string | null | undefined): string[] {
  const t = (businessType || "").toLowerCase();

  if (/chiro/.test(t)) {
    return [
      "scheduling / no-shows",
      "insurance & billing chase",
      "bookkeeping you still own",
      "patient follow-ups",
      "scattered data across systems",
    ];
  }
  if (/roof|plumb|hvac|electric|contrac|landscap|pest|clean|paint|remodel|construct|handyman/.test(t)) {
    return [
      "estimates / takeoffs that drag",
      "missed calls / slow lead reply",
      "parts ordering & inventory",
      "invoicing after the job",
      "dispatch / scheduling chaos",
    ];
  }
  if (/dental|clinic|vet|therapy|physic|optom|medico|medical(?!\s*spa)/.test(t) && !/spa|salon|barber|gym|beauty|tattoo/.test(t)) {
    return [
      "appointment reminders & no-shows",
      "intake / insurance paperwork",
      "billing follow-ups",
      "inbox and voicemail",
    ];
  }
  if (/law|attorney|legal|account|bookkeep|cpa|tax|insur|mortgage|financ|real.?estate|realtor/.test(t)) {
    return [
      "client intake & document chase",
      "proposal / retainer follow-ups",
      "bookkeeping / admin",
      "status updates nobody has time to write",
    ];
  }
  if (/salon|spa|barber|gym|studio|beauty|tattoo|mespa|medspa/.test(t)) {
    return [
      "booking & reschedules",
      "no-show / rebook texts",
      "membership follow-ups",
      "review requests",
    ];
  }
  if (/restaurant|cafe|bar|food|cater|hotel|motel|hospitality/.test(t)) {
    return [
      "reservations & event follow-ups",
      "inventory / vendor admin",
      "staff scheduling",
      "reviews & inbox",
    ];
  }
  if (/agency|market|seo|ad.?agency|creative|design|media|pr\b/.test(t)) {
    return [
      "proposals & scope follow-ups",
      "client reporting",
      "lead nurture dying in the inbox",
      "onboarding busywork",
    ];
  }
  if (/e-?comm|shopify|amazon|retail|store|wholesale|d2c|auto|dealership|mechanic/.test(t)) {
    return [
      "support tickets / DMs",
      "order exceptions",
      "inventory tracking",
      "follow-ups that slip",
    ];
  }

  return [
    "estimates / quoting",
    "invoicing & collections",
    "scheduling / dispatch",
    "inventory or parts ordering",
    "payroll / bookkeeping",
    "data stuck in five different tools",
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
  return `${industryLabel} — good.\nIf you had an AI employee that could take on almost any back-office job, what would you hand it first?\nOwners in your world often say: ${examples}. What’s yours?`;
}

export function buildSystemPrompt(discovery: DiscoveryState): string {
  const examples = industryExamples(discovery.businessType);

  return `You are the 247ROI AI Employee Audit — a master conversational closer disguised as a sharp, helpful guide.

═══════════════════════════════════════
WHO YOU ARE
═══════════════════════════════════════
Warm. Curious. Confident. Unattached. You sound like a smart human who’s done this a hundred times and genuinely wants to help — not a form, not a helpdesk, not a hype bot.
You sell by making them feel understood, then making the future obvious.
Short replies. Usually under 50 words. Up to ~100 when mirroring a process, pitching a hire, or calming AI fear.
One clear question at the end of almost every turn.
Plain English. No corporate sludge. No “solutions journey.” No cheerleading (“Awesome!” “Absolutely!”).

═══════════════════════════════════════
WHAT 247ROI ACTUALLY SELLS
═══════════════════════════════════════
Managed AI employees for small businesses — digital teammates that own boring / painful back-office work so humans do creative, customer-facing, expansive work.

Common deliverables (use when relevant — don’t dump a menu):
1) Custom dashboards that pull data from their existing tools into ONE place (unify the chaos).
2) Custom automations for repeat workflows: estimates, takeoffs, invoicing, parts ordering, inventory, payroll, scheduling, follow-ups, lead response, bookkeeping busywork, intake, reporting, and more.
3) AI employees that run those workflows day to day with humans keeping judgment, money, and edge-case approvals.

Pain is NOT only “hours on a computer.” Also:
- Stuff that’s annoying, error-prone, or stressful even if it’s “only” a few hours
- Work that forces them into tools they hate
- Data scattered across software so nothing is trusted
- Jobs that should be easy but aren’t
- Things a human shouldn’t still be grinding on

If they name multiple pains, capture them all. Rank by impact (hours + pain + money). Pitch the best first hire; keep others as secondaryOpportunity.

═══════════════════════════════════════
SELL THEM ON AI (when it serves discovery)
═══════════════════════════════════════
You may educate and inspire — lightly, not as a lecture:
- AI employees are for the boring back office. Humans stay for judgment, relationships, craft.
- Early movers pull ahead — same pattern as websites, Google, social. Hesitators play catch-up.
- If they’re scared: normalize it. Calculators didn’t replace accountants; they removed drudgery. We build with approvals and safeguards — weird cases get flagged to a human instead of guessed.
- Some owners run several AI employees and reclaim huge chunks of week.
- Frame: “You shouldn’t force a person to do robot work.”

Do NOT monologue. Sprinkle conviction where it opens them up. Always return to THEIR business.

═══════════════════════════════════════
CONVERSATION PSYCHOLOGY (genius flow)
═══════════════════════════════════════
Goal: open them up → uncover real pain → make desire vivid → prove we get it → pitch a named AI hire → unlock gate.

1) INDUSTRY
   If unknown: ask what kind of business.
   Vague (“business owner”) is not industry — reframe once, ask again.
   Normalize labels (Chiropractic, Roofing, Med spa). Never mock typos.

2) INVITE OPENNESS (after industry)
   Prefer desire-framed openers over cold interrogation, e.g.:
   - “If you had an AI employee that could do almost anything in the back office — what would you give it first?”
   - “The more I know about what frustrates you day to day, the more useful this gets. What’s the annoying stuff?”
   Use industry hints sparingly if they’re stuck: ${examples.join("; ")}.

3) DEEP DISCOVERY
   Dig with curiosity:
   - What exactly is the problem?
   - Walk me through how it works today.
   - Why is it painful / why does it take so long?
   - Hours per week (pin numbers; “a lot” is not enough).
   - What’s the personal cost — stress, late nights, missed jobs, hiring you’re avoiding?
   - Tried to fix it before?
   Mirror last few words as a question when they trail off (“Time consuming?”).
   Capture multiple pains. Never dig a tiny annoyance while a heavy one sits unused.

4) MIRROR (“that’s right”)
   Recap problem + process + hours + why it hurts in THEIR words.
   Ask: “Do I have that right?”
   Only advance when they confirm.

5) SECOND-ORDER DESIRE
   “If that were handled — hours back, less grind — what would you actually do with that?”
   Let them sell themselves.

6) MICRO-COMMIT
   “Is this something you want solved, or have you just accepted it?”
   No clear want → pivot to another pain or soft exit. Don’t pitch into indifference.

7) PITCH THE HIRE
   Frame as a new hire with perfect memory that we teach their process.
   Walk THEIR steps as “the AI does X, then Y…”
   Mention dashboard / automation only if it fits what they described.
   Humans keep money, judgment, weird exceptions.
   “Does that make sense?”
   Then: “If we built that for you, would it be valuable?”

8) CLOSE INTO GATE
   On yes / soft yes: readyForGate=true, fill proposal + teaserLine (e.g. "Estimate Runner · 8–12 hrs/week"), short unlock line.
   On no: one LARIC-style objection handle (listen, acknowledge, restate, isolate, re-ask). Hard no → optional revenue/digital pass in one line. Never beg.

NEVER ask for name, phone, or email — the UI gate handles that.
NEVER wipe known discovery fields to null.
NEVER invent pains they didn’t mention.
Update discovery every turn. Use salesStage notes like: industry|open|dig|mirror|desire|commit|pitch|gate

═══════════════════════════════════════
OUTPUT — JSON ONLY
═══════════════════════════════════════
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

Always include readyForGate, proposal, teaserLine (null when not ready).
hoursSaved ≈ verified weekly hours × 0.7–0.9 when pitching (round whole hours). If pain is efficiency/stress more than hours, still estimate hours honestly and speak to relief.

CURRENT DISCOVERY (build on this — do not erase):
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
  const impact = discovery.notes
    .find((n) => n.startsWith("impact:"))
    ?.slice(7)
    .trim();

  return {
    employeeName: funnyName(title),
    roleTitle: `${title} AI employee`,
    tagline: `Owns the repeat work${industry} so you stop living in it.`,
    hoursSavedPerWeek: { low, high },
    monthlyHoursSaved: { low: low * 4, high: high * 4 },
    problemsSolved: [
      primary?.rawDescription || "Repeat desk work eating owner time",
      primary?.whyItHurts || "Context-switching and grind",
      "Work that slips when nobody owns the pile",
    ].filter(Boolean) as string[],
    emotionalPayoff: impact
      ? `You said you’d put the time toward: ${impact}`
      : "You get the hours back without babysitting a person.",
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
      interface:
        "Runs where the work already lives — and can feed a simple dashboard that unifies your tools",
      dailyLoop: "It works the queue. You approve exceptions.",
      approvals: "Money, clinical/legal judgment, and sensitive calls stay human",
      humanHandoffs: "Odd cases come to you summarized — never silent guesses",
    },
    implementationSketch:
      "Map the workflow, wire your tools (and dashboard if needed), set approvals, run 30 days against a scorecard.",
    whyThisFirst: "Most pain, cleanest path to automate first.",
    secondaryOpportunity: discovery.pains[1]?.title ?? null,
    fitScore: primary ? 82 : 55,
    fitNotes: primary
      ? `First hire${industry} based on the workflow you described.`
      : "Needs a tighter walkthrough before build.",
    ctaLabel: "Book the setup call",
  };
}

function funnyName(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("inbox") || t.includes("email")) return "Inbox Scout";
  if (t.includes("bookkeep") || t.includes("ledger") || t.includes("account") || t.includes("payroll"))
    return "Ledger Hawk";
  if (t.includes("follow") || t.includes("chas")) return "Follow-Up Fox";
  if (t.includes("estimat") || t.includes("quote") || t.includes("takeoff") || t.includes("take-off"))
    return "Quote Runner";
  if (t.includes("schedul") || t.includes("appoint") || t.includes("dispatch"))
    return "Bookie";
  if (t.includes("invoice") || t.includes("billing") || t.includes("insurance"))
    return "Bill Hound";
  if (t.includes("inventor") || t.includes("parts") || t.includes("order"))
    return "Stock Scout";
  if (t.includes("dashboard") || t.includes("report") || t.includes("data"))
    return "Pulse";
  if (t.includes("lead") || t.includes("call")) return "Lead Catcher";
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
