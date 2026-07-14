import type { ChatTurn } from "./schema";
import { proposalFallback } from "./prompt";
import type { DiscoveryState, HireMessage, PainPoint } from "./types";

export type SalesStage =
  | "open"
  | "field_owner"
  | "clarify_pain"
  | "named_pain"
  | "time"
  | "process"
  | "second"
  | "pitch"
  | "upsell";

const UNSURE =
  /\b(not sure|idk|i don'?t know|dunno|no idea|unsure|nothing|whatever|help me|hmm+|maybe)\b/i;

const NOT_AT_DESK =
  /\b(don'?t|do not|never|rarely|hardly).{0,24}(desk|computer|office|sit|laptop)\b|\b(not at|away from).{0,12}(desk|computer|office)\b|\bi('?m| am) (always )?(in the field|on (the )?job|on site|out on)\b/i;

const CONFUSED = /^(what|huh|wdym|what\?+|excuse me|come again|say that again)\??\.?$/i;

const GENERIC_PAINS = [
  "chasing people / follow-ups",
  "inbox and messages",
  "scheduling / booking",
  "quotes or proposals",
  "invoices / billing admin",
  "copying data between systems",
  "missed calls / slow lead response",
];

function stageOf(d: DiscoveryState): SalesStage {
  const raw = d.salesStage;
  const allowed: SalesStage[] = [
    "open",
    "field_owner",
    "clarify_pain",
    "named_pain",
    "time",
    "process",
    "second",
    "pitch",
    "upsell",
  ];
  if (allowed.includes(raw as SalesStage)) return raw as SalesStage;
  return "open";
}

function withStage(d: DiscoveryState, salesStage: SalesStage): DiscoveryState {
  return { ...d, salesStage };
}

function note(d: DiscoveryState, flag: string): DiscoveryState {
  if (d.notes.includes(flag)) return d;
  return { ...d, notes: [...d.notes, flag] };
}

function hasNote(d: DiscoveryState, flag: string): boolean {
  return d.notes.includes(flag);
}

function isUnsure(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/^\d{1,2}$/.test(t)) return false;
  if (CONFUSED.test(t)) return false;
  if (t.length < 3 && !/^(yes|yah|yep|no|nah)$/i.test(t)) return true;
  if (UNSURE.test(t)) return true;
  if (/^(no|nah|nothing|none)\.?$/i.test(t)) return true;
  return false;
}

function looksLikeBusiness(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (/^\d+$/.test(t)) return false;
  return (
    /\b(shop|store|agency|clinic|office|firm|salon|gym|restaurant|cafe|company|business|studio|practice|school|nonprofit|warehouse|factory|brand|ecommerce|e-?comm|saas|freelancer|consultant|law|account|dental|med|roof|plumb|hvac|realty|real estate|construction|cleaning|auto|dealership|bakery|barber|spa|farm|hotel|motel|logistics|trucking|print|marketing|insurance|mortgage|vet|pharmacy)\b/.test(
      t
    ) || (t.split(/\s+/).length <= 5 && t.length >= 3)
  );
}

function extractPainTitle(text: string): string {
  const lower = text.toLowerCase();
  if (/missed.?call|phone|after.?hours|voicemail/.test(lower)) return "Missed calls / lead response";
  if (/follow|chase|check.?in/.test(lower)) return "Follow-ups";
  if (/inbox|email|message|text|sms|dm/.test(lower)) return "Inbox";
  if (/schedul|book|appoint|calendar|resched/.test(lower)) return "Scheduling";
  if (/estimat|quote|proposal|bid/.test(lower)) return "Quotes / proposals";
  if (/invoice|billing|collect|receivable|ar\b/.test(lower)) return "Billing admin";
  if (/data.?entr|spreadsheet|excel|crm|copy.?paste|between system/.test(lower))
    return "Data entry";
  if (/report|dashboard|weekly update|kpi/.test(lower)) return "Reporting";
  if (/lead|intake|new customer|form/.test(lower)) return "Lead intake";
  if (/inventory|stock|order|purchase/.test(lower)) return "Orders / inventory";
  if (/support|ticket|customer service/.test(lower)) return "Customer support";
  if (isUnsure(text) || NOT_AT_DESK.test(text)) return "Ops admin";
  const cleaned = text.replace(/[^\w\s/-]/g, "").trim();
  return cleaned.slice(0, 48) || "Ops admin";
}

function makePain(title: string, raw: string, id = "pain1"): PainPoint {
  return {
    id,
    title,
    rawDescription: raw,
    tools: [],
    processSteps: [],
    whoDoesIt: null,
    whyItHurts: null,
    time: {
      label: title,
      minutesPerOccurrence: null,
      occurrencesPerWeek: null,
      hiddenMinutesPerOccurrence: null,
      computedHoursPerWeek: null,
      statedHoursPerWeek: null,
      underestimationNote: null,
    },
    automatable: true,
    confidence: 0.45,
  };
}

function parseMinutesAndCount(text: string): {
  minutes: number | null;
  count: number | null;
} {
  const lower = text.toLowerCase();
  const minMatch = lower.match(/(\d+(?:\.\d+)?)\s*(min|mins|minute|minutes|m)\b/);
  const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*(hr|hrs|hour|hours)\b/);
  const perWeek = lower.match(
    /(\d+(?:\.\d+)?)\s*(?:x|times|a|per)?\s*(?:\/|\bper\b|\ba\b)?\s*week/
  );
  const nums = [...text.matchAll(/\b(\d+(?:\.\d+)?)\b/g)].map((m) => Number(m[1]));

  let minutes: number | null = null;
  let count: number | null = null;

  if (minMatch) minutes = Number(minMatch[1]);
  else if (hourMatch) minutes = Number(hourMatch[1]) * 60;

  if (perWeek) count = Number(perWeek[1]);

  if (minutes == null && count == null && nums.length >= 2) {
    minutes = nums[0];
    count = nums[1];
  } else if (minutes != null && count == null && nums.length >= 2) {
    count = nums.find((n) => n !== minutes) ?? null;
  } else if (minutes == null && count != null && nums.length >= 2) {
    minutes = nums.find((n) => n !== count) ?? null;
  }

  return { minutes, count };
}

function offerMenu(businessHint?: string | null): string {
  const who = businessHint
    ? `For ${/^(a|an)\s/i.test(businessHint.trim()) ? businessHint.trim() : `a ${businessHint.trim()}`} shop, which`
    : "Which";
  return `${who} one burns the most time?\n1) Follow-ups\n2) Inbox / messages\n3) Scheduling\n4) Quotes / proposals\n5) Billing admin\n6) Missed calls / slow lead response\n7) Something else — type it`;
}

/**
 * Deterministic closer. This is the source of truth for discovery state.
 */
export function runSalesTurn(
  discovery: DiscoveryState,
  messages: HireMessage[]
): ChatTurn {
  const last = messages.filter((m) => m.role === "user").at(-1)?.content?.trim() ?? "";
  let d: DiscoveryState = { ...discovery, salesStage: stageOf(discovery) };
  let stage = stageOf(d);

  if (!discovery.salesStage) {
    if (hasNote(d, "pitched")) stage = "upsell";
    else if (d.pains[0]?.processSteps.length >= 3) stage = "second";
    else if (
      d.pains[0]?.time.minutesPerOccurrence != null &&
      d.pains[0]?.time.occurrencesPerWeek != null
    )
      stage = "process";
    else if (d.pains.length > 0) stage = "time";
    else if (hasNote(d, "field_owner")) stage = "field_owner";
    else if (hasNote(d, "offered_buckets")) stage = "clarify_pain";
    else stage = "open";
    d = withStage(d, stage);
  }

  if (CONFUSED.test(last)) {
    if (stage === "field_owner") {
      return {
        reply:
          "Got it — you don’t sit at a desk much.\nI’m asking who handles the computer/paperwork side of the business so we can automate THAT, not put you behind a screen.\n\nPick one:\n1) Me on phone / after hours\n2) An employee\n3) Family\n4) Nobody — it piles up\n5) Something else",
        phase: "warming",
        discovery: withStage(d, "field_owner"),
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }
    if (stage === "clarify_pain" || hasNote(d, "offered_buckets")) {
      return {
        reply: `Sorry — pick the biggest time-killer (number or type it):\n${offerMenu(d.businessType)}`,
        phase: "pain1",
        discovery: d,
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }
    return {
      reply:
        "Sorry — plain English:\nI’m finding work in your business that an AI employee can own, so humans stop doing robot work.\n\nWhat takes the most time on a computer or phone in your company?\n(If that’s not you, say who’s doing it.)",
      phase: "warming",
      discovery: d,
      proposal: null,
      readyForGate: false,
      teaserLine: null,
    };
  }

  // ——— OPEN ———
  if (stage === "open") {
    if (NOT_AT_DESK.test(last)) {
      d = withStage(note(d, "field_owner"), "field_owner");
      return {
        reply:
          "Makes sense — a lot of owners barely sit down.\n\nSo who handles the computer / paperwork side?\n1) Me, just after hours or on my phone\n2) An employee / office person\n3) Spouse / family\n4) Nobody — it piles up\n5) Something else",
        phase: "warming",
        discovery: d,
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    if (isUnsure(last)) {
      d = withStage(note(d, "offered_buckets"), "clarify_pain");
      return {
        reply:
          "Totally normal.\n\nWhat kind of business is it? Once I know that, I’ll give you a short list of usual time-killers.",
        phase: "warming",
        discovery: d,
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    // Named a real workflow — not a denial
    if (!NOT_AT_DESK.test(last) && last.length > 2) {
      const title = extractPainTitle(last);
      // If they named a business instead of a task
      if (looksLikeBusiness(last) && !/\b(follow|inbox|email|schedul|quote|invoice|call|lead)\b/i.test(last)) {
        d = withStage(
          note({ ...d, businessType: last.slice(0, 80) }, "offered_buckets"),
          "clarify_pain"
        );
        return {
          reply: `${last.trim()}. Got it.\n\n${offerMenu(last)}`,
          phase: "pain1",
          discovery: d,
          proposal: null,
          readyForGate: false,
          teaserLine: null,
        };
      }

      d = withStage(
        {
          ...d,
          pains: [makePain(title, last)],
          activePainId: "pain1",
        },
        "time"
      );
      return {
        reply: `${title}. Locked in.\n\nRoughly how many minutes does ONE take?`,
        phase: "time_verify",
        discovery: d,
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    d = withStage(d, "clarify_pain");
    return {
      reply: "Quick one — what kind of business do you run?",
      phase: "warming",
      discovery: d,
      proposal: null,
      readyForGate: false,
      teaserLine: null,
    };
  }

  // ——— FIELD OWNER / not at desk ———
  if (stage === "field_owner") {
    const pick = last.match(/^\s*([1-5])\s*$/);
    const n = pick ? Number(pick[1]) : null;
    const lower = last.toLowerCase();

    if (n === 1 || /after hours|phone|laptop|myself|me\b/.test(lower)) {
      d = note({ ...d, role: "owner-mobile" }, "offered_buckets");
      d = withStage(d, "clarify_pain");
      return {
        reply: `That’s still desk work — just in disguise.\n\n${offerMenu(d.businessType)}`,
        phase: "pain1",
        discovery: d,
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    if (n === 2 || n === 3 || /employee|office|assistant|spouse|wife|husband|family|manager|receptionist/.test(lower)) {
      d = note({ ...d, role: "delegated-admin" }, "offered_buckets");
      d = withStage(d, "clarify_pain");
      return {
        reply: `Perfect — then we automate THEIR grind, not yours.\n\nWhat do they spend the most time on?\n${offerMenu(d.businessType)}`,
        phase: "pain1",
        discovery: d,
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    if (n === 4 || /pile|nobody|falls|behind|chaos/.test(lower)) {
      d = note({ ...d, role: "neglected-admin" }, "offered_buckets");
      d = withStage(d, "clarify_pain");
      return {
        reply: `That’s usually expensive.\n\nWhat's piling up the worst?\n${offerMenu(d.businessType)}`,
        phase: "pain1",
        discovery: d,
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    if (!d.businessType && looksLikeBusiness(last)) {
      d = withStage(
        note({ ...d, businessType: last.slice(0, 80) }, "offered_buckets"),
        "clarify_pain"
      );
      return {
        reply: `${last.trim()}.\n\n${offerMenu(last)}`,
        phase: "pain1",
        discovery: d,
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    // free text → treat as pain or ask menu
    if (last.length > 8 && !isUnsure(last)) {
      const title = extractPainTitle(last);
      d = withStage(
        {
          ...d,
          pains: [makePain(title, last)],
          activePainId: "pain1",
        },
        "time"
      );
      return {
        reply: `${title}.\n\nHow many minutes for one? How many times a week?`,
        phase: "time_verify",
        discovery: d,
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    return {
      reply:
        "No wrong answer — tap a number:\n1) Me on phone / after hours\n2) An employee\n3) Family\n4) Nobody — it piles up\n5) Something else",
      phase: "warming",
      discovery: withStage(d, "field_owner"),
      proposal: null,
      readyForGate: false,
      teaserLine: null,
    };
  }

  // ——— CLARIFY ———
  if (stage === "clarify_pain") {
    if (!d.businessType && looksLikeBusiness(last) && !isUnsure(last) && !/^\d+$/.test(last)) {
      d = note({ ...d, businessType: last.slice(0, 80) }, "offered_buckets");
      return {
        reply: `${last.trim()}.\n\n${offerMenu(last)}`,
        phase: "pain1",
        discovery: withStage(d, "clarify_pain"),
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    if (isUnsure(last)) {
      return {
        reply: offerMenu(d.businessType),
        phase: "pain1",
        discovery: withStage(d, "clarify_pain"),
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    const num = last.match(/^\s*([1-7])\s*$/);
    let title = extractPainTitle(last);
    if (num) {
      const idx = Number(num[1]) - 1;
      const offered = [
        "Follow-ups",
        "Inbox / messages",
        "Scheduling",
        "Quotes / proposals",
        "Billing admin",
        "Missed calls / lead response",
      ];
      if (Number(num[1]) === 7) {
        return {
          reply: "Type it in plain English — what’s eating the time?",
          phase: "pain1",
          discovery: withStage(d, "clarify_pain"),
          proposal: null,
          readyForGate: false,
          teaserLine: null,
        };
      }
      if (idx >= 0 && idx < offered.length) title = offered[idx];
    }

    d = withStage(
      {
        ...d,
        pains: [makePain(title, last)],
        activePainId: "pain1",
      },
      "time"
    );
    return {
      reply: `${title}.\n\nHow many minutes for ONE?\nThen how many times a week?`,
      phase: "time_verify",
      discovery: d,
      proposal: null,
      readyForGate: false,
      teaserLine: null,
    };
  }

  // ——— TIME ———
  if (stage === "time" || stage === "named_pain") {
    const pain = d.pains[0];
    if (!pain) return runSalesTurn(withStage(d, "open"), messages);

    const { minutes: parsedMin, count: parsedCount } = parseMinutesAndCount(last);
    let minutes = pain.time.minutesPerOccurrence;
    let count = pain.time.occurrencesPerWeek;

    if (parsedMin != null && parsedCount != null) {
      minutes = parsedMin;
      count = parsedCount;
    } else if (parsedMin != null && minutes == null) {
      minutes = parsedMin;
    } else if (parsedCount != null && count == null) {
      count = parsedCount;
    } else if (/\b\d+(\.\d+)?\b/.test(last)) {
      const n = Number(last.match(/\b(\d+(?:\.\d+)?)\b/)?.[1]);
      if (Number.isFinite(n)) {
        if (minutes == null) minutes = n;
        else if (count == null) count = n;
      }
    }

    if (minutes == null) {
      return {
        reply: "Ballpark is fine — minutes for one?",
        phase: "time_verify",
        discovery: withStage(d, "time"),
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    if (count == null) {
      const updatedPain = {
        ...pain,
        time: { ...pain.time, minutesPerOccurrence: minutes },
        confidence: 0.6,
      };
      return {
        reply: `${minutes} minutes each. How many times a week?`,
        phase: "time_verify",
        discovery: withStage({ ...d, pains: [updatedPain, ...d.pains.slice(1)] }, "time"),
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    const hidden = Math.max(5, Math.round(minutes * 0.25));
    const computed = Number((((minutes + hidden) * count) / 60).toFixed(1));
    const updatedPain = {
      ...pain,
      time: {
        ...pain.time,
        minutesPerOccurrence: minutes,
        occurrencesPerWeek: count,
        hiddenMinutesPerOccurrence: hidden,
        computedHoursPerWeek: computed,
        underestimationNote: `${minutes}×${count}/wk + stall time ≈ ${computed} hrs/week`,
      },
      confidence: 0.75,
    };

    return {
      reply: `That’s roughly ${computed} hours a week.\n\nWalk me through the steps — start to finish.`,
      phase: "process",
      discovery: withStage({ ...d, pains: [updatedPain, ...d.pains.slice(1)] }, "process"),
      proposal: null,
      readyForGate: false,
      teaserLine: null,
    };
  }

  // ——— PROCESS ———
  if (stage === "process") {
    const pain = d.pains[0];
    if (!pain) return runSalesTurn(withStage(d, "open"), messages);

    if (isUnsure(last) || last.length < 8) {
      return {
        reply: "Messy is fine.\nWhat starts it → what happens next → how it ends?",
        phase: "process",
        discovery: withStage(d, "process"),
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    const steps = last
      .split(/[\n.]| then | → |->/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 3)
      .slice(0, 8);

    const updatedPain = {
      ...pain,
      processSteps:
        steps.length >= 2
          ? steps
          : [last.slice(0, 120), "Handle the missing pieces", "Finish and send"],
      rawDescription: `${pain.rawDescription}\n${last}`.trim(),
      confidence: 0.88,
    };

    return {
      reply: "Got it.\n\nAny other time-killer close behind that — or is this hire #1?",
      phase: "pain2_probe",
      discovery: withStage(
        { ...d, pains: [updatedPain, ...d.pains.slice(1)], seekingSecondPain: true },
        "second"
      ),
      proposal: null,
      readyForGate: false,
      teaserLine: null,
    };
  }

  // ——— SECOND → PITCH ———
  if (stage === "second") {
    let next = d;
    if (
      !isUnsure(last) &&
      !/^(no|nah|nope|this one|hire #?1|just this|that'?s it)\b/i.test(last) &&
      last.length > 4 &&
      d.pains.length < 2
    ) {
      next = {
        ...d,
        pains: [...d.pains, { ...makePain(extractPainTitle(last), last, "pain2"), confidence: 0.4 }],
      };
    }

    const proposal = proposalFallback(next);
    return {
      reply: `Hire #1: ${proposal.employeeName}.\nAbout ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week back.\n\nUnlock to see exactly what it does day to day.`,
      phase: "ready",
      discovery: withStage(note(next, "pitched"), "pitch"),
      proposal,
      readyForGate: true,
      teaserLine: `${proposal.employeeName} · ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week`,
    };
  }

  // After unlock, UI navigates away — pitch stage kept for completeness / future in-chat upsell
  if (stage === "pitch" || stage === "upsell") {
    const proposal = d.pains.length ? proposalFallback(d) : null;
    if (proposal && !hasNote(d, "pitched")) {
      return {
        reply: `Hire #1: ${proposal.employeeName}.\nAbout ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week back.\n\nUnlock to see the plan.`,
        phase: "ready",
        discovery: withStage(note(d, "pitched"), "pitch"),
        proposal,
        readyForGate: true,
        teaserLine: `${proposal.employeeName} · ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week`,
      };
    }
    return {
      reply:
        "Want a second pass that looks at lead-gen and revenue — website, AI visibility, missed calls, reviews?\nYes or no.",
      phase: "ready",
      discovery: withStage(d, "upsell"),
      proposal: proposal,
      readyForGate: false,
      teaserLine: null,
    };
  }

  return {
    reply: "Let’s reset.\nWhat’s the work in your business that should not need a human staring at a screen?",
    phase: "warming",
    discovery: withStage(d, "open"),
    proposal: null,
    readyForGate: false,
    teaserLine: null,
  };
}
