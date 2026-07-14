import type { ChatTurn } from "./schema";
import {
  askWhatEatsTime,
  industryExamples,
  normalizeIndustryLabel,
  proposalFallback,
} from "./prompt";
import type { DiscoveryState, HireMessage, PainPoint } from "./types";

function emptyPain(title: string, raw: string, id = "pain1"): PainPoint {
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

function note(d: DiscoveryState, flag: string): DiscoveryState {
  if (d.notes.includes(flag)) return d;
  return { ...d, notes: [...d.notes, flag] };
}

function titleFromText(last: string): string {
  if (/\bno-?show\b/i.test(last)) return "No-show follow-ups";
  if (/\breview\b/i.test(last)) return "Review requests";
  if (/\bestimat|quote|proposal|bid\b/i.test(last)) return "Quotes / estimates";
  if (/\bfollow|chas(e|ing)\b/i.test(last)) return "Follow-ups";
  if (/\bmissed.?call|lead|phone|voicemail\b/i.test(last))
    return "Missed calls / lead response";
  if (/\binbox|email|message|dm\b/i.test(last)) return "Inbox / messages";
  if (/\bschedul|book|appoint|dispatch|resched\b/i.test(last)) return "Scheduling";
  if (/\binvoice|billing|collect\b/i.test(last)) return "Billing admin";
  return last.slice(0, 48).replace(/[^\w\s/-]/g, "").trim() || "Ops work";
}

/**
 * Offline fallback — same order as the live salesman prompt.
 * 1) industry → 2) WHAT task → 3) HOW LONG → process → value → gate
 */
export function runSalesTurn(
  discovery: DiscoveryState,
  messages: HireMessage[]
): ChatTurn {
  const last =
    messages.filter((m) => m.role === "user").at(-1)?.content?.trim() ?? "";
  let d: DiscoveryState = { ...discovery };
  const lower = last.toLowerCase();

  const base = (
    reply: string,
    next: DiscoveryState,
    extra: Partial<ChatTurn> = {}
  ): ChatTurn => ({
    reply,
    phase: extra.phase ?? "warming",
    discovery: next,
    proposal: extra.proposal ?? null,
    readyForGate: extra.readyForGate ?? false,
    teaserLine: extra.teaserLine ?? null,
    choices: null,
    inputMode: "text",
  });

  // ——— 1) INDUSTRY ———
  if (!d.businessType) {
    if (!last || /^(hi|hey|hello|howdy|sup|yo)\b/i.test(last)) {
      return base(
        "Hey — quick one so I don’t waste your time. What kind of business are you in?",
        d
      );
    }
    if (/\b(not sure|idk|don'?t know)\b/i.test(lower) || last.length < 2) {
      return base(
        "No overthinking — industry or niche is enough. Roofing? Dental? Agency? Med spa? What are you?",
        d
      );
    }
    const industry = normalizeIndustryLabel(last);
    d = { ...d, businessType: industry, salesStage: "task" };
    return base(askWhatEatsTime(industry), d, { phase: "pain1" });
  }

  const taskKnown =
    d.notes.includes("task_captured") ||
    Boolean(
      d.pains.find(
        (p) =>
          p.id === "pain1" &&
          p.title &&
          !/^desk|computer time$/i.test(p.title) &&
          p.confidence >= 0.55
      )
    );

  // ——— 2) WHAT (task) ———
  if (!taskKnown) {
    if (
      /\b(don'?t|rarely|never).{0,24}(desk|computer)|in the field|on (the )?job\b/i.test(
        lower
      )
    ) {
      d = { ...d, role: "field_owner" };
      const examples = industryExamples(d.businessType).slice(0, 3).join(", ");
      return base(
        `Totally normal for ${d.businessType}.\nWhat computer or phone work still happens in the business — even if someone else does it?\nOften it’s ${examples}.`,
        d,
        { phase: "pain1" }
      );
    }

    // If they jumped ahead with hours only, nudge to WHAT
    if (
      /^\s*\d+(\.\d+)?\s*(hours?|hrs?|h)?\s*(a|per|\/)?\s*(week|wk|day)?\s*$/i.test(
        last
      ) ||
      (/^\s*\d+(\.\d+)?\s*$/.test(last) && Number(last) <= 80)
    ) {
      return base(
        "We’ll get the hours in a second — first I need the work itself.\nWhat’s the desk or computer grind eating the most time?",
        d,
        { phase: "pain1" }
      );
    }

    if (last.length < 3 || /\b(not sure|idk|don'?t know|whatever|unsure)\b/i.test(lower)) {
      const examples = industryExamples(d.businessType);
      return base(
        `Easy — pick the closest: ${examples.slice(0, 3).join(", ")}, or type your own.`,
        d,
        { phase: "pain1" }
      );
    }

    const title = titleFromText(last);
    const pain = emptyPain(title, last, "pain1");
    pain.confidence = 0.7;
    d = note(
      {
        ...d,
        pains: [pain, ...d.pains.filter((p) => p.id !== "pain1")],
        activePainId: "pain1",
        salesStage: "time",
      },
      "task_captured"
    );
    return base(
      `${title} — that’s usually where the quiet hours disappear.\nRoughly how many hours a week go into that?`,
      d,
      { phase: "time_verify" }
    );
  }

  // ——— 3) HOW LONG ———
  const pain =
    d.pains.find((p) => p.id === "pain1") ??
    d.pains.find((p) => p.id !== "desk") ??
    d.pains[0];
  const timeKnown =
    d.notes.includes("desk_time_captured") ||
    Boolean(
      pain &&
        (pain.time.statedHoursPerWeek != null ||
          pain.time.computedHoursPerWeek != null ||
          (pain.time.minutesPerOccurrence != null &&
            pain.time.occurrencesPerWeek != null))
    );

  if (pain && !timeKnown) {
    const dayMatch = lower.match(
      /(\d+(?:\.\d+)?)\s*(hours?|hrs?)?\s*(a|per|\/)?\s*day/
    );
    const weekMatch = lower.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?)/);
    const minsMatch = lower.match(/(\d+)\s*(min|mins|minutes)/);
    const countMatch = lower.match(
      /(\d+)\s*(times|x|\/\s*week|a week|per week)/
    );
    const rawNum = last.match(/(\d+(?:\.\d+)?)/);

    if (/\b(a lot|too much|all day|constantly)\b/i.test(lower) && !rawNum) {
      return base(
        "“A lot” is usually expensive. Ballpark it — 5 hours a week? 15? 30?",
        d,
        { phase: "time_verify" }
      );
    }

    let weekly: number | null = null;
    if (dayMatch) weekly = Number(dayMatch[1]) * 5;
    else if (minsMatch && countMatch) {
      weekly = Number(
        ((Number(minsMatch[1]) * Number(countMatch[1])) / 60).toFixed(1)
      );
    } else if (weekMatch) weekly = Number(weekMatch[1]);
    else if (rawNum && Number(rawNum[1]) > 0 && Number(rawNum[1]) <= 80) {
      weekly = Number(rawNum[1]);
    }

    if (weekly == null) {
      return base(
        `About how many hours a week does ${pain.title.toLowerCase()} take — rough is fine.`,
        d,
        { phase: "time_verify" }
      );
    }

    const updated = {
      ...pain,
      time: {
        ...pain.time,
        statedHoursPerWeek: weekly,
        computedHoursPerWeek: weekly,
        minutesPerOccurrence: minsMatch ? Number(minsMatch[1]) : pain.time.minutesPerOccurrence,
        occurrencesPerWeek: countMatch
          ? Number(countMatch[1])
          : pain.time.occurrencesPerWeek,
      },
      confidence: Math.max(pain.confidence, 0.8),
    };
    d = note(
      {
        ...d,
        pains: [updated, ...d.pains.filter((p) => p.id !== updated.id)],
        salesStage: "process",
      },
      "desk_time_captured"
    );
    return base(
      `${weekly} hours a week on ${updated.title.toLowerCase()} — that’s real money.\nWalk me through it start to finish: what kicks it off, what happens next, how it ends?`,
      d,
      { phase: "process" }
    );
  }

  // ——— 4) PROCESS / CLOSE ———
  const hasProcess = Boolean(
    pain &&
      (pain.processSteps.length >= 2 ||
        (pain.processSteps.length === 1 && pain.processSteps[0].length > 40))
  );

  if (pain && !hasProcess) {
    if (last.length > 20 && !/^(yes|yep|yeah|sure|ok|okay)\b/i.test(last)) {
      const steps = last
        .split(/[\n.]| then | → |->|,\s+(?=[a-z])/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 3)
        .slice(0, 8);
      const updated = {
        ...pain,
        processSteps: steps.length >= 2 ? steps : [last.slice(0, 200)],
        rawDescription: last,
        confidence: 0.85,
      };
      d = {
        ...d,
        pains: [updated, ...d.pains.filter((p) => p.id !== updated.id)],
        salesStage: "value",
      };
      const proposal = proposalFallback(d);
      return base(
        `So: ${updated.processSteps.join(" → ")}.\nI think we can claw back about ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week on that — the grind, not the judgment calls.\n\nIf we built that for your ${d.businessType} business, would it be valuable?`,
        d,
        { phase: "ready", proposal }
      );
    }
    return base(
      "Need a little more of the process — kickoff → middle → done. Even messy bullets work.",
      d,
      { phase: "process" }
    );
  }

  if (
    pain &&
    (hasProcess || d.salesStage === "value") &&
    /^(yes|yep|yeah|sure|ok|okay|absolutely|definitely)\b/i.test(lower)
  ) {
    const proposal = proposalFallback(d);
    return base(
      `Perfect. Unlock the hire plan for ${proposal.employeeName} — you’ll see exactly what it owns day to day.`,
      { ...d, salesStage: "pitch" },
      {
        phase: "ready",
        proposal,
        readyForGate: true,
        teaserLine: `${proposal.employeeName} · ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week`,
      }
    );
  }

  if (pain && hasProcess) {
    const proposal = proposalFallback(d);
    return base(
      `Based on what you told me, ${proposal.employeeName} could take the repeat weight off ${pain.title}.\nWould that be valuable for your ${d.businessType} business?`,
      d,
      { phase: "ready", proposal }
    );
  }

  return base(askWhatEatsTime(d.businessType || "your industry"), d, {
    phase: "pain1",
  });
}

export function openingTurn(): ChatTurn {
  return {
    reply:
      "Quick one so I can make this useful — what kind of business are you in?\n\n(Roofing, dental, agency, ecommerce, med spa… whatever it is.)",
    phase: "warming",
    discovery: {
      businessName: null,
      businessType: null,
      role: null,
      teamSize: null,
      pains: [],
      activePainId: null,
      seekingSecondPain: false,
      notes: [],
      salesStage: "industry",
    },
    proposal: null,
    readyForGate: false,
    teaserLine: null,
    choices: null,
    inputMode: "text",
  };
}
