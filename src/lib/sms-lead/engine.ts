/**
 * Conversational lead-capture engine for the missed-call text-back flow.
 * Reuses the same OpenAI call pattern as src/lib/hire/openai.ts but with a
 * leaner schema tuned for SMS: short replies, no markdown, no chips.
 *
 * Conversation state lives entirely in Twilio's own Messages log (see
 * getConversationHistory in @/lib/twilio) — no separate database table,
 * so this works across stateless serverless invocations with zero new infra.
 */

const SYSTEM_PROMPT = `You are 247ROI's SMS assistant, texting back someone who just called and got missed.
Your only two jobs, in order:
1. Find out their name and what they need help with (one short question at a time — never ask two things in one text).
2. Once you have a name and a real sense of what they need, tell them Brendan will personally follow up shortly, and stop asking further questions.

Rules:
- This is a text message conversation. Keep every reply under 300 characters. No markdown, no bullet points, no emojis unless the person used one first.
- Sound like a helpful, sharp human assistant — not a chatbot, not salesy, not corporate.
- Ask ONE question per message. Never interrogate.
- If they describe anything urgent (emergency, actively losing money right now, needs someone today), say Brendan will call them directly and prioritize it.
- If they ask something you can't answer (pricing specifics, technical detail), say Brendan will cover that when he follows up — don't invent numbers or promises.
- Once you have their name and what they need, do not keep fishing for more detail. Wrap up warmly and let the human take over.
- If the conversation continues after wrap-up, stay warm and brief, but don't reopen discovery questions.

Respond ONLY with a JSON object: { "reply": string, "leadReady": boolean, "summary": string|null, "urgent": boolean }
- "reply": the exact text to send back.
- "leadReady": true the FIRST turn you have both a name and a real sense of their need (stays true on later turns too).
- "summary": a single compact line like "Mike — needs a water heater replaced, wants a callback today" once leadReady is true, else null.
- "urgent": true if this sounds time-sensitive/emergency.`;

export type SmsTurnResult = {
  reply: string;
  leadReady: boolean;
  summary: string | null;
  urgent: boolean;
};

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("No JSON in model response");
  }
}

export async function runSmsTurn(
  history: { role: "user" | "assistant"; content: string }[]
): Promise<SmsTurnResult> {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  const fallback: SmsTurnResult = {
    reply: "Thanks for the reply! Brendan will follow up with you shortly. You can also call (610) 300-3001 anytime.",
    leadReady: true,
    summary: "Reply received (AI reply failed — needs manual follow-up)",
    urgent: false,
  };

  if (!key) {
    console.error("sms-lead: no OpenAI API key configured");
    return fallback;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_HIRE_MODEL || process.env.OPENAI_MODEL || "gpt-4o",
        temperature: 0.6,
        max_tokens: 300,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
      }),
    });

    if (!res.ok) {
      console.error("sms-lead: OpenAI error", res.status, await res.text().catch(() => ""));
      return fallback;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return fallback;

    const parsed = extractJson(content) as Partial<SmsTurnResult>;
    if (!parsed || typeof parsed.reply !== "string" || !parsed.reply.trim()) return fallback;

    return {
      reply: parsed.reply.slice(0, 480),
      leadReady: Boolean(parsed.leadReady),
      summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 200) : null,
      urgent: Boolean(parsed.urgent),
    };
  } catch (err) {
    console.error("sms-lead: turn failed", err);
    return fallback;
  }
}
