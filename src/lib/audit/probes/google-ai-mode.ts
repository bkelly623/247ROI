import { getSerpApiKey } from "../env";

export interface GoogleAIModeEvidence {
  state: "observed" | "unavailable" | "not_configured";
  query: string;
  observedAt: string;
  location: string;
  source: "serpapi";
  answer?: string;
  citations: { title: string; url: string }[];
  mentioned: boolean | null;
  cited: boolean | null;
  error?: string;
  providerSearchId?: string;
}

export interface GoogleAIModeInput {
  businessName: string;
  zipCode: string;
  servicePhrase: string;
  query?: string;
  websiteUrl: string;
  /** Stage-3 provider location; national uses United States without ZIP. */
  providerLocation?: string;
  geographyMode?: "local" | "regional" | "national" | "mixed";
}

const DEADLINE_MS = 50_000;
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function brandPattern(name: string, flags = "iu"): RegExp | null {
  const words = name.trim().split(/\s+/).map(escapeRegex).join("\\s+");
  return words ? new RegExp(`(?<![\\p{L}\\p{N}_])${words}(?![\\p{L}\\p{N}_])`, flags) : null;
}
function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : undefined;
}
function host(value: string): string | null {
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    // Only the conventional www alias is equivalent; arbitrary subdomains are not.
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch { return null; }
}
function answerText(data: Record<string, unknown>): string {
  if (typeof data.reconstructed_markdown === "string" && data.reconstructed_markdown.trim()) {
    return data.reconstructed_markdown.trim();
  }
  const parts: string[] = [];
  function walk(value: unknown): void {
    if (Array.isArray(value)) { value.forEach(walk); return; }
    const node = record(value);
    if (!node) return;
    if (typeof node.snippet === "string" && node.snippet.trim()) parts.push(node.snippet.trim());
    for (const key of ["text_blocks", "list", "items", "table", "rows", "cells"]) walk(node[key]);
  }
  walk(data.text_blocks);
  return parts.join("\n").trim();
}

/** Actual Google AI Mode product capture, not a model-generated proxy.
 * Schema: https://serpapi.com/google-ai-mode-api
 * One synchronous normal request; no continuation, async polling or retry.
 */
export async function probeGoogleAIMode(input: GoogleAIModeInput): Promise<GoogleAIModeEvidence> {
  const brand = brandPattern(input.businessName, "giu");
  const service = (brand ? input.servicePhrase.replace(brand, "") : input.servicePhrase).trim();
  const national = input.geographyMode === "national";
  const location = input.providerLocation?.trim() || (national ? "United States" : `${input.zipCode.trim()}, United States`);
  const query = input.query ?? (national
    ? `I'm looking for ${service || "business services"} in the United States. Which providers should I consider, and why?`
    : `I'm looking for ${service || "business services"} serving ZIP code ${input.zipCode.trim()}. Which providers should I consider, and why?`);
  const base: GoogleAIModeEvidence = {
    state: "unavailable", query, location, observedAt: new Date().toISOString(),
    source: "serpapi", citations: [], mentioned: null, cited: null,
  };
  const key = getSerpApiKey();
  if (!key) return { ...base, state: "not_configured", error: "Google AI Mode collection is not configured" };
  const zipOk = national || /^\d{5}(?:-\d{4})?$/.test(input.zipCode.trim());
  if (!service || !zipOk) {
    return { ...base, error: "An unbranded service phrase and valid US ZIP are required" };
  }
  const url = new URL("https://serpapi.com/search.json");
  url.search = new URLSearchParams({
    engine: "google_ai_mode", q: query, location, hl: "en", gl: "us", api_key: key,
  }).toString();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Race also bounds body consumption if a transport fails to honor abort.
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new Error("deadline")); }, DEADLINE_MS);
  });
  try {
    const capture = async (): Promise<GoogleAIModeEvidence> => {
      const response = await fetch(url.toString(), { signal: controller.signal, cache: "no-store", redirect: "error" });
      if (!response.ok) return { ...base, error: `Google AI Mode provider HTTP ${response.status}` };
      const data = record(await response.json());
      if (!data) return { ...base, error: "Google AI Mode provider returned an invalid response" };
      const metadata = record(data.search_metadata);
      const providerSearchId = typeof metadata?.id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(metadata.id)
        ? metadata.id : undefined;
      const evidence = { ...base, observedAt: new Date().toISOString(), ...(providerSearchId ? { providerSearchId } : {}) };
      if (data.error || (metadata?.status && metadata.status !== "Success")) {
        return { ...evidence, error: "Google AI Mode provider did not return a successful sample" };
      }
      const citations: GoogleAIModeEvidence["citations"] = [];
      const seen = new Set<string>();
      for (const item of Array.isArray(data.references) ? data.references : []) {
        const ref = record(item);
        if (typeof ref?.link !== "string" || !/^https?:\/\//i.test(ref.link) || !host(ref.link) || seen.has(ref.link)) continue;
        seen.add(ref.link);
        citations.push({ title: typeof ref.title === "string" ? ref.title : ref.link, url: ref.link });
      }
      const answer = answerText(data);
      // References or an unloaded placeholder alone never establish brand absence.
      if (!answer) return { ...evidence, citations, error: "Google AI Mode returned no usable answer" };
      const targetHost = host(input.websiteUrl);
      const name = brandPattern(input.businessName);
      const visibleAnswer = answer.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/https?:\/\/\S+/gi, "");
      return {
        ...evidence, state: "observed", answer, citations,
        mentioned: name ? name.test(visibleAnswer) : null,
        cited: targetHost ? citations.some(citation => host(citation.url) === targetHost) : null,
      };
    };
    return await Promise.race([capture(), deadline]);
  } catch {
    // Never return provider bodies, exception messages, request URLs or keys.
    return { ...base, error: controller.signal.aborted ? "Google AI Mode collection timed out" : "Google AI Mode collection failed" };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
