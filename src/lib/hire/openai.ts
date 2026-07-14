import { runSalesTurn } from "./sales-engine";
import type { DiscoveryState, HireMessage } from "./types";
import type { ChatTurn } from "./schema";

/**
 * Stage + discovery are owned by the sales engine (buttons / codes).
 * Optional LLM polish only rewrites free-text replies — never discovery.
 */
export async function runHireChatTurn(input: {
  messages: HireMessage[];
  discovery: DiscoveryState;
}): Promise<ChatTurn> {
  const base = runSalesTurn(input.discovery, input.messages);
  const last = input.messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  const isCoded = /^(pain|meta|who|time|mins|count|mirror|value|obj):/.test(last.trim());
  const stage = String(base.discovery.salesStage || "");
  const wantsPolish =
    !isCoded &&
    (stage === "process" ||
      stage === "mirror" ||
      stage === "fix_mirror" ||
      stage === "other_pain");

  if (!wantsPolish) return base;

  const polished = await polishReply({
    engineReply: base.reply,
    discovery: base.discovery,
    lastUser: last,
  });

  if (!polished) return base;
  return { ...base, reply: polished };
}

async function polishReply(input: {
  engineReply: string;
  discovery: DiscoveryState;
  lastUser: string;
}): Promise<string | null> {
  const anthropic = process.env.ANTHROPIC_API_KEY;
  const openai = process.env.OPENAI_API_KEY;
  if (!anthropic && !openai) return null;

  const system = `You polish one short sales-chat reply for 247ROI's AI employee audit.
Rules:
- Keep the SAME intent and next question as the engine reply.
- Sound like a sharp human: warm, clear, slightly funny, never corporate, never tech jargon.
- Max 60 words unless you are mirroring a process (then up to 90).
- Do not invent facts they didn't say.
- Do not ask for name/phone/email.
- Return ONLY the reply text.`;

  const user = `Engine reply to polish:
${input.engineReply}

Their last message:
${input.lastUser}

Known discovery JSON:
${JSON.stringify(input.discovery)}`;

  try {
    if (anthropic) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anthropic,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
          max_tokens: 300,
          system,
          messages: [{ role: "user", content: user }],
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        content?: { type: string; text?: string }[];
      };
      const text = data.content?.find((c) => c.type === "text")?.text?.trim();
      return text || null;
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${openai}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}
