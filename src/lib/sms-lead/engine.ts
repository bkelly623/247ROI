/**
 * Conversational SMS assistant for the missed-call text-back flow on
 * (610) 300-3001. Intent-based: every turn answers or helps, and moves suitable
 * inquiries toward the one supported action — a recorded callback request.
 *
 * Conversation state lives entirely in Twilio's own Messages log (see
 * getConversationHistory in @/lib/twilio) — no separate database table,
 * so this works across stateless serverless invocations with zero new infra.
 *
 * The prompt lives in ./prompt so the exact text sent here is what tests check.
 */

import { buildSmsMessages, SMS_INTENTS, SMS_REPLY_MAX_CHARS, type SmsHistoryMessage, type SmsIntent } from "./prompt";

export type SmsTurnResult = {
  reply: string;
  leadReady: boolean;
  summary: string | null;
  urgent: boolean;
  intent?: SmsIntent;
};

const MODEL_TIMEOUT_MS = 9000;
const SUMMARY_MAX_CHARS = 200;

const KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "HELP", "INFO"]);
const WITHDRAWAL = [
  /^(?:please\s+)?(?:stop|quit|don['’]?t|do not|no more)\s+(?:texting|messaging|contacting|calling|text|message|contact)\s+me(?:\s+(?:again|anymore))?[.!\s]*$/i,
  /^(?:please\s+)?leave me alone[.!\s]*$/i,
  /^(?:please\s+)?(?:remove (?:me|my number)|take me off)(?:\s+(?:from\s+)?(?:your|the)\s+(?:list|texts|messages))?[.!\s]*$/i,
  /^unsubscribe[.!\s]*$/i,
];
const WRONG_NUMBER = [/^(?:(?:sorry|you have the|this is the)[,\s]+)?wrong (?:number|person)[.!\s]*$/i, /^(?:I\s+)?never called (?:you|this number)[.!\s]*$/i];

/** Deterministic pre-model guard for messages that must never get a sales reply. */
export function guardInbound(text: string): { kind: "keyword" | "withdrawal" | "wrong_number"; result: SmsTurnResult } | null {
  const trimmed = text.trim();
  if (KEYWORDS.has(trimmed.toUpperCase())) {
    return { kind: "keyword", result: { reply: "", leadReady: false, summary: null, urgent: false } };
  }
  if (WRONG_NUMBER.some((re) => re.test(trimmed))) {
    return {
      kind: "wrong_number",
      result: { reply: "Thanks for letting us know, and sorry for the mix-up.", leadReady: false, summary: null, urgent: false, intent: "wrong_number" },
    };
  }
  if (WITHDRAWAL.some((re) => re.test(trimmed))) {
    return {
      kind: "withdrawal",
      result: { reply: "Understood, sorry for the bother.", leadReady: false, summary: null, urgent: false, intent: "withdrawal" },
    };
  }
  return null;
}

export const SMS_FALLBACK: SmsTurnResult = {
  reply:
    "Thanks for texting 247ROI. This is the automated assistant, and I couldn't put a full answer together just now. Your message is saved in this thread for the team to review.",
  leadReady: true,
  summary: "AI reply unavailable — message needs manual review",
  urgent: false,
};

function fallback(): SmsTurnResult {
  return { ...SMS_FALLBACK };
}

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

function strictBool(v: unknown): boolean {
  if (v === true) return true;
  if (typeof v === "string") return v.trim().toLowerCase() === "true";
  return false;
}

/** Shortens at a sentence end, else a word boundary; never mid-word. */
export function fitSms(text: string, max = SMS_REPLY_MAX_CHARS): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const window = clean.slice(0, max + 1);
  const sentenceEnd = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "), window.lastIndexOf("! "));
  if (sentenceEnd >= max * 0.5) return clean.slice(0, sentenceEnd + 1);
  const space = clean.slice(0, max).lastIndexOf(" ");
  return `${clean.slice(0, space > 0 ? space : max - 1).replace(/[\s,;:-]+$/, "")}…`;
}

const LINK = /(https?:\/\/|www\.)/i;
const FALSE_COMMITMENT = [
  /\b(you'?re|you are|is|been|i'?ve|we'?ve)\s+(all\s+)?(booked|scheduled|confirmed)\b/i,
  /\bwill (call|text|reach out to|contact) you (shortly|soon|today|tomorrow|within|in \d|at \d|right away)/i,
  /\b(has|have) been notified\b/i,
];

/** Replies that violate hard policy are replaced with the truthful fallback. */
export function violatesReplyPolicy(reply: string): boolean {
  return LINK.test(reply) || FALSE_COMMITMENT.some((re) => re.test(reply));
}

export function parseModelContent(content: unknown): SmsTurnResult | null {
  if (typeof content !== "string" || !content.trim()) return null;
  let parsed: unknown;
  try {
    parsed = extractJson(content);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const p = parsed as Record<string, unknown>;
  if (typeof p.reply !== "string" || !p.reply.trim()) return null;
  const reply = fitSms(p.reply);
  if (violatesReplyPolicy(reply)) return null;

  const intent = SMS_INTENTS.includes(p.intent as SmsIntent) ? (p.intent as SmsIntent) : undefined;
  const stopped = intent === "wrong_number" || intent === "withdrawal";
  const leadReady = !stopped && strictBool(p.leadReady);
  const summary = typeof p.summary === "string" && p.summary.trim() ? p.summary.replace(/\s+/g, " ").trim().slice(0, SUMMARY_MAX_CHARS) : null;

  return {
    reply,
    leadReady,
    summary: leadReady ? summary : null,
    urgent: !stopped && strictBool(p.urgent),
    ...(intent ? { intent } : {}),
  };
}

export async function runSmsTurn(history: SmsHistoryMessage[]): Promise<SmsTurnResult> {
  const latest = [...history].reverse().find((m) => m.role === "user");
  const guarded = latest ? guardInbound(latest.content) : null;
  if (guarded) return guarded.result;

  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!key) {
    console.error("sms-lead: no OpenAI API key configured");
    return fallback();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_HIRE_MODEL || process.env.OPENAI_MODEL || "gpt-4o",
        temperature: 0.5,
        max_tokens: 350,
        response_format: { type: "json_object" },
        messages: buildSmsMessages(history),
      }),
    });

    if (!res.ok) {
      console.error("sms-lead: OpenAI error", res.status);
      return fallback();
    }

    const data = (await res.json()) as { choices?: { message?: { content?: unknown } }[] } | null;
    const result = parseModelContent(data?.choices?.[0]?.message?.content);
    if (!result) {
      console.error("sms-lead: model response rejected");
      return fallback();
    }
    return result;
  } catch (err) {
    console.error("sms-lead: turn failed", err instanceof Error ? err.name : "unknown");
    return fallback();
  } finally {
    clearTimeout(timer);
  }
}
