import {
  businessNameMentioned,
  inferServiceFromName,
} from "./infer-service";
import type { AIProbeQuery, AIProbeResult } from "./types";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function buildQueries(zipCode: string, servicePhrase: string): string[] {
  return [
    `Who are the best ${servicePhrase} options in zip code ${zipCode}? List specific business names.`,
    `I need a reliable ${servicePhrase} in ${zipCode}. Who do you recommend and why?`,
    `Top rated ${servicePhrase} near ${zipCode} — who should I hire?`,
  ];
}

async function queryOpenAI(prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      max_tokens: 500,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You help consumers find local service businesses. Be specific with business names when possible. Keep answers concise.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? null;
}

async function queryAnthropic(prompt: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.content?.[0]?.text ?? null;
}

async function queryGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!key) return null;
  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 500, temperature: 0.3 },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

type Provider = "openai" | "anthropic" | "gemini";

const PROVIDERS: {
  id: Provider;
  label: string;
  query: (p: string) => Promise<string | null>;
}[] = [
  { id: "openai", label: "ChatGPT", query: queryOpenAI },
  { id: "anthropic", label: "Claude", query: queryAnthropic },
  { id: "gemini", label: "Gemini", query: queryGemini },
];

export async function runAIMirrorProbe(input: {
  businessName: string;
  zipCode: string;
}): Promise<AIProbeResult> {
  const { tradeLabel, servicePhrase } = inferServiceFromName(input.businessName);
  const queries = buildQueries(input.zipCode, servicePhrase);
  const probeQueries: AIProbeQuery[] = [];

  for (const provider of PROVIDERS) {
    for (const queryText of queries) {
      const start = Date.now();
      let response: string | null = null;
      let status: AIProbeQuery["status"] = "error";

      try {
        response = await provider.query(queryText);
        status = response ? "ok" : "not_configured";
      } catch {
        status = "error";
      }

      probeQueries.push({
        provider: provider.id,
        providerLabel: provider.label,
        query: queryText,
        response: response ?? undefined,
        mentionedClient: response
          ? businessNameMentioned(response, input.businessName)
          : false,
        status,
        latencyMs: Date.now() - start,
      });
    }
  }

  const successful = probeQueries.filter((q) => q.status === "ok");
  const mentionCount = successful.filter((q) => q.mentionedClient).length;
  const mentionRate =
    successful.length > 0
      ? Math.round((mentionCount / successful.length) * 100)
      : 0;

  const configuredProviders = [
    ...new Set(
      probeQueries
        .filter((q) => q.status !== "not_configured")
        .map((q) => q.providerLabel)
    ),
  ];

  return {
    tradeLabel,
    servicePhrase,
    queries: probeQueries,
    summary: {
      totalQueries: successful.length,
      mentionCount,
      mentionRate,
      configuredProviders,
      verdict:
        successful.length === 0
          ? "AI probes not configured — add OPENAI_API_KEY, ANTHROPIC_API_KEY, and/or GEMINI_API_KEY"
          : mentionCount === 0
            ? `${input.businessName} was not recommended in any AI response we tested.`
            : `AI mentioned ${input.businessName} in ${mentionCount} of ${successful.length} live queries.`,
    },
  };
}
