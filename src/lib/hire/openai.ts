import { buildSystemPrompt, mergeDiscovery, proposalFallback } from "./prompt";
import { chatTurnSchema, type ChatTurn } from "./schema";
import { runSalesTurn } from "./sales-engine";
import type { DiscoveryState, HireMessage } from "./types";

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("No JSON in model response");
  }
}

function normalizeTurn(
  raw: unknown,
  prior: DiscoveryState
): ChatTurn | null {
  const obj =
    raw && typeof raw === "object"
      ? ({ ...(raw as object) } as Record<string, unknown>)
      : null;
  if (!obj || typeof obj.reply !== "string" || !String(obj.reply).trim()) {
    return null;
  }
  if (obj.readyForGate == null) obj.readyForGate = false;
  if (obj.proposal === undefined) obj.proposal = null;
  if (obj.teaserLine === undefined) obj.teaserLine = null;
  if (obj.phase == null) obj.phase = "warming";
  if (obj.discovery == null) obj.discovery = prior;

  const parsed = chatTurnSchema.safeParse(obj);
  if (!parsed.success) {
    console.error("hire turn zod", parsed.error.issues.slice(0, 6));
    // Keep intelligent reply text even if schema is messy
    return {
      reply: String(obj.reply).slice(0, 1500),
      phase: "warming",
      discovery: prior,
      proposal: null,
      readyForGate: false,
      teaserLine: null,
      choices: null,
      inputMode: "text",
    };
  }

  const turn = parsed.data;
  const discovery = mergeDiscovery(prior, turn.discovery as DiscoveryState);
  let proposal = turn.proposal ?? null;
  if (turn.readyForGate && !proposal && discovery.pains.length) {
    proposal = proposalFallback(discovery);
  }
  // If they pitched value but forgot proposal, still build one when gate-ready
  if (turn.readyForGate && proposal) {
    // enrich emotional payoff from notes if model left it generic
    const impact = discovery.notes
      .find((n) => n.startsWith("impact:"))
      ?.slice(7)
      .trim();
    if (impact && !proposal.emotionalPayoff.includes(impact)) {
      proposal = {
        ...proposal,
        emotionalPayoff: `You said you’d put the time toward: ${impact}`,
      };
    }
  }

  return {
    reply: turn.reply,
    phase: turn.phase,
    discovery,
    proposal,
    readyForGate: turn.readyForGate ?? false,
    teaserLine:
      turn.teaserLine ??
      (proposal
        ? `${proposal.employeeName} · ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week`
        : null),
    choices: null,
    inputMode: "text",
  };
}

async function callOpenAI(
  system: string,
  messages: HireMessage[]
): Promise<string | null> {
  const key =
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_KEY ||
    process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!key) {
    console.error("hire OpenAI: no API key");
    return null;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_HIRE_MODEL || process.env.OPENAI_MODEL || "gpt-4o",
      temperature: 0.65,
      max_tokens: 1800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!res.ok) {
    console.error("OpenAI hire error", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? null;
}

/**
 * Full-power conversational salesman.
 * OpenAI drives the dialogue. Engine is emergency fallback only.
 */
export async function runHireChatTurn(input: {
  messages: HireMessage[];
  discovery: DiscoveryState;
}): Promise<ChatTurn> {
  const system = buildSystemPrompt(input.discovery);

  try {
    const text = await callOpenAI(system, input.messages);
    if (text) {
      const raw = extractJson(text);
      const turn = normalizeTurn(raw, input.discovery);
      if (turn?.reply) return turn;
    }
  } catch (e) {
    console.error("hire OpenAI parse failed", e);
  }

  // Offline / quota / parse failure
  const fallback = runSalesTurn(input.discovery, input.messages);
  return {
    ...fallback,
    choices: null,
    inputMode: "text",
  };
}

export function parseModelTurn(
  raw: unknown,
  prior: DiscoveryState
): ChatTurn | null {
  return normalizeTurn(raw, prior);
}
