import { createHash } from "node:crypto";
import type { AuditContext } from "../audit-context";
import { resolveGeography, zipForSerpResolver } from "../geography";
import { queryCorrection } from "../query-correction";
import { planKeywordOpportunities, type KeywordOpportunityPlan } from "../keyword-plan";
import type { SerpCapture } from "./serpapi-transport";

/** SerpAPI google organic: default page size is 10; start offsets 0,10,… for depth. */
export const DIRECT_RANK_PAGE_SIZE = 10;
export const DIRECT_RANK_TARGET_DEPTH = 20;
export const DIRECT_RANK_DEVICE = "mobile" as const;

export type DirectRankOutcome =
  | "ranked"
  | "not_found_top20"
  | "unknown_incomplete"
  | "unknown_corrected"
  | "unknown_failed"
  | "not_authorized"
  | "not_configured";

export interface OrganicHit {
  position: number;
  title: string;
  url: string;
  hostname: string;
  isTarget: boolean;
}

export interface DirectRankPageEvidence {
  start: number;
  requestedDepth: number;
  returnedCount: number;
  captureStatus: SerpCapture["status"] | "replayed";
  searchId?: string;
  observedAt: string;
  error?: string;
}

export interface DirectRankCheck {
  key: string;
  query: string;
  intent: string;
  providerLocation: string;
  device: typeof DIRECT_RANK_DEVICE;
  observedAt: string;
  outcome: DirectRankOutcome;
  /** Actual organic position when ranked; null otherwise. */
  position: number | null;
  queryCorrection?: string;
  pages: DirectRankPageEvidence[];
  /** Highest complete organic position inspected when pages succeeded. */
  checkedDepth: number;
  completeTop20Window: boolean;
  hits: OrganicHit[];
  sourceIds: string[];
  reused: boolean;
}

export interface DirectRankReport {
  version: 1;
  plan: KeywordOpportunityPlan;
  checks: DirectRankCheck[];
  methodology: string;
  /** Public default: additional paid collection disabled until owner budget + server policy. */
  publicPaidCollection: "disabled" | "operator_authorized";
  transportCalls: number;
}

export interface DirectRankTransportRequest {
  engine: "google";
  q: string;
  location: string;
  gl: "us";
  hl: "en";
  device: typeof DIRECT_RANK_DEVICE;
  /** SerpAPI organic pagination offset (0, 10, …). */
  start: string;
  num: string;
}

export interface DirectRankOptions {
  /** Dependency-injected transport — tests never hit the network. */
  transport: (params: DirectRankTransportRequest) => Promise<SerpCapture>;
  /** Exact request authorization required BEFORE every additional send. */
  authorize: (reservation: Readonly<{
    requestKey: string;
    query: string;
    start: number;
    requestBody: string;
  }>) => Promise<boolean>;
  /** Optional ZIP→canonical location resolver (local only). */
  resolveLocation?: (zip5: string) => Promise<{ location?: string; error?: string }>;
  existingReport?: Pick<DirectRankReport, "checks">;
  /** When false/undefined: plan only, zero transport (public default). */
  enableCollection?: boolean;
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

/** Exact host or subdomain of target — not brand-name text matching. */
export function hostsMatch(resultHost: string, targetHost: string): boolean {
  const a = resultHost.toLowerCase().replace(/^www\./, "");
  const b = targetHost.toLowerCase().replace(/^www\./, "");
  return Boolean(b) && (a === b || a.endsWith(`.${b}`));
}

export function directRankKey(input: {
  query: string;
  websiteUrl: string;
  providerLocation: string;
  geography: string;
  device?: string;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        "direct-rank-v1",
        input.query,
        input.websiteUrl,
        input.providerLocation,
        input.geography,
        input.device ?? DIRECT_RANK_DEVICE,
        DIRECT_RANK_TARGET_DEPTH,
      ])
    )
    .digest("hex");
}

export function parseOrganicHits(
  data: Record<string, unknown> | undefined,
  targetHost: string,
  startOffset: number = 0
): OrganicHit[] {
  const organic = Array.isArray(data?.organic_results) ? (data!.organic_results as Record<string, unknown>[]) : [];
  return organic.flatMap((item) => {
    const link = String(item.link ?? "");
    const host = hostnameOf(link) ?? "";
    const rawPosition = typeof item.position === "number" ? item.position : typeof item.position === "string" && /^\d+$/.test(item.position) ? Number(item.position) : NaN;
    if (!host || !Number.isInteger(rawPosition) || rawPosition < 1) return [];
    const position = startOffset > 0 && rawPosition <= DIRECT_RANK_PAGE_SIZE ? startOffset + rawPosition : rawPosition;
    return {
      position,
      title: String(item.title ?? "Unknown"),
      url: link,
      hostname: host,
      isTarget: hostsMatch(host, targetHost),
    };
  });
}

/**
 * Bounded direct-rank collector. No implicit retries. Replay same-key evidence with zero transport.
 * Claiming not_found_top20 requires a complete checked window of 20. Old top-10-only rows cannot claim top-20.
 */
export async function collectDirectRanks(
  input: {
    businessName: string;
    websiteUrl: string;
    zipCode: string;
    servicePhrase: string;
    auditContext?: AuditContext | null;
    confirmedNeeds?: readonly string[];
  },
  options: DirectRankOptions
): Promise<DirectRankReport> {
  const geo = resolveGeography({ context: input.auditContext, zipCode: input.zipCode });
  if (!geo.ok) {
    return {
      version: 1,
      plan: planKeywordOpportunities({
        businessName: input.businessName,
        servicePhrase: input.servicePhrase,
        auditContext: input.auditContext,
        confirmedNeeds: input.confirmedNeeds,
      }),
      checks: [],
      methodology: `Direct rank collection refused: ${geo.error}`,
      publicPaidCollection: options.enableCollection ? "operator_authorized" : "disabled",
      transportCalls: 0,
    };
  }

  const plan = planKeywordOpportunities({
    businessName: input.businessName,
    servicePhrase: input.servicePhrase,
    auditContext: input.auditContext,
    confirmedNeeds: input.confirmedNeeds,
    geography: geo.geography,
    zipCode: geo.zipCode,
    serviceArea: geo.cacheDims.serviceArea,
  });

  const targetHost = hostnameOf(input.websiteUrl) ?? "";
  const saved = new Map((options.existingReport?.checks ?? []).map(c => [c.key, c]));
  let transportCalls = 0;
  const checks: DirectRankCheck[] = [];

  let providerLocation = geo.providerLocation;
  if (geo.requiresZipResolver) {
    const zip5 = zipForSerpResolver(geo);
    if (!zip5) {
      return {
        version: 1,
        plan,
        checks: [],
        methodology: "Direct rank collection refused: invalid ZIP for local resolver",
        publicPaidCollection: options.enableCollection ? "operator_authorized" : "disabled",
        transportCalls: 0,
      };
    }
    if (options.resolveLocation) {
      const resolved = await options.resolveLocation(zip5);
      if (resolved.error || !resolved.location) {
        return {
          version: 1,
          plan,
          checks: [],
          methodology: `Direct rank collection refused: ${resolved.error ?? "ZIP not resolved"}`,
          publicPaidCollection: options.enableCollection ? "operator_authorized" : "disabled",
          transportCalls: 0,
        };
      }
      providerLocation = resolved.location;
    }
  }

  const pagesNeeded = Math.ceil(DIRECT_RANK_TARGET_DEPTH / DIRECT_RANK_PAGE_SIZE);

  for (const candidate of plan.selected) {
    const key = directRankKey({
      query: candidate.query,
      websiteUrl: input.websiteUrl,
      providerLocation,
      geography: geo.cacheDims.geography,
    });
    const existing = saved.get(key);
    if (existing && existing.query === candidate.query) {
      checks.push({ ...existing, reused: true });
      continue;
    }

    if (!options.enableCollection) {
      checks.push({
        key,
        query: candidate.query,
        intent: candidate.intent,
        providerLocation,
        device: DIRECT_RANK_DEVICE,
        observedAt: new Date().toISOString(),
        outcome: "not_authorized",
        position: null,
        pages: [],
        checkedDepth: 0,
        completeTop20Window: false,
        hits: [],
        sourceIds: [],
        reused: false,
      });
      continue;
    }

    const pages: DirectRankPageEvidence[] = [];
    const hits: OrganicHit[] = [];
    const sourceIds: string[] = [];
    let corrected: string | undefined;
    let failed = false;
    let denied = false;
    let incomplete = false;

    for (let page = 0; page < pagesNeeded; page++) {
      const start = page * DIRECT_RANK_PAGE_SIZE;
      const request: DirectRankTransportRequest = {
        engine: "google",
        q: candidate.query,
        location: providerLocation,
        gl: "us",
        hl: "en",
        device: DIRECT_RANK_DEVICE,
        start: String(start),
        num: String(DIRECT_RANK_PAGE_SIZE),
      };
      const requestBody = JSON.stringify(request);
      const requestKey = createHash("sha256").update(requestBody).digest("hex");
      let allowed = false;
      try {
        allowed = (await options.authorize({ requestKey, query: candidate.query, start, requestBody })) === true;
      } catch {
        allowed = false;
      }
      if (!allowed) {
        denied = true;
        pages.push({
          start,
          requestedDepth: start + DIRECT_RANK_PAGE_SIZE,
          returnedCount: 0,
          captureStatus: "not_configured",
          observedAt: new Date().toISOString(),
          error: "Exact request authorization denied before send",
        });
        break;
      }

      transportCalls++;
      let capture: SerpCapture;
      try { capture = await options.transport(request); } catch {
        failed = true;
        pages.push({start, requestedDepth:start + DIRECT_RANK_PAGE_SIZE,returnedCount:0,captureStatus:"provider_error",observedAt:new Date().toISOString(),error:"Direct-rank provider request failed"});
        break;
      }
      if (capture.searchId) sourceIds.push(capture.searchId);
      const pageHits = parseOrganicHits(capture.data, targetHost, start);
      pages.push({
        start,
        requestedDepth: start + DIRECT_RANK_PAGE_SIZE,
        returnedCount: pageHits.length,
        captureStatus: capture.status,
        searchId: capture.searchId,
        observedAt: capture.observedAt,
        error: capture.error,
      });

      if (capture.status !== "success" || !capture.data) {
        failed = true;
        break;
      }

      const correction = queryCorrection(capture.data);
      if (correction) {
        corrected = correction;
        break;
      }

      hits.push(...pageHits);
      // Incomplete page before target depth → cannot claim full top-20 window.
      if (pageHits.length < DIRECT_RANK_PAGE_SIZE && start + pageHits.length < DIRECT_RANK_TARGET_DEPTH) {
        incomplete = true;
        break;
      }
    }

    const positions = new Set(hits.map(h => h.position));
    let checkedDepth = 0;
    while (positions.has(checkedDepth + 1) && checkedDepth < DIRECT_RANK_TARGET_DEPTH) checkedDepth++;
    const distinctUrls = new Set(hits.filter(h => h.position <= DIRECT_RANK_TARGET_DEPTH).map(h => h.url));
    const completeTop20Window =
      !failed && !denied && !corrected && !incomplete && checkedDepth >= DIRECT_RANK_TARGET_DEPTH && distinctUrls.size >= DIRECT_RANK_TARGET_DEPTH;
    // Reusing old top-10-only evidence cannot claim top-20:
    if (existing && existing.checkedDepth < DIRECT_RANK_TARGET_DEPTH && !completeTop20Window) {
      /* already handled via new collection path */
    }

    const targetHit = hits.filter(h => h.isTarget && h.position >= 1 && h.position <= DIRECT_RANK_TARGET_DEPTH).sort((a,b) => a.position - b.position)[0];
    let outcome: DirectRankOutcome;
    let position: number | null = null;
    if (denied && pages.every(p => p.returnedCount === 0)) outcome = "not_authorized";
    else if (corrected) outcome = "unknown_corrected";
    else if (failed) outcome = "unknown_failed";
    else if (incomplete || !completeTop20Window) {
      if (targetHit) {
        outcome = "ranked";
        position = targetHit.position;
      } else outcome = "unknown_incomplete";
    } else if (targetHit) {
      outcome = "ranked";
      position = targetHit.position;
    } else outcome = "not_found_top20";

    checks.push({
      key,
      query: candidate.query,
      intent: candidate.intent,
      providerLocation,
      device: DIRECT_RANK_DEVICE,
      observedAt: new Date().toISOString(),
      outcome,
      position,
      queryCorrection: corrected,
      pages,
      checkedDepth,
      completeTop20Window,
      hits,
      sourceIds,
      reused: false,
    });
  }

  return {
    version: 1,
    plan,
    checks,
    methodology:
      "Bounded mobile Google organic direct-rank checks via SerpAPI (engine=google, num=10, start pagination). Exact URL host/subdomain matching only. Corrected queries excluded. not_found_top20 only after a complete inspected top-20 window. Failed/incomplete pages remain unknown. Every additional request requires exact authorization before send; same-key evidence replays without transport. Public paid expansion remains disabled until owner-approved budget and server policy.",
    publicPaidCollection: options.enableCollection ? "operator_authorized" : "disabled",
    transportCalls,
  };
}

/** Honest reuse of already-obtained organic blocks — never claim top-20 from top-10-only rows. */
export function organicEvidenceFromExistingBlock(block: {
  query: string;
  results: { position: number; address?: string; isClient?: boolean }[];
  location?: string;
  observedAt?: string;
  queryCorrection?: string;
}): Pick<DirectRankCheck, "outcome" | "position" | "checkedDepth" | "completeTop20Window"> {
  if (block.queryCorrection) {
    return { outcome: "unknown_corrected", position: null, checkedDepth: 0, completeTop20Window: false };
  }
  const valid = block.results.filter(r => Number.isInteger(r.position) && r.position > 0);
  const positions = new Set(valid.map(r => r.position));
  let depth = 0;
  while (positions.has(depth + 1) && depth < DIRECT_RANK_TARGET_DEPTH) depth++;
  const hit = valid.filter(r => r.isClient).sort((a,b) => a.position - b.position)[0];
  if (hit) {
    return {
      outcome: "ranked",
      position: hit.position,
      checkedDepth: depth,
      completeTop20Window: depth >= DIRECT_RANK_TARGET_DEPTH,
    };
  }
  if (depth >= DIRECT_RANK_TARGET_DEPTH) {
    return { outcome: "not_found_top20", position: null, checkedDepth: depth, completeTop20Window: true };
  }
  return { outcome: "unknown_incomplete", position: null, checkedDepth: depth, completeTop20Window: false };
}
