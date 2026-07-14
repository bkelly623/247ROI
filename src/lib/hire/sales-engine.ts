import type { ChatTurn } from "./schema";
import { proposalFallback } from "./prompt";
import type { DiscoveryState, HireMessage, PainPoint } from "./types";

/**
 * Emergency offline fallback when LLMs fail.
 * Conversational text only — no buttons, no choice codes.
 */
export function runSalesTurn(
  discovery: DiscoveryState,
  messages: HireMessage[]
): ChatTurn {
  const last =
    messages.filter((m) => m.role === "user").at(-1)?.content?.trim() ?? "";
  const d: DiscoveryState = { ...discovery };
  const lower = last.toLowerCase();
  const userTurns = messages.filter((m) => m.role === "user").length;

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

  if (!last || /^(hi|hey|hello|howdy|sup|yo)\b/i.test(last)) {
    return base(
      "Hey — what’s eating the most time on a computer or phone in your business right now?",
      d
    );
  }

  if (
    /\b(not sure|idk|don'?t know|dunno|no idea)\b/i.test(lower) &&
    !d.pains.length
  ) {
    return base(
      "Totally fine. What kind of business is it? Once I know that, I can name the usual time-killers.",
      { ...d, salesStage: "clarify" }
    );
  }

  if (
    /\b(don'?t|rarely|never).{0,20}(desk|computer|office)\b|\bin the field\b/i.test(
      lower
    ) &&
    !d.role
  ) {
    return base(
      "Makes sense. Who handles the computer and paperwork side — you after hours, an employee, family, or does it just pile up?",
      { ...d, role: "field_owner", salesStage: "who" }
    );
  }

  // Enough discovery already → pitch
  const pain = d.pains[0];
  const hasProcess = Boolean(pain?.processSteps?.length >= 2);
  const hasHours = Boolean(
    pain?.time.computedHoursPerWeek ||
      pain?.time.statedHoursPerWeek ||
      (pain?.time.minutesPerOccurrence && pain?.time.occurrencesPerWeek)
  );

  if (pain && hasHours && hasProcess && /^(yes|yep|yeah|sure|ok|okay)\b/i.test(lower)) {
    const proposal = proposalFallback(d);
    return base(
      `Good. I’ve got a first hire sketched: ${proposal.employeeName}. Unlock the plan to see exactly what it owns day to day.`,
      { ...d, salesStage: "pitch" },
      {
        phase: "ready",
        proposal,
        readyForGate: true,
        teaserLine: `${proposal.employeeName} · ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week`,
      }
    );
  }

  if (pain && hasHours && hasProcess && userTurns >= 5) {
    const proposal = proposalFallback(d);
    const hrs = proposal.hoursSavedPerWeek;
    return base(
      `Based on what you shared, I think we can get roughly ${hrs.low}–${hrs.high} hours a week back on ${pain.title}. It would handle the repeat steps; you’d keep judgment and money calls.\n\nWould something like that be valuable?`,
      { ...d, salesStage: "value" },
      { phase: "ready", proposal }
    );
  }

  if (pain && hasHours && !hasProcess) {
    if (last.length > 20) {
      const steps = last
        .split(/[\n.]| then | → /i)
        .map((s) => s.trim())
        .filter((s) => s.length > 3)
        .slice(0, 8);
      const updated: PainPoint = {
        ...pain,
        processSteps: steps.length >= 2 ? steps : [last.slice(0, 160)],
        rawDescription: last,
      };
      return base(
        `So roughly: ${updated.processSteps.join(" → ")}. That sound right, or am I missing a piece?`,
        {
          ...d,
          pains: [updated, ...d.pains.slice(1)],
          salesStage: "mirror",
        },
        { phase: "process" }
      );
    }
    return base(
      "Walk me through how it works start to finish — what kicks it off, what happens next, how it ends.",
      { ...d, salesStage: "process" },
      { phase: "process" }
    );
  }

  if (pain && !hasHours) {
    const hoursMatch = lower.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?)/);
    const minsMatch = lower.match(/(\d+)\s*(min|mins|minutes)/);
    const countMatch = lower.match(/(\d+)\s*(times|x|\/\s*week|a week|per week)/);
    if (hoursMatch) {
      const hrs = Number(hoursMatch[1]);
      const updated = {
        ...pain,
        time: { ...pain.time, statedHoursPerWeek: hrs, computedHoursPerWeek: hrs },
      };
      return base(
        `About ${hrs} hours a week — noted. How does one of those usually go, start to finish?`,
        { ...d, pains: [updated, ...d.pains.slice(1)], salesStage: "process" },
        { phase: "process" }
      );
    }
    if (minsMatch && countMatch) {
      const minutes = Number(minsMatch[1]);
      const count = Number(countMatch[1]);
      const computed = Number(((minutes * count) / 60).toFixed(1));
      const updated = {
        ...pain,
        time: {
          ...pain.time,
          minutesPerOccurrence: minutes,
          occurrencesPerWeek: count,
          computedHoursPerWeek: computed,
        },
      };
      return base(
        `That’s roughly ${computed} hours a week. Walk me through the process start to finish.`,
        { ...d, pains: [updated, ...d.pains.slice(1)], salesStage: "process" },
        { phase: "process" }
      );
    }
    return base(
      "Ballpark — how many hours a week does that burn? Or minutes each × how many times a week.",
      { ...d, salesStage: "time" },
      { phase: "time_verify" }
    );
  }

  // Capture a new pain from free text
  if (last.length >= 3 && !d.pains.length) {
    const title =
      /\bestimat|quote|proposal|bid\b/i.test(last)
        ? "Quotes / estimates"
        : /\bfollow|chas(e|ing)\b/i.test(last)
          ? "Follow-ups"
          : /\binbox|email|message\b/i.test(last)
            ? "Inbox / messages"
            : last.slice(0, 48).replace(/[^\w\s/-]/g, "").trim() || "Ops work";
    const newPain: PainPoint = {
      id: "pain1",
      title,
      rawDescription: last,
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
      confidence: 0.5,
    };
    return base(
      `${title} — got it. Roughly how many hours a week does that take?`,
      {
        ...d,
        pains: [newPain],
        activePainId: "pain1",
        salesStage: "time",
      },
      { phase: "pain1" }
    );
  }

  return base(
    "What’s the computer or phone work that eats the most time in your business?",
    d
  );
}

export function openingTurn(): ChatTurn {
  return {
    reply:
      "What’s the work in your business that still needs a person staring at a screen or phone — and shouldn’t?\n\nIf you’re not sure, just say so.",
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
      salesStage: "open",
    },
    proposal: null,
    readyForGate: false,
    teaserLine: null,
    choices: null,
    inputMode: "text",
  };
}
