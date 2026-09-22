import { createHash } from "node:crypto";
import type { AuditContext } from "../audit-context";
import { resolveGeography } from "../geography";
import type { ChatGPTInput, ChatGPTOptions, ChatGPTEvidence } from "./chatgpt-search";
import type { GoogleAIModeInput, GoogleAIModeEvidence } from "./google-ai-mode";

export type AIEngine = "chatgpt" | "google_ai_mode";
export type AIIntent = "provider_shortlist" | "specific_service" | "comparison_selection";
export interface AISamplingInput extends ChatGPTInput {
  /** Optional narrower service/problem, never a brand or a made-up inferred need. */
  specificServicePhrase?: string;
  /** Validated Stage-3 context; absent = legacy local ZIP questions. */
  auditContext?: AuditContext | null;
}
export interface AIQuestion { intent: AIIntent; query: string }
export type AIEvidence = ChatGPTEvidence | GoogleAIModeEvidence;
export interface AISample {
  key: string;
  engine: AIEngine;
  intent: AIIntent;
  /** Original planned question, not a paraphrase of a returned answer. */
  query: string;
  /** Null if no provider evidence confirms submission; errors are not proof of submission. */
  submittedQuery: string | null;
  evidence: AIEvidence;
  reused: boolean;
  competitorNames: string[];
  /** Geographic mismatch warning (e.g. LA cluster on a US-wide request). */
  scopeWarning?: string | null;
}
export interface AISampleSummary {
  total: number;
  available: number;
  unavailable: number;
  mentions: { count: number; denominator: number; rate: number | null };
  citations: { count: number; denominator: number; rate: number | null };
}
export interface AISamplingReport {
  version: 1;
  questions: AIQuestion[];
  samples: AISample[];
  summary: AISampleSummary;
  byEngine: Record<AIEngine, AISampleSummary>;
  methodology: string;
  /** Distinct geographic/scope warnings that suppress misleading national AI scores. */
  scopeWarnings?: string[];
}
export interface AISamplingOptions {
  /** Adapters MUST pass query through to the actual existing product probes.
   * The orchestrator rejects evidence for a different question, never relabels it. */
  collectors: {
    chatgpt: (input: ChatGPTInput & { query: string }, options: ChatGPTOptions) => Promise<ChatGPTEvidence>;
    googleAIMode: (input: GoogleAIModeInput & { query: string }) => Promise<GoogleAIModeEvidence>;
  };
  /** Called once per fresh ChatGPT question. Return fresh quote AND a durable
   * exact-request authorize callback. Denial/failure must never become absence. */
  budgetChatGPTQuote: (sample: Readonly<{ key: string; query: string; intent: AIIntent }>) => Promise<Pick<ChatGPTOptions, "quote" | "authorize"> | null>;
  /** Reopen/reuse all saved outcomes, including failures: no implicit paid retry. */
  existingReport?: Pick<AISamplingReport, "samples">;
  /** Only literal names already identified by an evidence source are candidates.
   * Names are retained only when present in the answer; no entity-generation API. */
  competitorCandidates?: readonly string[];
  perSampleTimeoutMs?: number;
  totalTimeoutMs?: number;
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function namePattern(value: string, flags = "iu"): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}_])${value.trim().split(/\s+/).map(escape).join("\\s+")}(?![\\p{L}\\p{N}_])`, flags);
}
function unbranded(value: string, input: AISamplingInput): string {
  let result = value;
  if (input.businessName.trim()) result = result.replace(namePattern(input.businessName, "giu"), "");
  try {
    const host = new URL(input.websiteUrl.includes("://") ? input.websiteUrl : `https://${input.websiteUrl}`).hostname.replace(/^www\./, "");
    result = result.replace(new RegExp(`(?:https?:\\/\\/)?(?:www\\.)?${escape(host)}[^\\s]*`, "giu"), "");
  } catch { throw new Error("A valid business website is required"); }
  result = result.replace(/\s+/g, " ").trim();
  if (!result || result.length > 200 || /https?:\/\//i.test(result)) throw new Error("A specific unbranded service phrase is required");
  return result;
}

function geographyForInput(input: AISamplingInput) {
  const resolved = resolveGeography({ context: input.auditContext, zipCode: input.zipCode });
  if (!resolved.ok) throw new Error(resolved.error);
  return resolved;
}

/** Exactly three comparable, unbranded buyer intents, shared across both engines. */
export function planAIQuestions(input: AISamplingInput): AIQuestion[] {
  const geo = geographyForInput(input);
  const service = unbranded(input.servicePhrase, input);
  const specific = input.specificServicePhrase ? unbranded(input.specificServicePhrase, input) : service;
  const area = geo.queryAreaPhrase;
  const questions: AIQuestion[] = [
    { intent: "provider_shortlist", query: `Which providers offer ${service} ${area}? Give a shortlist with sources.` },
    { intent: "specific_service", query: `I need help with ${specific}. Which providers ${area} handle this service, and what should I ask before hiring one?` },
    { intent: "comparison_selection", query: `Compare providers of ${service} ${area}. What differences in capabilities, suitability, and published evidence should guide my choice?` },
  ];
  if (input.businessName.trim() && questions.some(q => namePattern(input.businessName).test(q.query))) throw new Error("Buyer questions must not contain the audited brand");
  // National must never force ZIP wording into buyer questions.
  if (geo.geography === "national" && questions.some(q => /\bZIP\b/i.test(q.query) || /\b\d{5}(?:-\d{4})?\b/.test(q.query))) {
    throw new Error("National buyer questions must not force ZIP wording");
  }
  return questions;
}

/** Exact question plus audited entity and collection dimensions, never fuzzy reuse. */
export function aiSampleKey(input: AISamplingInput, engine: AIEngine, query: string): string {
  const geo = geographyForInput(input);
  return createHash("sha256").update(JSON.stringify([
    "ai-sampling-v1", engine, query, input.businessName, input.websiteUrl,
    geo.cacheDims.geography, geo.cacheDims.providerLocation, geo.cacheDims.zipForLocal, geo.cacheDims.serviceArea,
    geo.queryAreaPhrase,
    engine === "chatgpt" ? (input.locationName?.trim() || geo.providerLocation) : geo.providerLocation,
  ])).digest("hex");
}

export function summarizeAISamples(samples: readonly AISample[]): AISampleSummary {
  const observed = samples.filter(s => s.evidence.state === "observed" && !s.evidence.error && s.evidence.answer?.trim() && s.evidence.query === s.query);
  function metric(field: "mentioned" | "cited") {
    const known = observed.filter(s => typeof s.evidence[field] === "boolean");
    const count = known.filter(s => s.evidence[field] === true).length;
    return { count, denominator: known.length, rate: known.length ? count / known.length : null };
  }
  return { total: samples.length, available: observed.length, unavailable: samples.length - observed.length, mentions: metric("mentioned"), citations: metric("cited") };
}

function failure(input: AISamplingInput, engine: AIEngine, query: string, error: string, denied = false): AIEvidence {
  const geo = geographyForInput(input);
  const common = { query, observedAt: new Date().toISOString(), citations: [], mentioned: null, cited: null, error };
  return engine === "chatgpt"
    ? { ...common, state: denied ? "not_authorized" : "unavailable", source: "dataforseo", product: "consumer_chatgpt_scraper", mode: "search", location: input.locationName?.trim() || geo.providerLocation }
    : { ...common, state: "unavailable", source: "serpapi", location: geo.providerLocation };
}
function timeout(value: number | undefined, fallback: number, cap: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) throw new Error("Invalid AI sampling deadline");
  return Math.min(value, cap);
}

/** Provider-facing sample input with geography-aligned location fields. */
export function sampleProviderInput(input: AISamplingInput, query: string): ChatGPTInput & GoogleAIModeInput & { query: string } {
  const geo = geographyForInput(input);
  return {
    businessName: input.businessName,
    websiteUrl: input.websiteUrl,
    servicePhrase: input.servicePhrase,
    zipCode: geo.zipCode ?? input.zipCode,
    locationName: input.locationName?.trim() || geo.providerLocation,
    providerLocation: geo.providerLocation,
    geographyMode: geo.geography === "legacy_local" ? "local" : geo.geography,
    query,
  };
}

/** Six maximum product captures, two concurrent per engine, zero retries.
 * Default collection window is 115s (hard cap 150s); probe-level timeouts bound
 * transport. A timed-out reservation is uncertain and MUST NOT be released.
 * No background follow-up or paid fallback is scheduled here. */
export async function collectAISamples(input: AISamplingInput, options: AISamplingOptions): Promise<AISamplingReport> {
  const questions = planAIQuestions(input);
  const perSampleMs = timeout(options.perSampleTimeoutMs, 55_000, 95_000);
  const totalMs = timeout(options.totalTimeoutMs, 115_000, 150_000);
  const deadline = Date.now() + totalMs;
  const samples: AISample[] = [];
  const saved = new Map((options.existingReport?.samples ?? []).map(s => [s.key, s]));
  // Do not replace a timed-out in-flight request with another send: adapters
  // may still be finishing their independently bounded transport cleanup.
  const halted = new Set<AIEngine>();
  const engines: AIEngine[] = ["chatgpt", "google_ai_mode"];
  const jobs = engines.flatMap(engine => questions.map(question => ({ engine, ...question, key: aiSampleKey(input, engine, question.query) })));

  async function run(job: typeof jobs[number]): Promise<void> {
    const existing = saved.get(job.key);
    if (existing && existing.engine === job.engine && existing.query === job.query) {
      samples.push({ ...existing, reused: true });
      return;
    }
    const duration = halted.has(job.engine) ? 0 : Math.min(perSampleMs, deadline - Date.now());
    let expired = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let evidence: AIEvidence;
    if (duration <= 0) evidence = failure(input, job.engine, job.query, "AI sampling deadline reached; request not started");
    else {
      const collect = async (): Promise<AIEvidence> => {
        const providerInput = sampleProviderInput(input, job.query);
        if (job.engine === "google_ai_mode") return options.collectors.googleAIMode(providerInput);
        const budget = await options.budgetChatGPTQuote(Object.freeze({ key: job.key, query: job.query, intent: job.intent }));
        if (expired || Date.now() >= deadline) return failure(input, job.engine, job.query, "AI sampling deadline reached; request not started");
        if (!budget?.quote || !budget.authorize) return failure(input, job.engine, job.query, "ChatGPT sample budget not authorized", true);
        return options.collectors.chatgpt(providerInput, {
          ...budget, timeoutMs: Math.max(1, Math.min(duration, deadline - Date.now())),
          // A slow durable authorization must not authorize a new send after this
          // sampling window. Its reservation is retained, not refunded here.
          authorize: async reservation => {
            if (expired || Date.now() >= deadline) return false;
            const allowed = await budget.authorize!(reservation);
            return allowed === true && !expired && Date.now() < deadline;
          },
        });
      };
      try {
        evidence = await Promise.race([collect(), new Promise<AIEvidence>(resolve => {
          timer = setTimeout(() => { expired = true; halted.add(job.engine); resolve(failure(input, job.engine, job.query, "AI sample timed out; any reservation retained")); }, duration);
        })]);
      } catch { evidence = failure(input, job.engine, job.query, "AI sample collection failed; any reservation retained"); }
      finally { if (timer !== undefined) clearTimeout(timer); }
    }
    // Never pretend a legacy probe's internally generated prompt was our prompt.
    if (evidence.query !== job.query) evidence = { ...evidence, state: "unavailable", mentioned: null, cited: null, error: "Collector returned a different question; sample excluded" };
    if (evidence.state !== "observed" || evidence.error || !evidence.answer?.trim()) {
      if (evidence.state === "observed") evidence = { ...evidence, state: "unavailable", mentioned: null, cited: null };
      else evidence = { ...evidence, mentioned: null, cited: null };
    }
    const observed = evidence.state === "observed";
    const competitorNames = observed ? [...new Set(options.competitorCandidates ?? [])].filter(name => name.trim() && name.toLowerCase() !== input.businessName.trim().toLowerCase() && namePattern(name).test(evidence.answer!)) : [];
    samples.push({ key: job.key, engine: job.engine, intent: job.intent, query: job.query,
      submittedQuery: evidence.state === "observed" || ("receipt" in evidence && evidence.receipt) || ("providerSearchId" in evidence && evidence.providerSearchId) ? evidence.query : null,
      evidence, reused: false, competitorNames });
  }
  await Promise.all(engines.map(async engine => {
    const queue = jobs.filter(job => job.engine === engine);
    await Promise.all([0, 1].map(async () => { for (let job = queue.shift(); job; job = queue.shift()) await run(job); }));
  }));
  samples.sort((a, b) => jobs.findIndex(j => j.key === a.key) - jobs.findIndex(j => j.key === b.key));
  const geo = geographyForInput(input);
  return { version: 1, questions, samples, summary: summarizeAISamples(samples), byEngine: {
    chatgpt: summarizeAISamples(samples.filter(s => s.engine === "chatgpt")),
    google_ai_mode: summarizeAISamples(samples.filter(s => s.engine === "google_ai_mode")),
  }, methodology: `Three unbranded buyer questions sampled identically across consumer ChatGPT search and Google AI Mode (${geo.geography === "national" ? "national/US geography; no forced ZIP in query text" : "local/regional geography with declared area"}). Counts describe only these samples, not market share or guaranteed recommendations. Mention/citation denominators exclude failures and unknown values. ZIP text describes requested service coverage when used; it does not prove the search originated at that ZIP. Provider location, timestamps, raw answer and references remain in each evidence record. No causal explanation for inclusion or absence is inferred.` };
}
