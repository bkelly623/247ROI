import { chatTurnSchema, type ChatTurn } from "./schema";
import { buildSystemPrompt, proposalFallback } from "./prompt";
import { runSalesTurn } from "./sales-engine";
import type { DiscoveryState, HireMessage } from "./types";

function resolveOpenAIKey(): string | undefined {
  const raw =
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_KEY ||
    process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  return raw?.trim() || undefined;
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

  // Prefer deterministic sales engine when the model is unavailable / out of quota.
  // Still try the LLM first when a key exists.
  if (!key) {
    return runSalesTurn(input.discovery, input.messages);
  }

  const system = buildSystemPrompt(input.discovery);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.HIRE_AUDIT_MODEL || "gpt-4o-mini",
        temperature: 0.55,
        max_tokens: 1200,
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
      return runSalesTurn(input.discovery, input.messages);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return runSalesTurn(input.discovery, input.messages);

    try {
      const parsed = chatTurnSchema.parse(extractJson(content));
      // Never let the model invent a pain from shrug language
      const lastUser = input.messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
      if (
        /\b(not sure|i don'?t know|idk|unsure)\b/i.test(lastUser) &&
        parsed.discovery.pains.some((p) =>
          /\b(not sure|i don'?t know|idk)\b/i.test(p.title + p.rawDescription)
        )
      ) {
        return runSalesTurn(input.discovery, input.messages);
      }
      if (parsed.readyForGate && !parsed.proposal) {
        parsed.proposal = proposalFallback(parsed.discovery);
      }
      return parsed;
    } catch (e) {
      console.error("Hire audit parse failed", e, content.slice(0, 400));
      return runSalesTurn(input.discovery, input.messages);
    }
  } catch (e) {
    console.error("Hire audit fetch failed", e);
    return runSalesTurn(input.discovery, input.messages);
  }
}
