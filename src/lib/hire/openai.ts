import { chatTurnSchema, type ChatTurn } from "./schema";
import { buildSystemPrompt, proposalFallback } from "./prompt";
import type { DiscoveryState, HireMessage } from "./types";

function resolveOpenAIKey(): string | undefined {
  return (
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_KEY ||
    process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY
  );
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model output");
  return JSON.parse(raw.slice(start, end + 1));
}

export async function runHireChatTurn(input: {
  messages: HireMessage[];
  discovery: DiscoveryState;
}): Promise<ChatTurn> {
  const key = resolveOpenAIKey();
  if (!key) {
    return offlineTurn(input.discovery, input.messages);
  }

  const system = buildSystemPrompt(input.discovery);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.HIRE_AUDIT_MODEL || "gpt-4o",
      temperature: 0.75,
      max_tokens: 1600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        ...input.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Hire audit OpenAI error", res.status, err);
    return offlineTurn(input.discovery, input.messages);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return offlineTurn(input.discovery, input.messages);

  try {
    const parsed = chatTurnSchema.parse(extractJson(content));
    if (parsed.readyForGate && !parsed.proposal) {
      parsed.proposal = proposalFallback(parsed.discovery);
    }
    return parsed;
  } catch (e) {
    console.error("Hire audit parse failed", e, content.slice(0, 400));
    return {
      reply: content.replace(/```[\s\S]*$/, "").trim() ||
        "Okay — keep going. What exactly happens in that workflow, step by step?",
      phase: "process",
      discovery: input.discovery,
      proposal: null,
      readyForGate: false,
      teaserLine: null,
    };
  }
}

/** Deterministic fallback when no API key — still demo-able for sales walkthroughs. */
function offlineTurn(
  discovery: DiscoveryState,
  messages: HireMessage[]
): ChatTurn {
  const last = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  const lower = last.toLowerCase();

  if (!discovery.businessType && messages.length <= 2) {
    return {
      reply:
        "Perfect. What business are you in — and what's the desk work that's hijacking your week? Estimates, follow-ups, inbox? Name the villain.",
      phase: "warming",
      discovery: {
        ...discovery,
        businessType: last.slice(0, 80) || discovery.businessType,
      },
      proposal: null,
      readyForGate: false,
      teaserLine: null,
    };
  }

  if (discovery.pains.length === 0) {
    const painTitle =
      lower.includes("estimat")
        ? "Estimates / quotes"
        : lower.includes("follow")
          ? "Lead follow-up"
          : lower.includes("inbox") || lower.includes("email")
            ? "Inbox / admin"
            : last.slice(0, 60) || "Desk admin pile";

    const nextDiscovery: DiscoveryState = {
      ...discovery,
      pains: [
        {
          id: "pain1",
          title: painTitle,
          rawDescription: last,
          tools: [],
          processSteps: [],
          whoDoesIt: discovery.role,
          whyItHurts: null,
          time: {
            label: painTitle,
            minutesPerOccurrence: null,
            occurrencesPerWeek: null,
            hiddenMinutesPerOccurrence: null,
            computedHoursPerWeek: null,
            statedHoursPerWeek: null,
            underestimationNote: null,
          },
          automatable: true,
          confidence: 0.4,
        },
      ],
      activePainId: "pain1",
    };

    return {
      reply: `Got it — **${painTitle}**. People lowball this by half without meaning to.\n\nHow long does **one** of those take, start to finish — in minutes? And how many do you knock out in a typical week?`,
      phase: "time_verify",
      discovery: nextDiscovery,
      proposal: null,
      readyForGate: false,
      teaserLine: null,
    };
  }

  const pain = discovery.pains[0];
  if (
    pain.time.minutesPerOccurrence == null ||
    pain.time.occurrencesPerWeek == null
  ) {
    const mins = Number((lower.match(/(\d+)\s*(min|minute)/)?.[1] ?? "").trim());
    const count = Number(
      (lower.match(/(\d+)\s*(a|per)?\s*week/)?.[1] ?? lower.match(/\b(\d+)\b/)?.[1] ?? "").trim()
    );
    const minutesPerOccurrence = Number.isFinite(mins) && mins > 0 ? mins : 25;
    const occurrencesPerWeek = Number.isFinite(count) && count > 0 ? count : 15;
    const hidden = 10;
    const computed = Number(
      (((minutesPerOccurrence + hidden) * occurrencesPerWeek) / 60).toFixed(1)
    );

    const updated = {
      ...discovery,
      pains: [
        {
          ...pain,
          time: {
            ...pain.time,
            minutesPerOccurrence,
            occurrencesPerWeek,
            hiddenMinutesPerOccurrence: hidden,
            computedHoursPerWeek: computed,
            underestimationNote: `Sticker shock: ${minutesPerOccurrence} min × ${occurrencesPerWeek}/wk + ~${hidden} min of hunting/context = ~${computed} hrs/week.`,
          },
          confidence: 0.7,
        },
        ...discovery.pains.slice(1),
      ],
    };

    return {
      reply: `Math check: **${minutesPerOccurrence} minutes × ${occurrencesPerWeek}/week**, plus the little “where was that file / who replied” tax… you’re looking at roughly **${computed} hours/week**.\n\nWalk me through the process A→Z. First click to finished. What tools? Where does it get stuck?`,
      phase: "process",
      discovery: updated,
      proposal: null,
      readyForGate: false,
      teaserLine: null,
    };
  }

  if (pain.processSteps.length < 3) {
    const steps = last
      .split(/[.\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8)
      .slice(0, 8);

    const updated: DiscoveryState = {
      ...discovery,
      pains: [
        {
          ...pain,
          processSteps: steps.length ? steps : [
            "Receive the work item",
            "Gather missing details",
            "Build the output",
            "Send / chase / log",
          ],
          rawDescription: `${pain.rawDescription}\n${last}`.trim(),
          confidence: 0.85,
        },
      ],
      seekingSecondPain: true,
    };

    return {
      reply:
        "Solid. If we hired an AI employee to eat that workflow, what *else* would still nibble at your week — or are we locking this as hire #1?",
      phase: "pain2_probe",
      discovery: updated,
      proposal: null,
      readyForGate: false,
      teaserLine: null,
    };
  }

  const proposal = proposalFallback(discovery);
  return {
    reply: `Alright. I've got enough to draft your first hire.\n\n**${proposal.employeeName}** — roughly **${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week** clawed back from the desk.\n\nUnlock the full job description (A→Z, how you use it, what still needs your brain) and we'll put a name on the relief.`,
    phase: "ready",
    discovery,
    proposal,
    readyForGate: true,
    teaserLine: `${proposal.employeeName} · ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week back`,
  };
}
