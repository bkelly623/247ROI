import { requestSerp, resolveSerpLocation, redactSerp, type SerpCapture } from "./serpapi-transport";
import { businessNameMentioned } from "../infer-service";
import type { AuditDeficit, GoogleAIOverviewEvidence, GoogleLocalResult } from "../types";
import { getPlacesKey, getSerpApiKey } from "../env";

import { queryCorrection } from "../query-correction";

export interface GoogleSearchBlock {
  queryCorrection?: string;
  queryIntent?: "branded" | "unbranded" | "unknown";
  query: string;
  type: "local" | "organic";
  source?: "serpapi" | "places";
  observedAt?: string;
  location?: string;
  results: GoogleLocalResult[];
  clientFound: boolean;
  clientPosition: number | null;
}

export interface GoogleSearchAudit {
  aiOverviews?: GoogleAIOverviewEvidence[];
  captures?: Omit<SerpCapture, "data">[];
  configured: boolean;
  blocks: GoogleSearchBlock[];
  businessListing: {
    found: boolean;
    name?: string;
    rating?: number;
    reviewCount?: number;
    address?: string;
    phone?: string;
  };
  summary: string;
  rawError?: string;
}

function parseLocal(data: Record<string, unknown>, businessName: string): GoogleLocalResult[] {
  const local = localRows(data);
  return local.slice(0, 10).map((item, i) => {
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

function parseOrganic(
  data: Record<string, unknown>,
  businessName: string,
  websiteHost: string
): GoogleLocalResult[] {
  const organic = (data.organic_results as Record<string, unknown>[]) ?? [];
  return organic.slice(0, 10).map((item, i) => {
    const title = String(item.title ?? "Unknown");
    const link = String(item.link ?? "");
    // Brand mentions and lookalike URLs are not rankings for the audited site.
    let isClient = false;
    try {
      const resultHost = new URL(link).hostname.toLowerCase().replace(/^www\./, "");
      const targetHost = websiteHost.replace(/^www\./, "");
      isClient = Boolean(targetHost && (resultHost === targetHost || resultHost.endsWith(`.${targetHost}`)));
    } catch { /* Invalid URLs do not establish a match. */ }
    return {
      position: (item.position as number) ?? i + 1,
      name: title,
      address: link,
      isClient,
    };
  });
}

export function localRows(data: Record<string, unknown>): Record<string, unknown>[] {
  const local = data.local_results;
  const rows = Array.isArray(local) ? local : local && typeof local === "object" ? (local as Record<string, unknown>).places : [];
  return Array.isArray(rows) ? rows.filter(r => r && typeof r === "object") : [];
}

async function serpSearch(engine: "google_local" | "google", query: string, location: string) {
  return requestSerp({ engine, q: query, location, gl: "us", hl: "en" });
}

// At most one token follow-up per organic sample. Never retry uncertain sends.
export async function loadAIOverview(data: Record<string, unknown>, query: string, location: string): Promise<{ evidence: GoogleAIOverviewEvidence; capture?: SerpCapture }> {
  const initial = parseAIOverview(data, query, location);
  const overview = data.ai_overview as Record<string, unknown> | undefined;
  if (initial.state === "observed" || typeof overview?.page_token !== "string" || !overview.page_token) return { evidence: initial };
  const capture = await requestSerp({ engine: "google_ai_overview", page_token: overview.page_token }, 20000);
  capture.query = query;
  capture.location = location;
  const evidence = capture.data ? parseAIOverview(capture.data, query, location) : initial;
  if (evidence.state !== "observed") evidence.state = "unavailable";
  return { evidence, capture };
}

async function placesSearch(
  query: string,
  businessName: string
): Promise<GoogleLocalResult[]> {
  const key = getPlacesKey();
  if (!key) return [];

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    signal: AbortSignal.timeout(25000),
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.nationalPhoneNumber",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 10 }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  const places = (data.places as Record<string, unknown>[]) ?? [];

  return places.map((p, i) => {
    const name = String((p.displayName as { text?: string })?.text ?? "Unknown");
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

// Parse captured Google answer text only; token loading is handled separately.
export function parseAIOverview(data: Record<string, unknown>, query: string, location: string): GoogleAIOverviewEvidence {
  const overview = data.ai_overview as Record<string, unknown> | undefined;
  const texts: string[] = [];
  function walk(value: unknown): void {
    if (!value || typeof value !== "object") return;
    const node = value as Record<string, unknown>;
    if (typeof node.snippet === "string") texts.push(node.snippet);
    for (const key of ["text_blocks", "list"]) if (Array.isArray(node[key])) (node[key] as unknown[]).forEach(walk);
  }
  walk(overview);
  const answer = texts.join("\n").trim();
  const references = Array.isArray(overview?.references) ? overview.references as Record<string, unknown>[] : [];
  const citations = references.flatMap(ref => {
    if (typeof ref.link !== "string") return [];
    try { const url = new URL(ref.link); if (!['https:', 'http:'].includes(url.protocol)) return []; }
    catch { return []; }
    return [{ title: String(ref.title ?? ref.link), url: ref.link }];
  });
  return { query, location, observedAt: new Date().toISOString(), source: "serpapi", state: answer ? "observed" : overview ? "unavailable" : "not_returned", ...(answer ? { answer } : {}), citations };
}

export async function probeGoogleSearch(input: {
  businessName: string;
  zipCode: string;
  servicePhrase: string;
  websiteUrl: string;
}): Promise<GoogleSearchAudit> {
  const host = input.websiteUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  const queries = {
    local: `${input.servicePhrase} near ${input.zipCode}`,
    organic: `best ${input.servicePhrase} ${input.zipCode}`,
    branded: input.businessName,
  };

  const hasService = Boolean(input.servicePhrase.trim()) && input.servicePhrase.trim().toLowerCase() !== input.businessName.trim().toLowerCase();
  const hasSerp = Boolean(getSerpApiKey());
  const hasPlaces = Boolean(getPlacesKey());
  const errors: string[] = [];

  if (!hasSerp && !hasPlaces) {
    return {
      configured: false,
      blocks: [],
      businessListing: { found: false },
      summary: "Google rankings were not measured in this scan.",
      rawError: "No Google search API configured",
    };
  }

  const blocks: GoogleSearchBlock[] = [];
  const aiOverviews: GoogleAIOverviewEvidence[] = [];
  const captures: Omit<SerpCapture, "data">[] = [];
  const resolved = hasSerp ? await resolveSerpLocation(input.zipCode) : {};
  const location = resolved.location;
  if (resolved.error) errors.push(resolved.error);
  const keepCapture = (capture: SerpCapture) => {
    const { data: _data, ...record } = capture;
    captures.push(redactSerp(record) as Omit<SerpCapture, "data">);
  };

  // Independent captures run in parallel; one bounded Overview follow-up may follow.
  const [localRes, organicRes, brandRes]: Partial<SerpCapture>[] = hasSerp && location
    ? await Promise.all([
        // Standard Google results include the local pack; avoid the repeatedly
        // timing-out standalone local-search engine. This remains one capture.
        hasService ? serpSearch("google", queries.local, location) : Promise.resolve({}),
        hasService ? serpSearch("google", queries.organic, location) : Promise.resolve({}),
        serpSearch("google", queries.branded, location),
      ])
    : [{}, {}, {}];
  for (const capture of [localRes, organicRes, brandRes]) if (capture.engine) keepCapture(capture as SerpCapture);

  if (hasSerp) {
    if (localRes.error) errors.push(localRes.error);
    if (localRes.data) {
      const results = parseLocal(localRes.data, input.businessName);
      const hit = results.find((r) => r.isClient);
      blocks.push({
        query: queries.local,
        type: "local",
        source: "serpapi",
        results,
        clientFound: Boolean(hit),
        clientPosition: hit?.position ?? null,
      });
    }

    if (organicRes.error) errors.push(organicRes.error);
    if (organicRes.data) {
      const loaded = await loadAIOverview(organicRes.data, queries.organic, location!);
      aiOverviews.push(loaded.evidence);
      if (loaded.capture) { keepCapture(loaded.capture); if (loaded.capture.error) errors.push(loaded.capture.error); }
      const results = parseOrganic(organicRes.data, input.businessName, host);
      const hit = results.find((r) => r.isClient);
      blocks.push({
        query: queries.organic,
        type: "organic",
        source: "serpapi",
        results,
        clientFound: Boolean(hit),
        clientPosition: hit?.position ?? null,
      });
    }
  }

  if (blocks.length === 0 && hasPlaces) {
    const results = await placesSearch(queries.local, input.businessName);
    const hit = results.find((r) => r.isClient);
    blocks.push({
      query: queries.local,
      type: "local",
      source: "places",
      results,
      clientFound: Boolean(hit),
      clientPosition: hit?.position ?? null,
    });
  }

  let businessListing: GoogleSearchAudit["businessListing"] = { found: false };

  if (hasSerp) {
    const brandData = brandRes.data;
    if (brandRes.error) errors.push(brandRes.error);
    if (brandData) {
      const results = parseOrganic(brandData, input.businessName, host);
      const hit = results.find(r => r.isClient);
      blocks.push({ query: queries.branded, queryCorrection: queryCorrection(brandData), type: "organic", source: "serpapi", results, clientFound: Boolean(hit), clientPosition: hit?.position ?? null });
    }
    const kg = brandData?.knowledge_graph as Record<string, unknown> | undefined;
    const local = brandData ? localRows(brandData) : [];

    if (kg && businessNameMentioned(String(kg.title ?? ""), input.businessName)) {
      businessListing = {
        found: true,
        name: String(kg.title ?? input.businessName),
        rating: kg.rating as number | undefined,
        reviewCount: kg.review_count as number | undefined,
        address: kg.address as string | undefined,
        phone: kg.phone as string | undefined,
      };
    } else if (local?.length) {
      const match = local.find((l) =>
        businessNameMentioned(String(l.title ?? ""), input.businessName)
      ) as Record<string, unknown> | undefined;
      if (match) {
        businessListing = {
          found: true,
          name: String(match.title),
          rating: match.rating as number | undefined,
          reviewCount: match.reviews as number | undefined,
          address: match.address as string | undefined,
          phone: match.phone as string | undefined,
        };
      }
    }
  }

  const localBlock = blocks.find((b) => b.type === "local");
  for (const block of blocks) block.queryIntent = block.query === queries.branded ? "branded" : hasService ? "unbranded" : "unknown";
  const organicBlock = blocks.find((b) => b.type === "organic" && b.clientFound) ?? blocks.find((b) => b.type === "organic");

  let summary = "";
  if (!localBlock?.clientFound && !organicBlock?.clientFound) {
    summary = `${input.businessName} not matched in the returned samples. Missing or failed lanes remain unmeasured.`;
  } else {
    const parts: string[] = [];
    if (localBlock?.clientFound) {
      parts.push(localBlock.source === "places" ? "Places discovery match (not a ranking)" : `local search sample #${localBlock.clientPosition}`);
    }
    if (organicBlock?.clientFound) {
      parts.push(`organic #${organicBlock.clientPosition} for “${organicBlock.query}”`);
    }
    summary = `Found on Google: ${parts.join(", ")}.`;
  }

  if (businessListing.found && businessListing.reviewCount !== undefined) {
    summary += ` GBP: ${businessListing.rating ?? "?"}★ (${businessListing.reviewCount} reviews).`;
  }

  const measured = blocks.some((b) => b.results.length > 0);
  for (const block of blocks) {
    block.observedAt = new Date().toISOString();
    block.location = block.source === "serpapi" ? location : `Query geography: ${input.zipCode} (Places text search)`;
  }


  return {
    configured: hasSerp || hasPlaces,
    blocks,
    aiOverviews,
    captures,
    businessListing,
    summary: measured
      ? summary
      : errors[0]
        ? `Google measurement failed: ${errors[0]}`
        : "No usable search results returned; visibility remains unmeasured.",
    rawError: errors.length ? errors.join("; ") : undefined,
  };
}

export function googleDeficits(google: GoogleSearchAudit): AuditDeficit[] {
  const deficits: AuditDeficit[] = [];
  // Collector/account failures belong in coverage, never in a prospect's
  // website fix list or as a justification to sell technical SEO.
  if (!google.configured || (google.rawError && !google.blocks.some((b) => b.results.length > 0))) return deficits;

  const local = google.blocks.find((b) => b.type === "local");
  if (local && local.results.length > 0 && !local.clientFound) {
    deficits.push({
      severity: "info",
      finding: `Not matched in the returned ${local.source === "places" ? "Places discovery" : "local search"} sample for "${local.query}".`,
      fix: "Confirm this service and geography matter first. If relevant, 247ROI can review the listing and matching service page; this is not overall ranking evidence.",
      category: "seo",
    });
  }

  if (google.businessListing.found) {
    const reviews = google.businessListing.reviewCount;
    const rating = google.businessListing.rating ?? 0;
    if (reviews !== undefined && reviews < 20) {
      deficits.push({
        severity: "warning",
        finding: `Google Business Profile has only ${reviews} reviews.`,
        fix: "Deploy automated review requests after every job.",
        category: "reputation",
      });
    }
    if (rating > 0 && rating < 4.3) {
      deficits.push({
        severity: "warning",
        finding: `Observed Google listing rating: ${rating}★.`,
        fix: "Review response system + service quality follow-up.",
        category: "reputation",
      });
    }
  } else {
    deficits.push({
      severity: "info",
      finding: "Google Business Profile not matched in the returned search data; existence is unverified.",
      fix: "Confirm listing ownership and local-business eligibility before recommending GBP work.",
      category: "reputation",
    });
  }

  return deficits;
}
