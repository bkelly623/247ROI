import type { ChatTurn } from "./schema";
import { industryExamples, proposalFallback } from "./prompt";
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

/**
 * Offline fallback — same discovery order as the live salesman prompt.
 * 1) industry → 2) desk time → 3) what eats it → process → value → gate
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
        "No overthinking — industry or niche is enough. Roofing? Dental? Agency? Shop? What are you?",
        d
      );
    }
    const industry = last.slice(0, 80).trim();
    d = { ...d, businessType: industry, salesStage: "desk_time" };
    const examples = industryExamples(industry).slice(0, 3).join(", ");
    return base(
      `${industry} — perfect.\nHow much time do you (or your team) spend at a desk or on a computer each week — ballpark hours?\n\nIn ${industry}, that time usually goes to stuff like ${examples}.`,
      d,
      { phase: "time_verify" }
    );
  }

  // ——— 2) DESK TIME ———
  const deskKnown = d.notes.includes("desk_time_captured");
  if (!deskKnown) {
    if (
      /\b(don'?t|rarely|never).{0,24}(desk|computer)|in the field|on (the )?job\b/i.test(
        lower
      )
    ) {
      d = { ...d, role: "field_owner", salesStage: "who" };
      return base(
        "Got it — a lot of owners aren’t glued to a chair.\nWho handles the computer / paperwork side, and about how many hours a week does that take?",
        d,
        { phase: "time_verify" }
      );
    }

    const dayMatch = lower.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?)?\s*(a|per|\/)?\s*day/);
    const weekMatch = lower.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?)/);
    const rawNum = last.match(/(\d+(?:\.\d+)?)/);
    let weekly: number | null = null;
    if (dayMatch) weekly = Number(dayMatch[1]) * 5;
    else if (weekMatch) weekly = Number(weekMatch[1]);
    else if (/\b(a lot|too much|all day|constantly)\b/i.test(lower) && !rawNum) {
      return base(
        "“A lot” is usually expensive. Give me a number — 10 hours a week? 20? 40?",
        d,
        { phase: "time_verify" }
      );
    } else if (rawNum && Number(rawNum[1]) > 0 && Number(rawNum[1]) <= 80) {
      weekly = Number(rawNum[1]);
    }

    if (weekly == null) {
      return base(
        `In ${d.businessType}, how many hours a week disappear on a computer or phone doing admin — roughly?`,
        d,
        { phase: "time_verify" }
      );
    }

    const deskPain = emptyPain("Desk / computer time", `${weekly} hrs/week`, "desk");
    deskPain.time.statedHoursPerWeek = weekly;
    deskPain.time.computedHoursPerWeek = weekly;
    d = note(
      {
        ...d,
        pains: d.pains.length ? d.pains : [deskPain],
        salesStage: "task",
      },
      "desk_time_captured"
    );
    // also stamp hours onto first pain if somehow already there
    if (d.pains[0] && d.pains[0].id !== "desk") {
      d.pains = [
        {
          ...d.pains[0],
          time: {
            ...d.pains[0].time,
            statedHoursPerWeek: weekly,
          },
        },
        ...d.pains.slice(1),
      ];
    }

    const examples = industryExamples(d.businessType);
    return base(
      `About ${weekly} hours a week — that’s real money.\nWhat are you spending most of that on?\n\nMost ${d.businessType} owners tell me it’s one of these: ${examples.slice(0, 4).join("; ")}.\nOr name whatever’s worse.`,
      d,
      { phase: "pain1" }
    );
  }

  // ——— 3+) TASK / PROCESS / CLOSE ———
  let pain =
    d.pains.find((p) => p.id === "pain1") ??
    d.pains.find((p) => p.id !== "desk") ??
    d.pains[0];

  const hasRealTask = Boolean(
    pain &&
      pain.id !== "desk" &&
      !/^desk|computer time$/i.test(pain.title) &&
      pain.confidence >= 0.5
  );

  if (!hasRealTask) {
    if (last.length < 3 || /\b(not sure|idk|don'?t know)\b/i.test(lower)) {
      const examples = industryExamples(d.businessType);
      return base(
        `No problem — pick the closest: ${examples.slice(0, 3).join(", ")}, or type your own.`,
        d,
        { phase: "pain1" }
      );
    }
    const title =
      /\bestimat|quote|proposal|bid\b/i.test(last)
        ? "Quotes / estimates"
        : /\bfollow|chas(e|ing)\b/i.test(last)
          ? "Follow-ups"
          : /\bmissed.?call|lead|phone|voicemail\b/i.test(last)
            ? "Missed calls / lead response"
            : /\binbox|email|message\b/i.test(last)
              ? "Inbox / messages"
              : /\bschedul|book|appoint|dispatch\b/i.test(last)
                ? "Scheduling"
                : /\binvoice|billing|collect\b/i.test(last)
                  ? "Billing admin"
                  : last.slice(0, 48).replace(/[^\w\s/-]/g, "").trim() || "Ops work";

    const weekly =
      d.pains.find((p) => p.time.statedHoursPerWeek != null)?.time.statedHoursPerWeek ??
      null;
    pain = emptyPain(title, last, "pain1");
    if (weekly != null) {
      pain.time.statedHoursPerWeek = weekly;
      pain.confidence = 0.7;
    }
    d = {
      ...d,
      pains: [pain, ...d.pains.filter((p) => p.id !== "pain1" && p.id !== "desk")],
      activePainId: "pain1",
      salesStage: "process",
    };
    return base(
      `${title} — that’s usually a goldmine to automate.\nWalk me through it start to finish: what kicks it off, what happens next, how it ends?`,
      d,
      { phase: "process" }
    );
  }

  const hasProcess = Boolean(pain && pain.processSteps.length >= 2);
  if (pain && !hasProcess) {
    if (last.length > 20) {
      const steps = last
        .split(/[\n.]| then | → /i)
        .map((s) => s.trim())
        .filter((s) => s.length > 3)
        .slice(0, 8);
      const updated = {
        ...pain,
        processSteps: steps.length >= 2 ? steps : [last.slice(0, 160)],
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
        `So: ${updated.processSteps.join(" → ")}.\nI think we can claw back about ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week on that — the grind, not the judgment calls.\n\nIf we built that AI employee for your ${d.businessType} business, would it be valuable?`,
        d,
        { phase: "ready", proposal }
      );
    }
    return base(
      "Need a little more of the process — kickoff → middle → done. Even messy bullet points work.",
      d,
      { phase: "process" }
    );
  }

  if (pain && hasProcess && /^(yes|yep|yeah|sure|ok|okay|absolutely|definitely)\b/i.test(lower)) {
    const proposal = proposalFallback(d);
    return base(
      `Hell yes. Unlock the hire plan for ${proposal.employeeName} — you’ll see exactly what it owns day to day.`,
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
      `Based on what you told me, ${proposal.employeeName} could take the repeat weight off ${pain.title}.\nWould that be valuable for your ${d.businessType} shop?`,
      d,
      { phase: "ready", proposal }
    );
  }

  return base(
    `What’s eating most of the desk time in your ${d.businessType} business right now?`,
    d,
    { phase: "pain1" }
  );
}

export function openingTurn(): ChatTurn {
  return {
    reply:
      "Quick one so I can make this useful — what kind of business are you in?\n\n(Roofing, dental, agency, ecommerce, restaurant… whatever it is.)",
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
