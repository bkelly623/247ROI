import type { ChatTurn } from "./schema";
import { proposalFallback } from "./prompt";
import type { DiscoveryState, HireMessage, PainPoint } from "./types";

export type SalesStage =
  | "open"
  | "clarify_pain"
  | "named_pain"
  | "time"
  | "process"
  | "second"
  | "pitch";

const UNSURE =
  /\b(not sure|idk|i don'?t know|dunno|no idea|unsure|nothing|whatever|help me|hmm+|maybe)\b/i;

const GENERIC_PAINS = [
  "chasing people / follow-ups",
  "inbox and messages",
  "scheduling / booking",
  "quotes or proposals",
  "invoices / billing admin",
  "copying data between systems",
  "reports and weekly updates",
];

function stageOf(d: DiscoveryState): SalesStage {
  const raw = d.salesStage;
  if (
    raw === "open" ||
    raw === "clarify_pain" ||
    raw === "named_pain" ||
    raw === "time" ||
    raw === "process" ||
    raw === "second" ||
    raw === "pitch"
  ) {
    return raw;
  }
  return "open";
}

function withStage(d: DiscoveryState, salesStage: SalesStage): DiscoveryState {
  return { ...d, salesStage };
}

function isUnsure(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  // Number picks like "2" are answers, not shrugs
  if (/^\d{1,2}$/.test(t)) return false;
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
  // Don't use the whole shrug sentence as a title
  if (isUnsure(text)) return "Desk work";
  const cleaned = text.replace(/[^\w\s/-]/g, "").trim();
  return cleaned.slice(0, 48) || "Desk work";
}

function makePain(title: string, raw: string): PainPoint {
  return {
    id: "pain1",
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
    // "30 and 20" or "30, 20" → assume minutes, then count
    minutes = nums[0];
    count = nums[1];
  } else if (minutes != null && count == null && nums.length >= 2) {
    count = nums.find((n) => n !== minutes) ?? null;
  } else if (minutes == null && count != null && nums.length >= 2) {
    minutes = nums.find((n) => n !== count) ?? null;
  } else if (minutes == null && count == null && nums.length === 1) {
    // ambiguous — keep null so we ask the missing piece
  }

  return { minutes, count };
}

/**
 * Rule-based sales discovery. Must feel like a human closer when the LLM is down
 * or returns garbage — especially on "I'm not sure."
 */
export function runSalesTurn(
  discovery: DiscoveryState,
  messages: HireMessage[]
): ChatTurn {
  const last = messages.filter((m) => m.role === "user").at(-1)?.content?.trim() ?? "";
  let d = { ...discovery, salesStage: stageOf(discovery) };
  let stage = stageOf(d);

  // Bootstrap stage from discovery if legacy sessions lack salesStage
  if (!discovery.salesStage) {
    if (d.pains[0]?.processSteps.length >= 3) stage = "second";
    else if (
      d.pains[0]?.time.minutesPerOccurrence != null &&
      d.pains[0]?.time.occurrencesPerWeek != null
    )
      stage = "process";
    else if (d.pains.length > 0) stage = "time";
    else if (d.notes.includes("offered_buckets")) stage = "clarify_pain";
    else stage = "open";
    d = withStage(d, stage);
  }

  // ——— OPEN: first answer after opener ———
  if (stage === "open") {
    if (isUnsure(last)) {
      d = withStage(
        {
          ...d,
          notes: [...d.notes.filter((n) => n !== "offered_buckets"), "offered_buckets"],
        },
        "clarify_pain"
      );
      return {
        reply:
          "Totally fair — most people can't name it cold.\n\nWhat kind of business do you run? I'll throw you a short list.",
        phase: "warming",
        discovery: d,
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    // They named something that looks like a workflow
    const title = extractPainTitle(last);
    if (!isUnsure(last) && last.length > 2) {
      d = withStage(
        {
          ...d,
          pains: [makePain(title, last)],
          activePainId: "pain1",
        },
        "time"
      );
      return {
        reply: `${title}. Got it.\n\nAbout how many minutes does one of those take?`,
        phase: "time_verify",
        discovery: d,
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    d = withStage(d, "clarify_pain");
    return {
      reply: "No stress.\n\nWhat do you do for a living / what kind of shop is this?",
      phase: "warming",
      discovery: d,
      proposal: null,
      readyForGate: false,
      teaserLine: null,
    };
  }

  // ——— CLARIFY: help them pick a pain ———
  if (stage === "clarify_pain") {
    if (!d.businessType && looksLikeBusiness(last) && !isUnsure(last)) {
      d = {
        ...d,
        businessType: last.slice(0, 80),
        notes: [...d.notes, "offered_buckets"],
      };
      return {
        reply: `${last.trim()}. Cool.\n\nWhich of these burns the most time?\n1) Follow-ups\n2) Inbox\n3) Scheduling\n4) Quotes\n5) Billing admin\n6) Something else — tell me`,
        phase: "pain1",
        discovery: withStage(d, "clarify_pain"),
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    if (isUnsure(last)) {
      return {
        reply: `Pick the closest one:\n${GENERIC_PAINS.map((p, i) => `${i + 1}) ${p}`).join("\n")}\n\nOr just describe a normal Tuesday on the computer.`,
        phase: "pain1",
        discovery: withStage(d, "clarify_pain"),
        proposal: null,
        readyForGate: false,
        teaserLine: null,
      };
    }

    // Number pick or named pain
    const num = last.match(/^\s*([1-7])\s*$/);
    let title = extractPainTitle(last);
    if (num) {
      const idx = Number(num[1]) - 1;
      const offered = d.businessType
        ? [
            "Follow-ups",
            "Inbox",
            "Scheduling",
            "Quotes / proposals",
            "Billing admin",
          ]
        : GENERIC_PAINS.map((p) => p.replace(/^\w/, (c) => c.toUpperCase()));
      if (d.businessType && Number(num[1]) === 6) {
        return {
          reply: "Tell me in plain English — what are you stuck doing on the computer?",
          phase: "pain1",
          discovery: withStage(d, "clarify_pain"),
          proposal: null,
          readyForGate: false,
          teaserLine: null,
        };
      }
      if (idx >= 0 && idx < offered.length) {
        title = offered[idx];
      }
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
      reply: `${title}.\n\nHow many minutes for one? Then how many times a week?`,
      phase: "time_verify",
      discovery: d,
      proposal: null,
      readyForGate: false,
      teaserLine: null,
    };
  }

  // ——— TIME ———
  if (stage === "time" || (d.pains[0] && stage === "named_pain")) {
    const pain = d.pains[0];
    if (!pain) {
      return runSalesTurn(withStage(d, "open"), messages);
    }

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
      d = {
        ...d,
        pains: [{ ...pain, time: { ...pain.time } }],
      };
      return {
        reply: "Just a rough number — how many minutes for one of those?",
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
        underestimationNote: `${minutes} min × ${count}/wk, plus hunting around, lands near ${computed} hrs/week.`,
      },
      confidence: 0.75,
    };

    return {
      reply: `That’s about ${computed} hours a week once you count the little stalls.\n\nWalk me through it start to finish — what happens first?`,
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
        reply:
          "Even messy is fine.\n\nWhat kicks it off? Then what do you do next? Then how does it end?",
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
      reply:
        "Clear enough.\n\nIf we take that off your plate, is there a close #2 — or is this the one?",
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

  // ——— SECOND / PITCH ———
  if (stage === "second" || stage === "pitch") {
    let next = d;
    if (
      !isUnsure(last) &&
      !/^(no|nah|nope|this one|hire #?1|just this|that'?s it)\b/i.test(last) &&
      last.length > 4 &&
      d.pains.length < 2
    ) {
      next = {
        ...d,
        pains: [
          ...d.pains,
          {
            ...makePain(extractPainTitle(last), last),
            id: "pain2",
            confidence: 0.4,
          },
        ],
      };
    }

    const proposal = proposalFallback(next);
    return {
      reply: `Here's hire #1: ${proposal.employeeName}.\nRoughly ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hours a week back.\n\nUnlock and I'll show exactly what it does.`,
      phase: "ready",
      discovery: withStage(next, "pitch"),
      proposal,
      readyForGate: true,
      teaserLine: `${proposal.employeeName} · ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week`,
    };
  }

  // Fallback
  return {
    reply: "Let's reset.\n\nWhat computer work keeps stealing time from real work?",
    phase: "warming",
    discovery: withStage(d, "open"),
    proposal: null,
    readyForGate: false,
    teaserLine: null,
  };
}
