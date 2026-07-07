import { businessNameMentioned, inferServiceFromName } from "./infer-service";
import { runAuditPipeline } from "./audit-engine";
import { enrichReportWithLlm } from "./llm-enrich";
import { updateSession, getSession } from "./sessions";
import type { AuditReport, GoogleLocalResult } from "./types";

export type LiveEvent =
  | { type: "init"; businessName: string; zipCode: string; tradeLabel: string }
  | { type: "google_typing"; query: string }
  | { type: "google_searching" }
  | { type: "google_result"; result: GoogleLocalResult; index: number }
  | { type: "google_done"; clientFound: boolean; position: number | null; query: string }
  | { type: "ai_start"; provider: "chatgpt" | "claude" | "gemini"; query: string }
  | { type: "ai_token"; provider: "chatgpt" | "claude" | "gemini"; token: string }
  | { type: "ai_done"; provider: "chatgpt" | "claude" | "gemini"; query: string; mentionedClient: boolean }
  | { type: "ai_unavailable"; provider: "chatgpt" | "claude" | "gemini"; reason: string }
  | { type: "site_scanning"; message: string }
  | { type: "complete"; report: AuditReport };

export type EmitFn = (event: LiveEvent) => void;

function buildQueries(zipCode: string, servicePhrase: string): string[] {
  return [
    `best ${servicePhrase} in ${zipCode}`,
    `who should I hire for ${servicePhrase} near ${zipCode}`,
  ];
}

async function fetchGoogleResults(
  query: string,
  businessName: string
): Promise<GoogleLocalResult[]> {
  const serpKey = process.env.SERPAPI_KEY;
  if (serpKey) {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_local");
    url.searchParams.set("q", query);
    url.searchParams.set("api_key", serpKey);
    const res = await fetch(url.toString());
    if (res.ok) {
      const data = await res.json();
      const local = (data.local_results as Record<string, unknown>[]) ?? [];
      return local.slice(0, 8).map((item, i) => {
        const name = String(item.title ?? "Unknown");
        return {
          position: (item.position as number) ?? i + 1,
          name,
          rating: item.rating as number | undefined,
          reviewCount: item.reviews as number | undefined,
          address: item.address as string | undefined,
          isClient: businessNameMentioned(name, businessName),
        };
      });
    }
  }

  const placesKey = process.env.GOOGLE_PLACES_API_KEY;
  if (placesKey) {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": placesKey,
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.rating,places.userRatingCount",
        },
        body: JSON.stringify({ textQuery: query, maxResultCount: 8 }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const places = (data.places as Record<string, unknown>[]) ?? [];
      return places.map((p, i) => {
        const name = String(
          (p.displayName as { text?: string })?.text ?? "Unknown"
        );
        return {
          position: i + 1,
          name,
          rating: p.rating as number | undefined,
          reviewCount: p.userRatingCount as number | undefined,
          address: p.formattedAddress as string | undefined,
          isClient: businessNameMentioned(name, businessName),
        };
      });
    }
  }

  return [];
}

async function streamOpenAI(
  query: string,
  onToken: (t: string) => void
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      stream: true,
      max_tokens: 600,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You help consumers find local service businesses. Be specific with business names.",
        },
        { role: "user", content: query },
      ],
    }),
  });

  if (!res.ok || !res.body) return null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
      try {
        const json = JSON.parse(line.slice(6));
        const token = json.choices?.[0]?.delta?.content as string | undefined;
        if (token) {
          full += token;
          onToken(token);
        }
      } catch {
        /* skip malformed chunks */
      }
    }
  }
  return full;
}

async function streamAnthropic(
  query: string,
  onToken: (t: string) => void
): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 600,
      stream: true,
      messages: [{ role: "user", content: query }],
    }),
  });

  if (!res.ok || !res.body) return null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.type === "content_block_delta") {
          const token = json.delta?.text as string | undefined;
          if (token) {
            full += token;
            onToken(token);
          }
        }
      } catch {
        /* skip */
      }
    }
  }
  return full;
}

async function streamGemini(
  query: string,
  onToken: (t: string) => void
): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: query }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.3 },
    }),
  });

  if (!res.ok || !res.body) return null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6));
        const token = json.candidates?.[0]?.content?.parts?.[0]?.text as
          | string
          | undefined;
        if (token) {
          const newPart = token.slice(full.length);
          if (newPart) {
            full = token;
            onToken(newPart);
          }
        }
      } catch {
        /* skip */
      }
    }
  }
  return full;
}

const AI_PROMPT = (service: string, zip: string) =>
  `Who are the best ${service} options in zip code ${zip}? List specific local business names and why you'd recommend them.`;

export async function runLiveAuditStream(
  sessionId: string,
  emit: EmitFn
): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");

  const { businessName, website_url: websiteUrl, zip_code: zipCode } = session;
  const { tradeLabel, servicePhrase } = inferServiceFromName(businessName);
  const queries = buildQueries(zipCode, servicePhrase);

  emit({ type: "init", businessName, zipCode, tradeLabel });

  const sitePromise = (async () => {
    emit({ type: "site_scanning", message: "Scanning website infrastructure..." });
    return runAuditPipeline({ businessName, websiteUrl, zipCode });
  })();

  // —— Google live search ——
  const googleQuery = queries[0];
  emit({ type: "google_typing", query: googleQuery });
  await delay(1200);
  emit({ type: "google_searching" });

  const googleResults = await fetchGoogleResults(googleQuery, businessName);
  const collectedGoogle = [...googleResults];

  if (googleResults.length === 0) {
    emit({
      type: "google_result",
      index: 0,
      result: {
        position: 0,
        name: "No results — add SERPAPI_KEY or GOOGLE_PLACES_API_KEY to Vercel",
        isClient: false,
      },
    });
  } else {
    for (let i = 0; i < googleResults.length; i++) {
      await delay(400);
      emit({ type: "google_result", result: googleResults[i], index: i });
    }
  }

  const clientHit = googleResults.find((r) => r.isClient);
  emit({
    type: "google_done",
    clientFound: Boolean(clientHit),
    position: clientHit?.position ?? null,
    query: googleQuery,
  });

  await delay(800);

  const aiQueries: Array<{
    provider: "openai" | "anthropic" | "gemini";
    providerLabel: string;
    query: string;
    response?: string;
    mentionedClient: boolean;
    status: "ok" | "not_configured" | "error";
    latencyMs: number;
  }> = [];

  // —— ChatGPT live stream ——
  const chatQuery = AI_PROMPT(servicePhrase, zipCode);
  const chatStart = Date.now();
  emit({ type: "ai_start", provider: "chatgpt", query: chatQuery });
  const chatFull = await streamOpenAI(chatQuery, (token) =>
    emit({ type: "ai_token", provider: "chatgpt", token })
  );
  if (chatFull) {
    aiQueries.push({
      provider: "openai",
      providerLabel: "ChatGPT",
      query: chatQuery,
      response: chatFull,
      mentionedClient: businessNameMentioned(chatFull, businessName),
      status: "ok",
      latencyMs: Date.now() - chatStart,
    });
    emit({
      type: "ai_done",
      provider: "chatgpt",
      query: chatQuery,
      mentionedClient: businessNameMentioned(chatFull, businessName),
    });
  } else {
    emit({ type: "ai_unavailable", provider: "chatgpt", reason: "OPENAI_API_KEY not set" });
  }

  await delay(600);

  // —— Gemini live stream ——
  const geminiQuery = `I need a reliable ${servicePhrase} in ${zipCode}. Who do you recommend?`;
  const gemStart = Date.now();
  emit({ type: "ai_start", provider: "gemini", query: geminiQuery });
  const geminiFull = await streamGemini(geminiQuery, (token) =>
    emit({ type: "ai_token", provider: "gemini", token })
  );
  if (geminiFull) {
    aiQueries.push({
      provider: "gemini",
      providerLabel: "Gemini",
      query: geminiQuery,
      response: geminiFull,
      mentionedClient: businessNameMentioned(geminiFull, businessName),
      status: "ok",
      latencyMs: Date.now() - gemStart,
    });
    emit({
      type: "ai_done",
      provider: "gemini",
      query: geminiQuery,
      mentionedClient: businessNameMentioned(geminiFull, businessName),
    });
  } else {
    emit({ type: "ai_unavailable", provider: "gemini", reason: "GEMINI_API_KEY not set" });
  }

  await delay(600);

  // —— Claude live stream ——
  const claudeQuery = queries[1];
  const claudeStart = Date.now();
  const claudePrompt = `Top rated ${servicePhrase} near ${zipCode} — who should I hire? Be specific.`;
  emit({ type: "ai_start", provider: "claude", query: claudeQuery });
  const claudeFull = await streamAnthropic(claudePrompt, (token) =>
    emit({ type: "ai_token", provider: "claude", token })
  );
  if (claudeFull) {
    aiQueries.push({
      provider: "anthropic",
      providerLabel: "Claude",
      query: claudeQuery,
      response: claudeFull,
      mentionedClient: businessNameMentioned(claudeFull, businessName),
      status: "ok",
      latencyMs: Date.now() - claudeStart,
    });
    emit({
      type: "ai_done",
      provider: "claude",
      query: claudeQuery,
      mentionedClient: businessNameMentioned(claudeFull, businessName),
    });
  } else {
    emit({ type: "ai_unavailable", provider: "claude", reason: "ANTHROPIC_API_KEY not set" });
  }

  const mentionCount = aiQueries.filter((q) => q.mentionedClient).length;
  const baseReport = await sitePromise;
  const googleClientHit = collectedGoogle.find((r) => r.isClient);

  const withProbes = {
    ...baseReport,
    aiMirror: {
      tradeLabel,
      servicePhrase,
      queries: aiQueries,
      summary: {
        totalQueries: aiQueries.length,
        mentionCount,
        mentionRate:
          aiQueries.length > 0
            ? Math.round((mentionCount / aiQueries.length) * 100)
            : 0,
        configuredProviders: [
          ...new Set(aiQueries.map((q) => q.providerLabel)),
        ],
        verdict:
          mentionCount === 0
            ? `${businessName} was not recommended in live AI queries.`
            : `AI mentioned ${businessName} in ${mentionCount} live queries.`,
      },
    },
    googleLocal: {
      searchQueries: queries,
      blocks: [{ query: googleQuery, results: collectedGoogle }],
      primaryResults: collectedGoogle,
      primaryQuery: googleQuery,
      clientPosition: googleClientHit?.position ?? null,
      inMapPack: Boolean(googleClientHit && googleClientHit.position <= 3),
      configured: collectedGoogle.length > 0,
      summary: googleClientHit
        ? `Found at position #${googleClientHit.position} in live Google search.`
        : `${businessName} not in top live Google results.`,
    },
  };

  const report = await enrichReportWithLlm({
    businessName,
    websiteUrl,
    zipCode,
    baseReport: withProbes,
  });

  await updateSession(sessionId, {
    status: "complete",
    report,
    progress_events: report.progressEvents,
    warm_tier: "warm_a",
  });

  emit({ type: "complete", report });
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
