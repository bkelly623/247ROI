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
  // Fill common omissions before strict parse
  const obj =
    raw && typeof raw === "object" ? ({ ...(raw as object) } as Record<string, unknown>) : null;
  if (!obj || typeof obj.reply !== "string") return null;
  if (obj.readyForGate == null) obj.readyForGate = false;
  if (obj.proposal === undefined) obj.proposal = null;
  if (obj.teaserLine === undefined) obj.teaserLine = null;
  if (obj.phase == null) obj.phase = "warming";
  if (obj.discovery == null) obj.discovery = prior;

  const parsed = chatTurnSchema.safeParse(obj);
  if (!parsed.success) {
    console.error("hire turn zod", parsed.error.issues.slice(0, 6));
    // Last resort: keep the model's reply text only
    return {
      reply: String(obj.reply).slice(0, 1200),
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

async function callAnthropic(
  system: string,
  messages: HireMessage[]
): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  // Anthropic requires the transcript to start with a user turn.
  let start = 0;
  while (start < messages.length && messages[start].role === "assistant") start += 1;
  const usable = messages.slice(start);
  if (!usable.length) return null;

  const compacted: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of usable) {
    const role = m.role === "assistant" ? "assistant" : "user";
    const prev = compacted[compacted.length - 1];
    if (prev && prev.role === role) {
      prev.content = `${prev.content}\n\n${m.content}`;
    } else {
      compacted.push({ role, content: m.content });
    }
  }
  if (compacted[0]?.role !== "user") return null;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 1600,
      temperature: 0.5,
      system,
      messages: compacted,
    }),
  });
  if (!res.ok) {
    console.error("Anthropic hire error", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  return data.content?.find((c) => c.type === "text")?.text ?? null;
}

async function callOpenAI(
  system: string,
  messages: HireMessage[]
): Promise<string | null> {
  const key =
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_KEY ||
    process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_HIRE_MODEL || "gpt-4o",
      temperature: 0.5,
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
 * LLM runs the conversation. Engine is emergency fallback only.
 */
export async function runHireChatTurn(input: {
  messages: HireMessage[];
  discovery: DiscoveryState;
}): Promise<ChatTurn> {
  const system = buildSystemPrompt(input.discovery);

  for (const provider of ["openai", "anthropic"] as const) {
    try {
      const text =
        provider === "anthropic"
          ? await callAnthropic(system, input.messages)
          : await callOpenAI(system, input.messages);
      if (!text) continue;
      const raw = extractJson(text);
      const turn = normalizeTurn(raw, input.discovery);
      if (turn?.reply) return turn;
    } catch (e) {
      console.error(`hire ${provider} parse failed`, e);
    }
  }

  // Offline / quota / parse failure — still conversational, no buttons
  const fallback = runSalesTurn(input.discovery, input.messages);
  return {
    ...fallback,
    choices: null,
    inputMode: "text",
  };
}
