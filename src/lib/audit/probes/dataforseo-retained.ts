/**
 * Pure offline parser: retained DataForSEO capture + receipt + reservation →
 * DirectRankReport / AISamplingReport. Never sends network requests.
 */
import { createHash } from "node:crypto";
import { z } from "zod";
import {
  DIRECT_RANK_DEVICE,
  DIRECT_RANK_TARGET_DEPTH,
  hostsMatch,
  type DirectRankCheck,
  type DirectRankReport,
  type OrganicHit,
} from "./direct-rank";
import type { KeywordOpportunityPlan } from "../keyword-plan";
import type {
  AIEngine,
  AIIntent,
  AIQuestion,
  AISample,
  AISamplingReport,
} from "./ai-sampling";
import { summarizeAISamples } from "./ai-sampling";
import type { ChatGPTEvidence } from "./chatgpt-search";
import type { GoogleAIModeEvidence } from "./google-ai-mode";

const US_LOCATION_CODE = 2840;

const ReceiptSchema = z.object({
  at: z.string().min(1),
  httpStatus: z.number().int(),
  rawSha256: z.string().regex(/^[a-f0-9]{64}$/),
  cost: z.number().finite().optional(),
  statusCode: z.number().int().optional(),
  taskStatus: z
    .array(z.tuple([z.string(), z.number(), z.number()]))
    .min(1)
    .optional(),
});

const ReservationSchema = z.object({
  kind: z.enum(["organic", "ai_mode", "chatgpt"]),
  endpoint: z.string().min(1),
  body: z.array(z.record(z.unknown())).min(1),
  reservedMicros: z.number().int().nonnegative(),
  reservedAt: z.string().min(1),
  requestSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  state: z.string().optional(),
});

export type RetainedReceipt = z.infer<typeof ReceiptSchema>;
export type RetainedReservation = z.infer<typeof ReservationSchema>;

export interface RetainedArtifactFiles {
  rawJson: string;
  receipt: unknown;
  reservation: unknown;
}

export interface RetainedParseContext {
  businessName: string;
  websiteUrl: string;
  /** Expected keyword from the reservation body; mismatch → unknown. */
  expectedQuery?: string;
  /** Expected geographic scope label for providerLocation. */
  expectedLocation?: string;
}

function hostnameOf(url: string): string | null {
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function brandPattern(name: string, flags = "iu"): RegExp | null {
  const escaped = name
    .trim()
    .split(/\s+/)
    .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  return escaped ? new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, flags) : null;
}

function sha256(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function record(v: unknown): Record<string, unknown> | undefined {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;
}

function text(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Verify raw bytes against receipt hash and reservation task/scope. */
export function verifyRetainedArtifact(
  files: RetainedArtifactFiles,
  expected?: { kind?: RetainedReservation["kind"]; query?: string; locationCode?: number }
):
  | {
      ok: true;
      receipt: RetainedReceipt;
      reservation: RetainedReservation;
      rawHash: string;
      taskId: string | null;
      keyword: string;
      locationCode: number | null;
    }
  | { ok: false; error: string } {
  const receiptParsed = ReceiptSchema.safeParse(files.receipt);
  if (!receiptParsed.success) return { ok: false, error: "Invalid retained receipt" };
  const reservationParsed = ReservationSchema.safeParse(files.reservation);
  if (!reservationParsed.success) return { ok: false, error: "Invalid retained reservation" };
  const receipt = receiptParsed.data;
  const reservation = reservationParsed.data;
  const rawHash = sha256(files.rawJson);
  if (rawHash !== receipt.rawSha256) return { ok: false, error: "Retained raw hash mismatch" };
  if (receipt.httpStatus !== 200) return { ok: false, error: "Retained receipt HTTP status not success" };
  if (expected?.kind && reservation.kind !== expected.kind) {
    return { ok: false, error: `Reservation kind mismatch: expected ${expected.kind}` };
  }
  const body0 = reservation.body[0] ?? {};
  const keyword = text(body0.keyword).trim();
  if (!keyword) return { ok: false, error: "Reservation missing keyword" };
  if (expected?.query && keyword !== expected.query) {
    return { ok: false, error: "Reservation query mismatch" };
  }
  const locationCode =
    typeof body0.location_code === "number" && Number.isInteger(body0.location_code)
      ? body0.location_code
      : null;
  if (expected?.locationCode !== undefined && locationCode !== expected.locationCode) {
    return { ok: false, error: "Reservation location_code mismatch" };
  }
  const parsed = parseEnvelope(files.rawJson);
  if (!parsed.ok) return parsed;
  const expectedEndpoints = {organic:"/v3/serp/google/organic/live/advanced", ai_mode:"/v3/serp/google/ai_mode/live/advanced", chatgpt:"/v3/ai_optimization/chat_gpt/llm_scraper/live/advanced"};
  if (reservation.body.length !== 1 || reservation.endpoint !== expectedEndpoints[reservation.kind] || "/" + (parsed.task.path as string[] ?? []).join("/") !== reservation.endpoint) return {ok:false,error:"Endpoint/task binding mismatch"};
  const sent=record(parsed.task.data);
  if (!sent || Object.entries(body0).some(([k,v])=>JSON.stringify(sent[k]) !== JSON.stringify(v))) return {ok:false,error:"Reserved request dimensions mismatch"};
  if (parsed.result.keyword !== keyword || parsed.result.location_code !== locationCode || parsed.result.language_code !== body0.language_code) return {ok:false,error:"Returned scope/query mismatch"};
  if (parsed.envelope.tasks_error !== 0 || receipt.statusCode !== 20000 || typeof parsed.envelope.cost !== "number" || parsed.envelope.cost !== receipt.cost || Math.round(parsed.envelope.cost*1e6)>reservation.reservedMicros) return {ok:false,error:"Receipt/status/cost mismatch"};
  const taskId =
    receipt.taskStatus?.[0]?.[0] && /^[a-zA-Z0-9_-]{1,128}$/.test(receipt.taskStatus[0][0])
      ? receipt.taskStatus[0][0]
      : null;
  return { ok: true, receipt, reservation, rawHash, taskId, keyword, locationCode };
}

function parseEnvelope(rawJson: string):
  | { ok: true; envelope: Record<string, unknown>; task: Record<string, unknown>; result: Record<string, unknown>; taskId: string }
  | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(rawJson);
  } catch {
    return { ok: false, error: "Invalid JSON raw capture" };
  }
  const envelope = record(data);
  if (!envelope) return { ok: false, error: "Raw capture is not an object" };
  if (envelope.status_code !== 20000) return { ok: false, error: "Envelope status_code not success" };
  const tasks = Array.isArray(envelope.tasks) ? envelope.tasks : [];
  if (tasks.length !== 1) return { ok: false, error: "Expected exactly one task" };
  const task = record(tasks[0]);
  if (!task || task.status_code !== 20000) return { ok: false, error: "Task unsuccessful" };
  const taskId = text(task.id);
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(taskId)) return { ok: false, error: "Invalid task id" };
  const results = Array.isArray(task.result) ? task.result : [];
  if (results.length !== 1) return { ok: false, error: "Task result missing" };
  const result = record(results[0]);
  if (!result) return { ok: false, error: "Task result invalid" };
  return { ok: true, envelope, task, result, taskId };
}

function organicHitsFromResult(
  result: Record<string, unknown>,
  targetHost: string
): { hits: OrganicHit[]; checkedDepth: number; completeTop20Window: boolean; spell: string | undefined } {
  const items = Array.isArray(result.items) ? result.items : [];
  const organic = items.filter(it => record(it)?.type === "organic");
  const seenUrls = new Set<string>();
  const hits: OrganicHit[] = [];
  for (const item of organic) {
    const row = record(item);
    if (!row) continue;
    const url = text(row.url);
    const host = hostnameOf(url) ?? "";
    const rankGroup =
      typeof row.rank_group === "number" && Number.isInteger(row.rank_group) && row.rank_group >= 1
        ? row.rank_group
        : NaN;
    if (!host || !url || !Number.isInteger(rankGroup) || rankGroup < 1) continue;
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);
    hits.push({
      position: rankGroup,
      title: text(row.title).slice(0, 500) || "Unknown",
      url,
      hostname: host,
      isTarget: hostsMatch(host, targetHost),
    });
  }
  hits.sort((a, b) => a.position - b.position);
  const positions = new Set(hits.map(h => h.position));
  let checkedDepth = 0;
  while (positions.has(checkedDepth + 1) && checkedDepth < DIRECT_RANK_TARGET_DEPTH) checkedDepth++;
  const completeTop20Window =
    checkedDepth >= DIRECT_RANK_TARGET_DEPTH &&
    hits.filter(h => h.position <= DIRECT_RANK_TARGET_DEPTH).length >= DIRECT_RANK_TARGET_DEPTH &&
    new Set(hits.filter(h => h.position <= DIRECT_RANK_TARGET_DEPTH).map(h => h.url)).size >=
      DIRECT_RANK_TARGET_DEPTH;
  const spellObj = record(result.spell);
  const spell =
    text(spellObj?.keyword) || text(spellObj?.type) || (typeof result.spell === "string" ? result.spell : "") || undefined;
  return { hits, checkedDepth, completeTop20Window, spell: spell || undefined };
}

/**
 * Parse one retained organic capture into a DirectRankCheck.
 * Partial depth never certifies not_found_top20.
 */
export function parseRetainedOrganicCheck(
  files: RetainedArtifactFiles,
  ctx: RetainedParseContext
): { ok: true; check: DirectRankCheck } | { ok: false; error: string } {
  const verified = verifyRetainedArtifact(files, {
    kind: "organic",
    query: ctx.expectedQuery,
    locationCode: US_LOCATION_CODE,
  });
  if (!verified.ok) return verified;
  if (verified.locationCode !== US_LOCATION_CODE) {
    return { ok: false, error: "Organic capture location_code is not United States (2840)" };
  }
  const envelope = parseEnvelope(files.rawJson);
  if (!envelope.ok) {
    return {
      ok: true,
      check: unknownOrganicCheck(verified.keyword, ctx, "unknown_failed", verified.taskId, verified.receipt.at, envelope.error),
    };
  }
  if (verified.taskId && envelope.taskId !== verified.taskId) {
    return {
      ok: true,
      check: unknownOrganicCheck(
        verified.keyword,
        ctx,
        "unknown_failed",
        verified.taskId,
        verified.receipt.at,
        "Task id mismatch between receipt and raw"
      ),
    };
  }
  const resultKeyword = text(envelope.result.keyword).trim();
  if (resultKeyword && resultKeyword !== verified.keyword) {
    return {
      ok: true,
      check: unknownOrganicCheck(
        verified.keyword,
        ctx,
        "unknown_failed",
        envelope.taskId,
        verified.receipt.at,
        "Result keyword mismatch"
      ),
    };
  }
  const targetHost = hostnameOf(ctx.websiteUrl) ?? "";
  const { hits, checkedDepth, completeTop20Window, spell } = organicHitsFromResult(envelope.result, targetHost);
  const providerLocation = ctx.expectedLocation ?? "United States";
  const observedAt = text(envelope.result.datetime) || verified.receipt.at;
  const key = createHash("sha256")
    .update(JSON.stringify(["dataforseo-organic-v1", verified.keyword, ctx.websiteUrl, providerLocation, "national", DIRECT_RANK_DEVICE]))
    .digest("hex");

  if (spell) {
    return {
      ok: true,
      check: {
        key,
        query: verified.keyword,
        intent: "service_provider",
        providerLocation,
        device: DIRECT_RANK_DEVICE,
        observedAt,
        outcome: "unknown_corrected",
        position: null,
        queryCorrection: spell,
        pages: [
          {
            start: 0,
            requestedDepth: DIRECT_RANK_TARGET_DEPTH,
            returnedCount: hits.length,
            captureStatus: "success",
            searchId: envelope.taskId,
            observedAt,
            error: "Provider corrected/spell-altered query",
          },
        ],
        checkedDepth: 0,
        completeTop20Window: false,
        hits: [],
        sourceIds: [envelope.taskId, `sha256:${verified.rawHash}`],
        reused: true,
      },
    };
  }

  const targetHit = hits
    .filter(h => h.isTarget && h.position >= 1 && h.position <= DIRECT_RANK_TARGET_DEPTH)
    .sort((a, b) => a.position - b.position)[0];
  let outcome: DirectRankCheck["outcome"];
  let position: number | null = null;
  if (completeTop20Window) {
    if (targetHit) {
      outcome = "ranked";
      position = targetHit.position;
    } else outcome = "not_found_top20";
  } else if (targetHit) {
    outcome = "ranked";
    position = targetHit.position;
  } else {
    outcome = "unknown_incomplete";
  }

  return {
    ok: true,
    check: {
      key,
      query: verified.keyword,
      intent: "service_provider",
      providerLocation,
      device: DIRECT_RANK_DEVICE,
      observedAt,
      outcome,
      position,
      pages: [
        {
          start: 0,
          requestedDepth: DIRECT_RANK_TARGET_DEPTH,
          returnedCount: hits.length,
          captureStatus: "success",
          searchId: envelope.taskId,
          observedAt,
        },
      ],
      checkedDepth,
      completeTop20Window,
      hits,
      sourceIds: [envelope.taskId, `sha256:${verified.rawHash}`],
      reused: true,
    },
  };
}

function unknownOrganicCheck(
  query: string,
  ctx: RetainedParseContext,
  outcome: DirectRankCheck["outcome"],
  taskId: string | null,
  observedAt: string,
  error: string
): DirectRankCheck {
  const providerLocation = ctx.expectedLocation ?? "United States";
  const key = createHash("sha256")
    .update(JSON.stringify(["dataforseo-organic-v1", query, ctx.websiteUrl, providerLocation, "national", DIRECT_RANK_DEVICE]))
    .digest("hex");
  return {
    key,
    query,
    intent: "service_provider",
    providerLocation,
    device: DIRECT_RANK_DEVICE,
    observedAt,
    outcome,
    position: null,
    pages: [
      {
        start: 0,
        requestedDepth: DIRECT_RANK_TARGET_DEPTH,
        returnedCount: 0,
        captureStatus: "provider_error",
        searchId: taskId ?? undefined,
        observedAt,
        error,
      },
    ],
    checkedDepth: 0,
    completeTop20Window: false,
    hits: [],
    sourceIds: taskId ? [taskId] : [],
    reused: true,
  };
}

export function buildDirectRankFromRetainedOrganic(
  checks: DirectRankCheck[],
  planQueries?: string[]
): DirectRankReport {
  const selected = (planQueries?.length ? planQueries : checks.map(c => c.query)).map(query => ({
    query,
    intent: "service_provider" as const,
    validatedRecommendation: false as const,
    source: "confirmed_need" as const,
  }));
  const plan: KeywordOpportunityPlan = {
    version: 1,
    candidates: selected,
    selected,
    reducedScope: selected.length < 8,
    rationale:
      "Retained DataForSEO organic pilot queries. Candidates are measurement targets only — not validated demand recommendations.",
  };
  return {
    version: 1,
    plan,
    checks,
    methodology:
      "Retained DataForSEO Google organic live/advanced captures (US location_code 2840, mobile/android, requested depth 20). Exact host/subdomain matching. not_found_top20 only after a complete contiguous top-20 organic window. Partial returned depth remains unknown_incomplete and suppresses visibility scoring. Corrected/error/mismatch captures remain unknown. Replay only — no paid retry.",
    publicPaidCollection: "disabled",
    transportCalls: 0,
  };
}

function detectLosAngelesScopeWarning(answer: string, items: unknown[]): string | null {
  const hasLocalBlock = items.some(it => record(it)?.type === "chat_gpt_local_businesses");
  const laHits = (answer.match(/\bLos Angeles\b/gi) ?? []).length;
  if (hasLocalBlock || laHits >= 3) {
    return laHits > 0 ? "Answer also includes Los Angeles local results despite US-wide request." : "Answer includes a local-business cluster despite US-wide request.";
  }
  return null;
}

/** Sources array = relied-on citations; markdown inline links are not cited alone. */
export function parseRetainedChatGPTSample(
  files: RetainedArtifactFiles,
  ctx: RetainedParseContext & { intent?: AIIntent; sampleKey?: string }
): { ok: true; sample: AISample } | { ok: false; error: string } {
  const verified = verifyRetainedArtifact(files, {
    kind: "chatgpt",
    query: ctx.expectedQuery,
    locationCode: US_LOCATION_CODE,
  });
  if (!verified.ok) return verified;
  const envelope = parseEnvelope(files.rawJson);
  if (!envelope.ok) return { ok: false, error: envelope.error };
  if (verified.taskId && envelope.taskId !== verified.taskId) {
    return { ok: false, error: "ChatGPT task id mismatch" };
  }
  const resultKeyword = text(envelope.result.keyword).trim();
  if (resultKeyword && resultKeyword !== verified.keyword) {
    return { ok: false, error: "ChatGPT result keyword mismatch" };
  }
  const answer = text(envelope.result.markdown).trim();
  if (!answer) return { ok: false, error: "ChatGPT answer missing" };
  const sources = Array.isArray(envelope.result.sources) ? envelope.result.sources : [];
  const citations: ChatGPTEvidence["citations"] = [];
  for (const ref of sources) {
    const row = record(ref);
    if (!row) continue;
    const url = text(row.url);
    const host = hostnameOf(url);
    if (!/^https?:\/\//i.test(url) || !host || url.length > 4096 || citations.some(c => c.url === url)) continue;
    const safeUrl = new URL(url);
    safeUrl.search = "";
    safeUrl.hash = "";
    citations.push({
      title: text(row.title).slice(0, 300),
      url: safeUrl.toString(),
      hostname: host,
      relation: "cited_or_relied_on",
    });
  }
  const items = Array.isArray(envelope.result.items) ? envelope.result.items : [];
  const scopeWarning = detectLosAngelesScopeWarning(answer, items);
  const name = brandPattern(ctx.businessName);
  const visible = answer.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/https?:\/\/\S+/gi, "");
  const target = hostnameOf(ctx.websiteUrl);
  const modelRaw = envelope.result.model;
  const modelObserved = modelRaw === null || modelRaw === undefined ? null : text(modelRaw) || null;
  const observedAt = text(envelope.result.datetime) || verified.receipt.at;
  const evidence: ChatGPTEvidence = {
    state: "observed",
    query: verified.keyword,
    location: ctx.expectedLocation ?? "United States",
    observedAt,
    source: "dataforseo",
    product: "consumer_chatgpt_scraper",
    mode: verified.reservation.body[0].force_web_search === true ? "search" : "default",
    providerObservedAt: observedAt,
    locationObserved: `vendor-location-code:${verified.locationCode ?? US_LOCATION_CODE}`,
    modelObserved,
    answer,
    citations,
    mentioned: name ? name.test(visible) : null,
    cited: target ? [...answer.matchAll(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)].some(m => hostsMatch(hostnameOf(m[1]) ?? "", target)) : null,
    receipt: {
      cost: typeof envelope.envelope.cost === "number" ? envelope.envelope.cost : null,
      taskCost: typeof envelope.task.cost === "number" ? envelope.task.cost : null,
      taskId: envelope.taskId,
      rawSha256: verified.rawHash,
    },
    raw: {
      status_code: 20000,
      task_status_code: 20000,
      markdown: answer,
      sources: citations.map(c => ({ title: c.title, url: c.url })),
    },
  };
  const intent = ctx.intent ?? "provider_shortlist";
  const key =
    ctx.sampleKey ??
    createHash("sha256")
      .update(JSON.stringify(["dataforseo-chatgpt-v1", verified.keyword, ctx.businessName, ctx.websiteUrl]))
      .digest("hex");
  return {
    ok: true,
    sample: {
      key,
      engine: "chatgpt",
      intent,
      query: verified.keyword,
      submittedQuery: verified.keyword,
      evidence,
      reused: true,
      competitorNames: [],
      scopeWarning,
    },
  };
}

export function parseRetainedAIModeSample(
  files: RetainedArtifactFiles,
  ctx: RetainedParseContext & { intent?: AIIntent; sampleKey?: string }
): { ok: true; sample: AISample } | { ok: false; error: string } {
  const verified = verifyRetainedArtifact(files, {
    kind: "ai_mode",
    query: ctx.expectedQuery,
    locationCode: US_LOCATION_CODE,
  });
  if (!verified.ok) return verified;
  const envelope = parseEnvelope(files.rawJson);
  if (!envelope.ok) return { ok: false, error: envelope.error };
  if (verified.taskId && envelope.taskId !== verified.taskId) {
    return { ok: false, error: "AI Mode task id mismatch" };
  }
  const resultKeyword = text(envelope.result.keyword).trim();
  if (resultKeyword && resultKeyword !== verified.keyword) {
    return { ok: false, error: "AI Mode result keyword mismatch" };
  }
  const items = Array.isArray(envelope.result.items) ? envelope.result.items : [];
  const overview = items.map(record).find(it => it?.type === "ai_overview");
  if (!overview) return { ok: false, error: "AI Mode capture missing ai_overview item" };
  const answer = text(overview.markdown).trim();
  if (!answer) return { ok: false, error: "AI Mode answer missing" };
  const citations: GoogleAIModeEvidence["citations"] = [];
  const seen = new Set<string>();
  const collectRefs = (node: unknown) => {
    const row = record(node);
    if (!row) return;
    if (Array.isArray(row.references)) {
      for (const ref of row.references) {
        const r = record(ref);
        const url = text(r?.url) || text(r?.link);
        const host = hostnameOf(url);
        if (!/^https?:\/\//i.test(url) || !host || seen.has(url)) continue;
        seen.add(url);
        citations.push({ title: text(r?.title) || url, url });
      }
    }
    if (Array.isArray(row.items)) row.items.forEach(collectRefs);
  };
  collectRefs(overview);
  const name = brandPattern(ctx.businessName);
  const visible = answer.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/https?:\/\/\S+/gi, "");
  const target = hostnameOf(ctx.websiteUrl);
  const observedAt = text(envelope.result.datetime) || verified.receipt.at;
  const evidence: GoogleAIModeEvidence = {
    state: "observed",
    query: verified.keyword,
    location: ctx.expectedLocation ?? "United States",
    observedAt,
    source: "dataforseo",
    answer,
    citations,
    mentioned: name ? name.test(visible) : null,
    cited: target ? [...answer.matchAll(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)].some(m => hostsMatch(hostnameOf(m[1]) ?? "", target)) : null,
    providerSearchId: envelope.taskId,
    receipt: {
      cost: typeof envelope.envelope.cost === "number" ? envelope.envelope.cost : null,
      taskCost: typeof envelope.task.cost === "number" ? envelope.task.cost : null,
      taskId: envelope.taskId,
      rawSha256: verified.rawHash,
    },
    modelObserved: null,
  };
  const intent = ctx.intent ?? "provider_shortlist";
  const key =
    ctx.sampleKey ??
    createHash("sha256")
      .update(JSON.stringify(["dataforseo-ai-mode-v1", verified.keyword, ctx.businessName, ctx.websiteUrl]))
      .digest("hex");
  return {
    ok: true,
    sample: {
      key,
      engine: "google_ai_mode",
      intent,
      query: verified.keyword,
      submittedQuery: verified.keyword,
      evidence,
      reused: true,
      competitorNames: [],
      scopeWarning: null,
    },
  };
}

const INTENT_CYCLE: AIIntent[] = ["provider_shortlist", "specific_service", "comparison_selection"];

export function buildAISamplingFromRetainedSamples(samples: AISample[]): AISamplingReport {
  const questionsMap = new Map<string, AIQuestion>();
  for (const s of samples) {
    if (!questionsMap.has(s.query)) {
      questionsMap.set(s.query, { intent: s.intent, query: s.query });
    }
  }
  const questions = [...questionsMap.values()];
  const scopeWarnings = [
    ...new Set(samples.map(s => s.scopeWarning).filter((w): w is string => Boolean(w))),
  ];
  return {
    version: 1,
    questions,
    samples,
    summary: summarizeAISamples(samples),
    byEngine: {
      chatgpt: summarizeAISamples(samples.filter(s => s.engine === "chatgpt")),
      google_ai_mode: summarizeAISamples(samples.filter(s => s.engine === "google_ai_mode")),
    },
    methodology:
      "Retained DataForSEO Google AI Mode and ChatGPT LLM-scraper captures (US location_code 2840). Provider sources remain reference candidates, not all proven inline citations; own-domain citation flags require a retained inline answer link. ChatGPT default/forced-search mode follows the original request. Model remains unknown when the provider returns null. Geographic scope warnings suppress national AI scores without erasing mention/citation observations. Replay only — no paid retry.",
    scopeWarnings,
  };
}

/** Load and parse a full 14-capture pilot directory layout (00–07 organic, 08–10 ai_mode, 11–13 chatgpt). */
export function parsePilotDirectory(
  readText: (name: string) => string,
  ctx: RetainedParseContext
): {
  directRank: DirectRankReport;
  aiSampling: AISamplingReport;
  hashes: string[];
  scopeWarnings: string[];
} {
  const hashes: string[] = [];
  const organicChecks: DirectRankCheck[] = [];
  for (let i = 0; i < 8; i++) {
    const prefix = `${String(i).padStart(2, "0")}-organic`;
    const rawJson = readText(`${prefix}.raw.json`);
    const receipt = JSON.parse(readText(`${prefix}.receipt.json`));
    const reservation = JSON.parse(readText(`${prefix}.reservation.json`));
    const files = { rawJson, receipt, reservation };
    const verified = verifyRetainedArtifact(files, { kind: "organic", locationCode: US_LOCATION_CODE });
    if (!verified.ok) throw new Error(`Organic ${prefix}: ${verified.error}`);
    hashes.push(verified.rawHash);
    const parsed = parseRetainedOrganicCheck(files, { ...ctx, expectedQuery: verified.keyword });
    if (!parsed.ok) throw new Error(`Organic ${prefix}: ${parsed.error}`);
    organicChecks.push(parsed.check);
  }

  const aiSamples: AISample[] = [];
  const aiSpecs: { prefix: string; kind: "ai_mode" | "chatgpt"; engine: AIEngine }[] = [
    { prefix: "08-ai_mode", kind: "ai_mode", engine: "google_ai_mode" },
    { prefix: "09-ai_mode", kind: "ai_mode", engine: "google_ai_mode" },
    { prefix: "10-ai_mode", kind: "ai_mode", engine: "google_ai_mode" },
    { prefix: "11-chatgpt", kind: "chatgpt", engine: "chatgpt" },
    { prefix: "12-chatgpt", kind: "chatgpt", engine: "chatgpt" },
    { prefix: "13-chatgpt", kind: "chatgpt", engine: "chatgpt" },
  ];
  for (let idx = 0; idx < aiSpecs.length; idx++) {
    const spec = aiSpecs[idx];
    const rawJson = readText(`${spec.prefix}.raw.json`);
    const receipt = JSON.parse(readText(`${spec.prefix}.receipt.json`));
    const reservation = JSON.parse(readText(`${spec.prefix}.reservation.json`));
    const files = { rawJson, receipt, reservation };
    const verified = verifyRetainedArtifact(files, { kind: spec.kind, locationCode: US_LOCATION_CODE });
    if (!verified.ok) throw new Error(`AI ${spec.prefix}: ${verified.error}`);
    hashes.push(verified.rawHash);
    const intent = INTENT_CYCLE[idx % 3];
    const parsed =
      spec.kind === "chatgpt"
        ? parseRetainedChatGPTSample(files, { ...ctx, expectedQuery: verified.keyword, intent })
        : parseRetainedAIModeSample(files, { ...ctx, expectedQuery: verified.keyword, intent });
    if (!parsed.ok) throw new Error(`AI ${spec.prefix}: ${parsed.error}`);
    aiSamples.push(parsed.sample);
  }

  const directRank = buildDirectRankFromRetainedOrganic(organicChecks);
  const aiSampling = buildAISamplingFromRetainedSamples(aiSamples);
  return {
    directRank,
    aiSampling,
    hashes,
    scopeWarnings: aiSampling.scopeWarnings ?? [],
  };
}
