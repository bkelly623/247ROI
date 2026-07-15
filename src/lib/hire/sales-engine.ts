import type { ChatTurn } from "./schema";
import {
  askWhatEatsTime,
  industryExamples,
  normalizeIndustryLabel,
  proposalFallback,
} from "./prompt";
import { hireLines, pickLine } from "./lines";
import type { DiscoveryState, HireMessage, PainPoint } from "./types";

function seedFrom(d: DiscoveryState, last: string): string {
  return `${d.businessType || ""}|${d.salesStage || ""}|${d.notes.length}|${last.slice(0, 12)}`;
}

function painHours(pain: PainPoint | undefined): number {
  return (
    pain?.time.computedHoursPerWeek ?? pain?.time.statedHoursPerWeek ?? 0
  );
}

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

function uniqueNotes(d: DiscoveryState, flags: string[]): string[] {
  return [...new Set([...d.notes, ...flags.filter(Boolean)])];
}

function titleFromText(last: string): string {
  if (/\bbookkeep|ledger|quickbooks|xero|reconcile\b/i.test(last))
    return "Bookkeeping";
  if (/\binsurance|claim|billing\b/i.test(last)) return "Billing / insurance";
  if (/\bno-?show\b/i.test(last)) return "No-show follow-ups";
  if (/\breview\b/i.test(last)) return "Review requests";
  if (/\bestimat|quote|proposal|bid\b/i.test(last)) return "Quotes / estimates";
  if (/\bfollow|chas(e|ing)\b/i.test(last)) return "Follow-ups";
  if (/\bmissed.?call|lead|phone|voicemail\b/i.test(last))
    return "Missed calls / lead response";
  if (/\binbox|email|message|dm\b/i.test(last)) return "Inbox / email";
  if (/\bschedul|book|appoint|dispatch|resched\b/i.test(last))
    return "Scheduling";
  if (/\binvoice|collect\b/i.test(last)) return "Invoicing";
  return last.slice(0, 48).replace(/[^\w\s/-]/g, "").trim() || "Ops work";
}

function isVagueIndustry(text: string): boolean {
  return /^(business owner|owner|entrepreneur|small business|my (own )?business|self[- ]?employed)\.?$/i.test(
    text.trim()
  );
}

function extractHours(text: string): number | null {
  const lower = text.toLowerCase();
  const day = lower.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?)?\s*(a|per|\/)?\s*day/);
  if (day) return Number(day[1]) * 5;
  const week = lower.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?)/);
  if (week) return Number(week[1]);
  if (/^\s*\d+(?:\.\d+)?\s*$/.test(text)) {
    const n = Number(text.trim());
    if (n > 0 && n <= 80) return n;
  }
  return null;
}

function parseDualPains(text: string): string[] {
  // Prefer explicit dual markers
  if (/\balso\b/i.test(text) || /\band\b.+\b(i |we )?(do|handle|spend|manage)/i.test(text)) {
    const parts = text
      .split(/\balso\b/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);
    if (parts.length >= 2) return parts.slice(0, 3);
  }
  const parts = text
    .split(/\band\b|,|;/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
  if (parts.length >= 2) {
    const titles = parts.map(titleFromText);
    if (new Set(titles).size >= 2) return parts.slice(0, 3);
  }
  return [text];
}

/**
 * Offline fallback — Work Optional–style discovery OS.
 * Industry → problem → (detail) → hours → mirror → value → gate.
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
    const seed = seedFrom(d, last);
    if (!last || /^(hi|hey|hello|howdy|sup|yo)\b/i.test(last)) {
      return base(pickLine(hireLines.askIndustry, seed), d);
    }
    if (isVagueIndustry(last) || /\b(not sure|idk)\b/i.test(lower)) {
      return base(pickLine(hireLines.vagueIndustry, seed), d);
    }
    if (/what do you mean|why|huh|wdym/i.test(lower)) {
      return base(pickLine(hireLines.clarifyIndustry, seed), d);
    }
    const industry = normalizeIndustryLabel(last);
    if (!industry) {
      return base(pickLine(hireLines.clarifyIndustry, seed + "x"), d);
    }
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

  // ——— 2) WHAT ———
  if (!taskKnown) {
    if (last.length < 3 || /\b(not sure|idk|don'?t know|nothing|no idea)\b/i.test(lower)) {
      const examples = industryExamples(d.businessType).slice(0, 3).join("; ");
      return base(
        `What’s eating the hours then?\nCommon in ${d.businessType}: ${examples}.`,
        d,
        { phase: "pain1" }
      );
    }

    // Answering the rank question
    if (d.notes.includes("multi_pain") && d.salesStage === "rank") {
      const parkedNote = d.notes.find((n) => n.startsWith("parked:"))?.slice(7) ?? "";
      const parkedTitles = parkedNote.split("|").filter(Boolean);
      // Also allow original dual titles from prior turn stored in pains? Reconstruct both options
      const allCandidates = [
        ...parkedTitles,
        ...d.notes
          .filter((n) => n.startsWith("options:"))
          .flatMap((n) => n.slice(8).split("|")),
      ].filter(Boolean);

      let title = titleFromText(last);
      const matched = allCandidates.find((c) => {
        const cl = c.toLowerCase();
        const ll = last.toLowerCase();
        if (ll.includes(cl)) return true;
        if (cl.includes("email") || cl.includes("inbox")) {
          return /\b(email|emails|inbox|messages)\b/.test(ll);
        }
        if (cl.includes("bookkeep")) {
          return /\b(bookkeep|books|accounting|quickbooks|ledger)\b/.test(ll);
        }
        const first = cl.split(/[\s/]+/)[0];
        return first.length > 3 && ll.includes(first);
      });
      if (matched) title = matched;

      const others = allCandidates.filter((c) => c !== title);
      const pain = emptyPain(title, last, "pain1");
      pain.confidence = 0.75;
      const secondary = others[0]
        ? emptyPain(others[0], others[0], "pain2")
        : null;

      d = note(
        {
          ...d,
          pains: secondary ? [pain, secondary] : [pain],
          activePainId: "pain1",
          salesStage: title === "Inbox / email" ? "time" : "detail",
          notes: [
            ...d.notes.filter((n) => !n.startsWith("parked:") && !n.startsWith("options:")),
            others.length ? `parked:${others.join("|")}` : "",
          ].filter(Boolean),
        },
        "task_captured"
      );

      if (title === "Inbox / email") {
        return base("Email. Hours a week?", d, { phase: "time_verify" });
      }
      return base(
        pickLine(hireLines.askProcess, seedFrom(d, last))(title),
        d,
        { phase: "process" }
      );
    }

    const chunks = parseDualPains(last);
    if (chunks.length >= 2) {
      const titles = [...new Set(chunks.map(titleFromText))];
      if (titles.length >= 2) {
        d = {
          ...d,
          salesStage: "rank",
          notes: uniqueNotes(d, [
            "multi_pain",
            `options:${titles.join("|")}`,
            `parked:${titles.slice(1).join("|")}`,
          ]),
        };
        return base(
          `${titles.join(" and ")}.\nWhich one burns more hours in a normal week?`,
          d,
          { phase: "pain1" }
        );
      }
    }

    const title = titleFromText(last);
    const pain = emptyPain(title, last, "pain1");
    pain.confidence = 0.7;
    d = note(
      {
        ...d,
        pains: [pain, ...d.pains.filter((p) => p.id !== "pain1")],
        activePainId: "pain1",
        salesStage: "detail",
      },
      "task_captured"
    );

    // Thin email-only answers → hours first, don't fake deep discovery
    if (/^(i )?just (answer|respond|check) (to )?emails?\b/i.test(last) || title === "Inbox / email") {
      return base(
        "Email. Roughly how many hours a week?",
        d,
        { phase: "time_verify" }
      );
    }

    return base(
      pickLine(hireLines.askProcess, seedFrom(d, last))(title),
      d,
      { phase: "process" }
    );
  }

  const pain =
    d.pains.find((p) => p.id === "pain1") ??
    d.pains.find((p) => p.id !== "desk") ??
    d.pains[0];

  // Soft reject / tiny problem → pivot to parked
  if (
    pain &&
    (/not a big deal|doesn'?t (even )?take|no\.?$|nah|not really|manageable/i.test(
      lower
    ) ||
      (extractHours(last) != null && (extractHours(last) as number) <= 3 && !d.notes.includes("desk_time_captured")))
  ) {
    const parked = d.notes.find((n) => n.startsWith("parked:"))?.slice(7);
    const hours = extractHours(last);
    if (hours != null && hours <= 3) {
      const updated = {
        ...pain,
        time: {
          ...pain.time,
          statedHoursPerWeek: hours,
          computedHoursPerWeek: hours,
        },
      };
      d = {
        ...d,
        pains: [updated, ...d.pains.filter((p) => p.id !== updated.id)],
      };
      if (parked) {
        const nextTitle = parked.split("|")[0];
        const next = emptyPain(nextTitle, nextTitle, "pain1");
        next.confidence = 0.7;
        d = note(
          {
            ...d,
            pains: [next, { ...updated, id: "pain2" }],
            activePainId: "pain1",
            salesStage: "detail",
            notes: d.notes.filter((n) => !n.startsWith("parked:")),
          },
          "task_captured"
        );
        return base(
          `${hours} hrs on ${updated.title.toLowerCase()} isn’t the hire.\n${nextTitle} — hours a week?`,
          d,
          { phase: "time_verify" }
        );
      }
      return base(
        `${hours} hrs isn’t worth automating.\nWhat else on a computer eats real time?`,
        {
          ...d,
          salesStage: "task",
          notes: d.notes.filter((n) => n !== "task_captured"),
          pains: d.pains.filter((p) => p.id !== "pain1"),
          activePainId: null,
        },
        { phase: "pain1" }
      );
    }
    if (parked && /not a big deal|no\.?$|nah|not really|manageable/i.test(lower)) {
      const nextTitle = parked.split("|")[0];
      const next = emptyPain(nextTitle, nextTitle, "pain1");
      next.confidence = 0.7;
      d = {
        ...d,
        pains: [next, { ...pain, id: "pain2" }],
        activePainId: "pain1",
        salesStage: "detail",
        notes: [
          ...d.notes.filter((n) => !n.startsWith("parked:") && n !== "desk_time_captured"),
          "task_captured",
        ],
      };
        return base(
          `Fine — park ${pain.title.toLowerCase()}.\n${nextTitle}. Hours a week?`,
          d,
          { phase: "time_verify" }
        );
    }
  }

  const timeKnown =
    d.notes.includes("desk_time_captured") ||
    Boolean(
      pain &&
        (pain.time.statedHoursPerWeek != null ||
          pain.time.computedHoursPerWeek != null)
    );

  // ——— DETAIL before time if needed ———
  const hasProcess = Boolean(
    pain &&
      (pain.processSteps.length >= 2 ||
        (pain.processSteps.length === 1 && pain.processSteps[0].length > 40))
  );

  if (pain && !hasProcess && d.salesStage === "detail") {
    const maybeHours = extractHours(last);
    if (maybeHours != null && last.length < 20) {
      // They jumped to hours — accept and continue
      const updated = {
        ...pain,
        time: {
          ...pain.time,
          statedHoursPerWeek: maybeHours,
          computedHoursPerWeek: maybeHours,
        },
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
        `${maybeHours} hours on ${updated.title.toLowerCase()}.\nWalk me through it — what happens from start to finish?`,
        d,
        { phase: "process" }
      );
    }
    if (last.length > 15 && !/^(yes|yep|yeah|no|nah)\b/i.test(last)) {
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
        salesStage: "time",
      };
      return base(
        pickLine(hireLines.askHours, seedFrom(d, last))(updated.title),
        d,
        { phase: "time_verify" }
      );
    }
    return base("Step by step — how do you do it today?", d, {
      phase: "process",
    });
  }

  // ——— HOURS ———
  if (pain && !timeKnown) {
    if (/\b(a lot|too much|all day)\b/i.test(lower) && extractHours(last) == null) {
      return base("Ballpark it — 5, 15, 30 hours a week?", d, {
        phase: "time_verify",
      });
    }
    const weekly = extractHours(last);
    if (weekly == null) {
      return base(
        `Hours per week on ${pain.title.toLowerCase()}?`,
        d,
        { phase: "time_verify" }
      );
    }
    if (weekly <= 3) {
      const parked = d.notes.find((n) => n.startsWith("parked:"))?.slice(7);
      const updated = {
        ...pain,
        time: {
          ...pain.time,
          statedHoursPerWeek: weekly,
          computedHoursPerWeek: weekly,
        },
      };
      if (parked) {
        const nextTitle = parked.split("|")[0];
        const next = emptyPain(nextTitle, nextTitle, "pain1");
        next.confidence = 0.7;
        d = {
          ...d,
          pains: [next, { ...updated, id: "pain2" }],
          notes: [
            ...d.notes.filter(
              (n) =>
                !n.startsWith("parked:") &&
                n !== "desk_time_captured" &&
                n !== "task_captured"
            ),
            "task_captured",
          ],
          salesStage: "time",
        };
        return base(
          `${weekly} on ${updated.title.toLowerCase()} is light.\n${nextTitle} — hours per week?`,
          d,
          { phase: "time_verify" }
        );
      }
    }

    const updated = {
      ...pain,
      time: {
        ...pain.time,
        statedHoursPerWeek: weekly,
        computedHoursPerWeek: weekly,
      },
      confidence: Math.max(pain.confidence, 0.85),
    };
    d = note(
      {
        ...d,
        pains: [updated, ...d.pains.filter((p) => p.id !== updated.id)],
        salesStage: hasProcess ? "mirror" : "process",
      },
      "desk_time_captured"
    );

    if (!hasProcess) {
      return base(
        `${weekly} hours. Walk me through it start to finish.`,
        d,
        { phase: "process" }
      );
    }

    d = note(d, "mirrored");
    const proposal = proposalFallback(d);
    return base(
      pickLine(hireLines.confirmMirror, seedFrom(d, last))(
        updated.processSteps.join(" → "),
        weekly
      ),
      { ...d, salesStage: "confirm" },
      { phase: "process", proposal }
    );
  }

  // ——— PROCESS after hours ———
  if (pain && timeKnown && !hasProcess) {
    if (last.length > 15 && !/^(yes|yep|yeah|no|nah)\b/i.test(last)) {
      const steps = last
        .split(/[\n.]| then | → |->|,\s+(?=[a-z])/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 3)
        .slice(0, 8);
      const updated = {
        ...pain,
        processSteps: steps.length >= 2 ? steps : [last.slice(0, 200)],
        rawDescription: last,
        confidence: 0.9,
      };
      d = note(
        {
          ...d,
          pains: [updated, ...d.pains.filter((p) => p.id !== updated.id)],
          salesStage: "confirm",
        },
        "mirrored"
      );
      const hrs =
        updated.time.statedHoursPerWeek ?? updated.time.computedHoursPerWeek;
      return base(
        pickLine(hireLines.confirmMirror, seedFrom(d, last))(
          updated.processSteps.join(" → "),
          hrs ?? "?"
        ),
        d,
        { phase: "process" }
      );
    }
    return base("Start to finish — how does it work today?", d, {
      phase: "process",
    });
  }

  // ——— CONFIRM → short path (hours ≥ 8) skips second-order + micro-commit ———
  if (
    pain &&
    hasProcess &&
    timeKnown &&
    /^(yes|yep|yeah|yup|right|correct|that'?s right|sounds right|exactly)\b/i.test(
      lower
    ) &&
    !d.notes.includes("pitched_value")
  ) {
    const hrs = painHours(pain);
    const seed = seedFrom(d, last);

    // Meaningful hours → pitch immediately (shorter funnel)
    if (hrs >= 8 || d.notes.includes("short_path")) {
      const proposal = proposalFallback(note(d, "short_path"));
      const steps = pain.processSteps.length
        ? pain.processSteps
            .map((s) => `the system ${s.toLowerCase()}`)
            .join(", then ")
        : "the system takes the repeat steps end to end";
      const pitch = `Think of it like a hire with perfect memory: ${steps}. You keep the judgment calls.`;
      d = note(
        note({ ...d, salesStage: "value" }, "pitched_value"),
        "short_path"
      );
      return base(pickLine(hireLines.valuable, seed)(pitch), d, {
        phase: "ready",
        proposal,
      });
    }

    if (!d.notes.includes("second_order")) {
      d = note({ ...d, salesStage: "second_order" }, "second_order");
      return base(pickLine(hireLines.secondOrder, seed)(hrs || 10), d, {
        phase: "pain2_probe",
      });
    }
  }

  if (
    d.salesStage === "second_order" ||
    (d.notes.includes("second_order") && !d.notes.includes("pitched_value"))
  ) {
    if (!d.notes.includes("want_solve") && d.salesStage === "second_order") {
      d = note({ ...d, salesStage: "want_solve" }, "want_solve");
      if (last.length > 2) {
        d = note(d, `impact:${last.slice(0, 120)}`);
      }
      return base(pickLine(hireLines.wantSolve, seedFrom(d, last)), d, {
        phase: "pain2_probe",
      });
    }
  }

  if (
    d.notes.includes("want_solve") &&
    !d.notes.includes("pitched_value") &&
    /^(yes|yep|yeah|sure|i (do|want)|solve|fix)\b/i.test(lower)
  ) {
    const proposal = proposalFallback(d);
    const steps = pain?.processSteps?.length
      ? pain.processSteps.map((s) => `the system ${s.toLowerCase()}`).join(", then ")
      : "the system takes the repeat steps end to end";
    const pitch = `Think of it like a hire with perfect memory: ${steps}. You keep the judgment calls.`;
    d = note({ ...d, salesStage: "value" }, "pitched_value");
    return base(pickLine(hireLines.valuable, seedFrom(d, last))(pitch), d, {
      phase: "ready",
      proposal,
    });
  }

  if (
    d.notes.includes("want_solve") &&
    /^(no|nah|accepted|fine|living with)\b/i.test(lower)
  ) {
    return base(
      "Alright.\nAnything else on a computer burning 10+ hours a week — or are we done?",
      { ...d, salesStage: "task", notes: d.notes.filter((n) => n !== "task_captured" && n !== "desk_time_captured" && n !== "mirrored") },
      { phase: "pain1" }
    );
  }

  if (
    (d.notes.includes("pitched_value") || d.salesStage === "value") &&
    /^(yes|yep|yeah|sure|absolutely|definitely|i think so)\b/i.test(lower)
  ) {
    const proposal = proposalFallback(d);
    return base(
      `Unlock ${proposal.employeeName} — job A→Z and hours back.`,
      { ...d, salesStage: "pitch" },
      {
        phase: "ready",
        proposal,
        readyForGate: true,
        teaserLine: `${proposal.employeeName} · ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week`,
      }
    );
  }

  if (
    (d.notes.includes("pitched_value") || d.salesStage === "value") &&
    /^(no|nah|not really)\b/i.test(lower)
  ) {
    return base(
      "What’s off — cost, trust, timing, or wrong problem?",
      { ...d, salesStage: "objection" },
      { phase: "pain2_probe" }
    );
  }

  if (pain && hasProcess && timeKnown && !d.notes.includes("mirrored")) {
    d = note({ ...d, salesStage: "confirm" }, "mirrored");
    const hrs =
      pain.time.statedHoursPerWeek ?? pain.time.computedHoursPerWeek;
    return base(
      `So: ${pain.processSteps.join(" → ")}. ~${hrs} hrs/week.\nDo I have that right?`,
      d,
      { phase: "process" }
    );
  }

  if (pain && hasProcess && timeKnown) {
    const proposal = proposalFallback(d);
    return base(
      `If we made ${pain.title.toLowerCase()} mostly automatic, would that be valuable?`,
      note({ ...d, salesStage: "value" }, "pitched_value"),
      { phase: "ready", proposal }
    );
  }

  return base(askWhatEatsTime(d.businessType || "your industry"), d, {
    phase: "pain1",
  });
}

export function openingTurn(): ChatTurn {
  return {
    reply: "What kind of business are you in?",
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
