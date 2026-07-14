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
      reply: "Got it.\n\nWhat eats the most time at your desk?",
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
        ? "Estimates"
        : lower.includes("follow")
          ? "Follow-ups"
          : lower.includes("inbox") || lower.includes("email")
            ? "Inbox"
            : last.slice(0, 40) || "Desk work";

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
      reply: `${painTitle}. Fair.\n\nHow many minutes does ONE take?\nHow many do you do a week?`,
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
            underestimationNote: `${minutesPerOccurrence} min × ${occurrencesPerWeek}/wk + hunt time ≈ ${computed} hrs/week.`,
          },
          confidence: 0.7,
        },
        ...discovery.pains.slice(1),
      ],
    };

    return {
      reply: `That math is about ${computed} hours a week.\n\nWalk me through the steps, start to finish.`,
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
          processSteps: steps.length
            ? steps
            : [
                "Get the work",
                "Find missing pieces",
                "Finish it",
                "Send / chase",
              ],
          rawDescription: `${pain.rawDescription}\n${last}`.trim(),
          confidence: 0.85,
        },
      ],
      seekingSecondPain: true,
    };

    return {
      reply: "Got it.\n\nAnything else stealing desk time — or is this hire #1?",
      phase: "pain2_probe",
      discovery: updated,
      proposal: null,
      readyForGate: false,
      teaserLine: null,
    };
  }

  const proposal = proposalFallback(discovery);
  return {
    reply: `${proposal.employeeName}.\nAbout ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week back.\n\nUnlock to see the plan.`,
    phase: "ready",
    discovery,
    proposal,
    readyForGate: true,
    teaserLine: `${proposal.employeeName} · ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week`,
  };
}
