import type { ChatTurn } from "./schema";
import { proposalFallback } from "./prompt";
import type { DiscoveryState, HireMessage, PainPoint } from "./types";
import {
  COUNT_CHOICES,
  MIRROR_CHOICES,
  MINUTES_CHOICES,
  OBJECTION_CHOICES,
  PAIN_CHOICES,
  TIME_BAND_CHOICES,
  VALUE_CHOICES,
  WHO_CHOICES,
  type ChatChoice,
  type InputMode,
  painTitleFromValue,
  timeBandHours,
} from "./choices";

export type SalesStage =
  | "open"
  | "who"
  | "other_pain"
  | "time_band"
  | "mins"
  | "count"
  | "process"
  | "mirror"
  | "fix_mirror"
  | "value"
  | "objection"
  | "pitch";

const GREETING = /^(hi|hey|hello|howdy|sup|yo|hiya|good (morning|afternoon|evening))[\s!.?]*$/i;
const UNSURE =
  /\b(not sure|idk|i don'?t know|dunno|no idea|unsure|whatever|help me|hmm+)\b/i;

function stageOf(d: DiscoveryState): SalesStage {
  const allowed: SalesStage[] = [
    "open",
    "who",
    "other_pain",
    "time_band",
    "mins",
    "count",
    "process",
    "mirror",
    "fix_mirror",
    "value",
    "objection",
    "pitch",
  ];
  if (allowed.includes(d.salesStage as SalesStage)) return d.salesStage as SalesStage;
  return "open";
}

function withStage(d: DiscoveryState, salesStage: SalesStage): DiscoveryState {
  return { ...d, salesStage };
}

function note(d: DiscoveryState, flag: string): DiscoveryState {
  if (d.notes.includes(flag)) return d;
  return { ...d, notes: [...d.notes, flag] };
}

function turn(
  reply: string,
  discovery: DiscoveryState,
  opts: {
    phase?: ChatTurn["phase"];
    choices?: ChatChoice[] | null;
    inputMode?: InputMode;
    proposal?: ChatTurn["proposal"];
    readyForGate?: boolean;
    teaserLine?: string | null;
  } = {}
): ChatTurn {
  return {
    reply,
    phase: opts.phase ?? "warming",
    discovery,
    proposal: opts.proposal ?? null,
    readyForGate: opts.readyForGate ?? false,
    teaserLine: opts.teaserLine ?? null,
    choices: opts.choices ?? null,
    inputMode: opts.inputMode ?? (opts.choices?.length ? "choices" : "text"),
  };
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
    confidence: 0.55,
  };
}

function extractPainTitle(text: string): string {
  const fromCode = painTitleFromValue(text);
  if (fromCode) return fromCode;
  const lower = text.toLowerCase();
  if (/missed.?call|phone|after.?hours|voicemail|lead response/.test(lower))
    return "Missed calls / lead response";
  if (/follow|chase|check.?in/.test(lower)) return "Follow-ups";
  if (/inbox|email|message|text|sms|dm/.test(lower)) return "Inbox / messages";
  if (/schedul|book|appoint|calendar|resched/.test(lower)) return "Scheduling";
  if (/estimat|quote|proposal|bid/.test(lower)) return "Quotes / proposals";
  if (/invoice|billing|collect|receivable/.test(lower)) return "Billing admin";
  if (/data.?entr|spreadsheet|excel|crm|copy.?paste|between system/.test(lower))
    return "Data entry between systems";
  const cleaned = text.replace(/[^\w\s/-]/g, "").trim();
  return cleaned.slice(0, 56) || "Ops admin";
}

function askTime(d: DiscoveryState, title: string): ChatTurn {
  return turn(
    `${title}. Got it.\nRoughly how many hours a week does that burn?`,
    withStage(d, "time_band"),
    { phase: "time_verify", choices: TIME_BAND_CHOICES, inputMode: "choices" }
  );
}

function buildMirror(pain: PainPoint): string {
  const steps =
    pain.processSteps.length >= 2
      ? pain.processSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : pain.rawDescription;
  return `Let me say it back so we’re locked in:\n\n${steps}\n\nDid I get that right?`;
}

function savingsFromHours(hours: number): { low: number; high: number } {
  const low = Math.max(1, Math.round(hours * 0.7 * 10) / 10);
  const high = Math.max(low + 0.5, Math.round(hours * 0.9 * 10) / 10);
  return { low, high };
}

function howItWorks(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("quote") || t.includes("proposal") || t.includes("estimat")) {
    return "Here’s the simple version:\nA lead comes in → it pulls the job details → it drafts the quote in your format → you approve anything weird → it sends it and follows up if they go quiet.";
  }
  if (t.includes("follow")) {
    return "Here’s the simple version:\nIt watches who went quiet → pings them on schedule in your voice → tags hot replies for you → logs everything so nobody falls through a crack.";
  }
  if (t.includes("inbox") || t.includes("message")) {
    return "Here’s the simple version:\nMessages land → it sorts junk from real work → drafts replies → asks you only when money or a judgment call is involved → files the rest.";
  }
  if (t.includes("schedul") || t.includes("book")) {
    return "Here’s the simple version:\nSomeone wants time → it checks availability → offers slots → books it → sends confirmations and reminders → flags conflicts for a human.";
  }
  if (t.includes("bill") || t.includes("invoice")) {
    return "Here’s the simple version:\nWork gets marked done → it builds the invoice → sends it → nags unpaid balances politely → escalates stubborn ones to you.";
  }
  if (t.includes("call") || t.includes("lead")) {
    return "Here’s the simple version:\nA call or form comes in → it answers or texts back right away → gathers what’s needed → books or routes the lead → you only touch the ones that need a human.";
  }
  if (t.includes("data")) {
    return "Here’s the simple version:\nInfo shows up in one place → it copies the right fields into the next system → checks for blanks → alerts you when something doesn’t match.";
  }
  return "Here’s the simple version:\nWork shows up → it handles the repeat steps end to end → it asks you only when judgment or money is involved → you get a clean handoff instead of a pile.";
}

function paintValueAsk(d: DiscoveryState): ChatTurn {
  const pain = d.pains[0];
  const hours = pain?.time.computedHoursPerWeek ?? pain?.time.statedHoursPerWeek ?? 10;
  const { low, high } = savingsFromHours(hours);
  const title = pain?.title ?? "this work";
  const proposal = proposalFallback({
    ...d,
    pains: pain
      ? [
          {
            ...pain,
            time: {
              ...pain.time,
              computedHoursPerWeek: hours,
            },
          },
          ...d.pains.slice(1),
        ]
      : d.pains,
  });
  proposal.hoursSavedPerWeek = { low: Math.round(low), high: Math.round(high) };
  proposal.monthlyHoursSaved = {
    low: Math.round(low) * 4,
    high: Math.round(high) * 4,
  };
  proposal.jobFromAtoZ =
    pain?.processSteps.length && pain.processSteps.length >= 3
      ? pain.processSteps
      : proposal.jobFromAtoZ;

  const reply = `Based on what you told me, I think we can get about ${Math.round(low)}–${Math.round(high)} hours a week back on ${title} — most of the grind, not the judgment calls.\n\n${howItWorks(title)}\n\nIf we built that for you, would it be valuable?`;

  return turn(reply, withStage(note(d, "value_asked"), "value"), {
    phase: "ready",
    choices: VALUE_CHOICES,
    inputMode: "choices",
    proposal,
    teaserLine: `${proposal.employeeName} · ${Math.round(low)}–${Math.round(high)} hrs/week`,
  });
}

/**
 * Deterministic button-first discovery. Source of truth for stage + discovery.
 */
export function runSalesTurn(
  discovery: DiscoveryState,
  messages: HireMessage[]
): ChatTurn {
  const lastRaw = messages.filter((m) => m.role === "user").at(-1)?.content?.trim() ?? "";
  const last = lastRaw;
  let d: DiscoveryState = { ...discovery, salesStage: stageOf(discovery) };
  const stage = stageOf(d);

  // ——— OPEN ———
  if (stage === "open") {
    if (!last || GREETING.test(last)) {
      return turn(
        last && GREETING.test(last)
          ? "Hey. Tap the closest match below — we’ll dig in from there."
          : HIRE_OPENING_LINE(),
        withStage(d, "open"),
        { phase: "warming", choices: PAIN_CHOICES, inputMode: "choices" }
      );
    }

    if (last === "meta:not_desk" || /don'?t (really )?(sit|spend).{0,20}desk|rarely at (a )?desk|not at (a )?desk|in the field/i.test(last)) {
      return turn(
        "Got it — a lot of owners aren’t stuck at a screen.\nWho actually handles the computer / paperwork side?",
        withStage(note(d, "field_owner"), "who"),
        { phase: "warming", choices: WHO_CHOICES, inputMode: "choices" }
      );
    }

    if (last === "meta:other" || UNSURE.test(last)) {
      return turn(
        "No problem. Type the work in plain English — like “chasing unpaid invoices” or “rebooking no-shows.”",
        withStage(d, "other_pain"),
        { phase: "pain1", choices: null, inputMode: "text" }
      );
    }

    const coded = painTitleFromValue(last);
    if (coded || last.startsWith("pain:")) {
      const title = coded ?? extractPainTitle(last);
      d = {
        ...d,
        pains: [makePain(title, title)],
        activePainId: "pain1",
      };
      return askTime(d, title);
    }

    // Free-text named a real thing (not a greeting)
    if (last.length >= 3 && !GREETING.test(last)) {
      const title = extractPainTitle(last);
      d = {
        ...d,
        pains: [makePain(title, last)],
        activePainId: "pain1",
      };
      return askTime(d, title);
    }

    return turn(HIRE_OPENING_LINE(), withStage(d, "open"), {
      phase: "warming",
      choices: PAIN_CHOICES,
      inputMode: "choices",
    });
  }

  // ——— WHO (field owner) ———
  if (stage === "who") {
    let role: string | null = null;
    if (last === "who:me" || /^(me|myself|i do|on my phone)\b/i.test(last)) {
      role = "owner-mobile";
    } else if (
      last === "who:employee" ||
      /\b(employee|office|assistant|receptionist|manager|staff)\b/i.test(last)
    ) {
      role = "delegated-admin";
    } else if (
      last === "who:family" ||
      /\b(spouse|wife|husband|family)\b/i.test(last)
    ) {
      role = "delegated-admin";
    } else if (
      last === "who:nobody" ||
      /\b(nobody|no one|piles? up|falls through)\b/i.test(last)
    ) {
      role = "neglected-admin";
    }

    if (role) {
      d = note({ ...d, role }, "offered_buckets");
      return turn(
        role === "owner-mobile"
          ? "That’s still computer work — just on your phone.\nWhat’s chewing the most time?"
          : role === "neglected-admin"
            ? "That pile is usually expensive.\nWhat’s rotting the worst?"
            : "Good — we automate their grind, not yours.\nWhat do they spend the most time on?",
        withStage(d, "open"),
        {
          phase: "pain1",
          choices: PAIN_CHOICES.filter((c) => c.id !== "not_desk"),
          inputMode: "choices",
        }
      );
    }
    return turn("Tap who handles that side of the business:", withStage(d, "who"), {
      phase: "warming",
      choices: WHO_CHOICES,
      inputMode: "choices",
    });
  }

  // ——— OTHER PAIN (typed) ———
  if (stage === "other_pain") {
    if (GREETING.test(last) || last.length < 3) {
      return turn(
        "Give me the actual task — a short phrase is enough.",
        withStage(d, "other_pain"),
        { phase: "pain1", inputMode: "text" }
      );
    }
    const title = extractPainTitle(last);
    d = {
      ...d,
      pains: [makePain(title, last)],
      activePainId: "pain1",
    };
    return askTime(d, title);
  }

  // ——— TIME BAND ———
  if (stage === "time_band") {
    const pain = d.pains[0];
    if (!pain) return runSalesTurn(withStage(d, "open"), messages);

    const band = timeBandHours(last);
    const stated =
      band ??
      (/\d+/.test(last) ? Number(last.match(/(\d+(?:\.\d+)?)/)?.[1]) : null);

    if (stated == null || !Number.isFinite(stated)) {
      return turn("Tap a range — ballpark is fine.", withStage(d, "time_band"), {
        phase: "time_verify",
        choices: TIME_BAND_CHOICES,
        inputMode: "choices",
      });
    }

    const updated: PainPoint = {
      ...pain,
      time: {
        ...pain.time,
        statedHoursPerWeek: stated,
      },
      confidence: 0.65,
    };
    d = { ...d, pains: [updated, ...d.pains.slice(1)] };

    return turn(
      `About ${stated} hours a week — noted.\nTo keep us honest: how long does ONE usually take?`,
      withStage(d, "mins"),
      { phase: "time_verify", choices: MINUTES_CHOICES, inputMode: "choices" }
    );
  }

  // ——— MINUTES ———
  if (stage === "mins") {
    const pain = d.pains[0];
    if (!pain) return runSalesTurn(withStage(d, "open"), messages);

    const fromCode = last.match(/^mins:(\d+)/);
    const minutes = fromCode
      ? Number(fromCode[1])
      : Number(last.match(/(\d+(?:\.\d+)?)/)?.[1]);

    if (!Number.isFinite(minutes) || minutes <= 0) {
      return turn("How many minutes for one?", withStage(d, "mins"), {
        phase: "time_verify",
        choices: MINUTES_CHOICES,
        inputMode: "both",
      });
    }

    const updated: PainPoint = {
      ...pain,
      time: { ...pain.time, minutesPerOccurrence: minutes },
    };
    d = { ...d, pains: [updated, ...d.pains.slice(1)] };

    return turn(
      `${minutes} minutes each.\nHow many times a week?`,
      withStage(d, "count"),
      { phase: "time_verify", choices: COUNT_CHOICES, inputMode: "choices" }
    );
  }

  // ——— COUNT ———
  if (stage === "count") {
    const pain = d.pains[0];
    if (!pain) return runSalesTurn(withStage(d, "open"), messages);

    const fromCode = last.match(/^count:(\d+)/);
    const count = fromCode
      ? Number(fromCode[1])
      : Number(last.match(/(\d+(?:\.\d+)?)/)?.[1]);

    if (!Number.isFinite(count) || count <= 0) {
      return turn("How many times a week?", withStage(d, "count"), {
        phase: "time_verify",
        choices: COUNT_CHOICES,
        inputMode: "choices",
      });
    }

    const minutes = pain.time.minutesPerOccurrence ?? 15;
    const hidden = Math.max(3, Math.round(minutes * 0.2));
    const computed = Number((((minutes + hidden) * count) / 60).toFixed(1));
    const stated = pain.time.statedHoursPerWeek;
    let noteText = `${minutes} min × ${count}/week ≈ ${computed} hrs before stall time.`;
    if (stated != null && Math.abs(stated - computed) >= 5) {
      noteText +=
        stated > computed
          ? ` Your ${stated} hr guess is higher — usually means more hunting, redos, or leftover pieces. We’ll use the middle.`
          : ` Your ${stated} hr guess is lower than the math — most people undercount the back-and-forth.`;
    }

    const blended =
      stated != null
        ? Number((((stated + computed) / 2)).toFixed(1))
        : computed;

    const updated: PainPoint = {
      ...pain,
      time: {
        ...pain.time,
        occurrencesPerWeek: count,
        hiddenMinutesPerOccurrence: hidden,
        computedHoursPerWeek: blended,
        underestimationNote: noteText,
      },
      confidence: 0.8,
    };
    d = { ...d, pains: [updated, ...d.pains.slice(1)] };

    return turn(
      `${noteText}\n\nWalk me through the process — start to finish. What starts it, what happens next, how it ends? Messy is fine.`,
      withStage(d, "process"),
      { phase: "process", choices: null, inputMode: "text" }
    );
  }

  // ——— PROCESS ———
  if (stage === "process") {
    const pain = d.pains[0];
    if (!pain) return runSalesTurn(withStage(d, "open"), messages);

    if (GREETING.test(last) || last.length < 12) {
      return turn(
        "Need a little more detail — even bullet points.\nWhat kicks it off → what’s mid-stream → how it finishes?",
        withStage(d, "process"),
        { phase: "process", inputMode: "text" }
      );
    }

    const steps = last
      .split(/[\n.]| then | → |->|;/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 3)
      .slice(0, 8);

    const updated: PainPoint = {
      ...pain,
      processSteps:
        steps.length >= 2
          ? steps
          : [last.slice(0, 160), "Handle the middle steps", "Finish and send / log"],
      rawDescription: last,
      confidence: 0.88,
    };
    d = { ...d, pains: [updated, ...d.pains.slice(1)] };

    return turn(buildMirror(updated), withStage(d, "mirror"), {
      phase: "process",
      choices: MIRROR_CHOICES,
      inputMode: "both",
    });
  }

  // ——— MIRROR ———
  if (stage === "mirror") {
    if (last === "mirror:tweak" || /fix|no|not quite|wrong|missing/i.test(last)) {
      return turn(
        "Tell me what I got wrong — I’ll rewrite it.",
        withStage(d, "fix_mirror"),
        { phase: "process", inputMode: "text" }
      );
    }
    if (last === "mirror:yes" || /^(yes|yep|yeah|correct|right|that'?s it|perfect)\b/i.test(last)) {
      return paintValueAsk(note(d, "mirrored"));
    }
    // Free text correction treated as improved process
    if (last.length > 10) {
      const pain = d.pains[0];
      if (pain) {
        const steps = last
          .split(/[\n.]| then | → |->|;/i)
          .map((s) => s.trim())
          .filter((s) => s.length > 3)
          .slice(0, 8);
        const updated = {
          ...pain,
          processSteps: steps.length >= 2 ? steps : [...pain.processSteps, last.slice(0, 120)],
          rawDescription: `${pain.rawDescription}\n${last}`.trim(),
        };
        d = { ...d, pains: [updated, ...d.pains.slice(1)] };
        return turn(buildMirror(updated), withStage(d, "mirror"), {
          phase: "process",
          choices: MIRROR_CHOICES,
          inputMode: "both",
        });
      }
    }
    return turn("Did I get the process right?", withStage(d, "mirror"), {
      phase: "process",
      choices: MIRROR_CHOICES,
      inputMode: "choices",
    });
  }

  if (stage === "fix_mirror") {
    const pain = d.pains[0];
    if (!pain || last.length < 5) {
      return turn("What should I change?", withStage(d, "fix_mirror"), {
        phase: "process",
        inputMode: "text",
      });
    }
    const steps = last
      .split(/[\n.]| then | → |->|;/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 3)
      .slice(0, 8);
    const updated = {
      ...pain,
      processSteps: steps.length >= 2 ? steps : [last.slice(0, 200)],
      rawDescription: last,
    };
    d = { ...d, pains: [updated, ...d.pains.slice(1)] };
    return turn(buildMirror(updated), withStage(d, "mirror"), {
      phase: "process",
      choices: MIRROR_CHOICES,
      inputMode: "both",
    });
  }

  // ——— VALUE ———
  if (stage === "value") {
    if (last === "value:yes" || last === "value:maybe" || /^(yes|yep|yeah|sure|maybe)\b/i.test(last)) {
      const proposal = d.pains.length ? proposalFallback(d) : proposalFallback(d);
      // Prefer hours already computed in paintValueAsk path via discovery
      const hours = d.pains[0]?.time.computedHoursPerWeek ?? 10;
      const { low, high } = savingsFromHours(hours);
      proposal.hoursSavedPerWeek = { low: Math.round(low), high: Math.round(high) };
      proposal.monthlyHoursSaved = {
        low: Math.round(low) * 4,
        high: Math.round(high) * 4,
      };

      return turn(
        last === "value:maybe" || /^maybe\b/i.test(last)
          ? "Fair. Unlock the hire plan and you’ll see the A→Z job, how you’d use it day to day, and the hours — then decide."
          : "Good. Unlock the hire plan and I’ll show the exact job — A→Z, how you use it, and what we’d build first.",
        withStage(note(d, "pitched"), "pitch"),
        {
          phase: "ready",
          proposal,
          readyForGate: true,
          teaserLine: `${proposal.employeeName} · ${Math.round(low)}–${Math.round(high)} hrs/week`,
          choices: null,
          inputMode: "text",
        }
      );
    }

    if (last === "value:no" || /^(no|nah|nope)\b/i.test(last)) {
      return turn(
        "Okay — what’s in the way?",
        withStage(d, "objection"),
        { phase: "pain2_probe", choices: OBJECTION_CHOICES, inputMode: "both" }
      );
    }

    return paintValueAsk(d);
  }

  // ——— OBJECTION ———
  if (stage === "objection") {
    if (last === "obj:hard_no" || /hard no|not interested|never/i.test(last)) {
      return turn(
        "Totally fine.\nWant a different pass instead — missed calls, website, AI visibility, or reviews? That one finds revenue leaks instead of desk hours.\n\nReply yes if you want that, or close this tab if not.",
        withStage(note(d, "pivoted"), "pitch"),
        { phase: "ready", choices: null, inputMode: "text" }
      );
    }

    if (last === "obj:cost" || /cost|price|expensive|money/i.test(last)) {
      return turn(
        "Fair. We price against hours back — if it doesn’t beat the cost, we shouldn’t build it.\nUnlock the plan and you’ll see the hours math next to the job. Worth a look?",
        withStage(d, "value"),
        {
          phase: "ready",
          choices: [
            { id: "yes", label: "Okay, show me", value: "value:yes" },
            { id: "no", label: "Still no", value: "obj:hard_no" },
          ],
          inputMode: "choices",
        }
      );
    }

    if (last === "obj:trust" || /trust|ai|mistake|wrong/i.test(last)) {
      return turn(
        "You’re not handing it the company keys. Approvals stay with you for money and judgment calls — it does the repeat work.\nWant to see how that handoff looks?",
        withStage(d, "value"),
        {
          phase: "ready",
          choices: [
            { id: "yes", label: "Show me", value: "value:yes" },
            { id: "no", label: "Not for us", value: "obj:hard_no" },
          ],
          inputMode: "choices",
        }
      );
    }

    if (last === "obj:time" || /busy|setup|implement/i.test(last)) {
      return turn(
        "We do the setup. You approve the playbook and exceptions — that’s it for most owners.\nWant the plan anyway?",
        withStage(d, "value"),
        {
          phase: "ready",
          choices: [
            { id: "yes", label: "Alright, show me", value: "value:yes" },
            { id: "no", label: "Not now", value: "obj:hard_no" },
          ],
          inputMode: "choices",
        }
      );
    }

    if (last === "obj:different" || /something else|different|other problem/i.test(last)) {
      return turn(
        "What’s the real headache then?",
        withStage({ ...d, pains: [], activePainId: null }, "other_pain"),
        { phase: "pain1", inputMode: "text" }
      );
    }

    return turn("What’s the hold-up?", withStage(d, "objection"), {
      phase: "pain2_probe",
      choices: OBJECTION_CHOICES,
      inputMode: "both",
    });
  }

  // ——— PITCH (gate already offered / leftover) ———
  if (stage === "pitch") {
    const proposal = d.pains.length ? proposalFallback(d) : null;
    if (proposal && !d.notes.includes("pitched")) {
      return turn(
        "Unlock the hire plan when you’re ready.",
        withStage(note(d, "pitched"), "pitch"),
        {
          phase: "ready",
          proposal,
          readyForGate: true,
          teaserLine: `${proposal.employeeName} · ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week`,
        }
      );
    }
    return turn(
      "If you want the revenue pass next — missed calls, website, AI visibility, reviews — say yes.",
      withStage(d, "pitch"),
      { phase: "ready", inputMode: "text" }
    );
  }

  return turn(HIRE_OPENING_LINE(), withStage(d, "open"), {
    phase: "warming",
    choices: PAIN_CHOICES,
    inputMode: "choices",
  });
}

function HIRE_OPENING_LINE() {
  return "Tap whatever eats the most time on a computer or phone.\nDon’t overthink it — closest match is fine.";
}

/** First paint — buttons before any user message */
export function openingTurn(): ChatTurn {
  return turn(HIRE_OPENING_LINE(), withStage(
    {
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
    "open"
  ), {
    phase: "warming",
    choices: PAIN_CHOICES,
    inputMode: "choices",
  });
}
