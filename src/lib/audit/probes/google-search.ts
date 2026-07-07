import { businessNameMentioned } from "../infer-service";
import type { AuditDeficit, GoogleLocalResult } from "../types";

export interface GoogleSearchBlock {
  query: string;
  type: "local" | "organic";
  results: GoogleLocalResult[];
  clientFound: boolean;
  clientPosition: number | null;
}

export interface GoogleSearchAudit {
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
  const local = (data.local_results as Record<string, unknown>[]) ?? [];
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
    const isClient =
      businessNameMentioned(title, businessName) ||
      (websiteHost && link.includes(websiteHost));
    return {
      position: (item.position as number) ?? i + 1,
      name: title,
      address: link,
      isClient,
    };
  });
}

async function serpSearch(
  engine: "google_local" | "google",
  query: string
): Promise<Record<string, unknown> | null> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", engine);
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", key);
  if (engine === "google") {
    url.searchParams.set("location", "United States");
  }

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  return res.json();
}

async function placesSearch(
  query: string,
  businessName: string
): Promise<GoogleLocalResult[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return [];

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
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

  const hasSerp = Boolean(process.env.SERPAPI_KEY);
  const hasPlaces = Boolean(process.env.GOOGLE_PLACES_API_KEY);

  if (!hasSerp && !hasPlaces) {
    return {
      configured: false,
      blocks: [],
      businessListing: { found: false },
      summary: "Google search not measured — add SERPAPI_KEY or GOOGLE_PLACES_API_KEY.",
      rawError: "No Google search API configured",
    };
  }

  const blocks: GoogleSearchBlock[] = [];

  if (hasSerp) {
    const localData = await serpSearch("google_local", queries.local);
    if (localData) {
      const results = parseLocal(localData, input.businessName);
      const hit = results.find((r) => r.isClient);
      blocks.push({
        query: queries.local,
        type: "local",
        results,
        clientFound: Boolean(hit),
        clientPosition: hit?.position ?? null,
      });
    }

    const organicData = await serpSearch("google", queries.organic);
    if (organicData) {
      const results = parseOrganic(organicData, input.businessName, host);
      const hit = results.find((r) => r.isClient);
      blocks.push({
        query: queries.organic,
        type: "organic",
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
      results,
      clientFound: Boolean(hit),
      clientPosition: hit?.position ?? null,
    });
  }

  let businessListing: GoogleSearchAudit["businessListing"] = { found: false };

  if (hasSerp) {
    const brandData = await serpSearch("google", queries.branded);
    const kg = brandData?.knowledge_graph as Record<string, unknown> | undefined;
    const local = brandData?.local_results as Record<string, unknown>[] | undefined;

    if (kg) {
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
  const organicBlock = blocks.find((b) => b.type === "organic");

  let summary = "";
  if (!localBlock?.clientFound && !organicBlock?.clientFound) {
    summary = `${input.businessName} not found in measured Google local or organic results.`;
  } else {
    const parts: string[] = [];
    if (localBlock?.clientFound) {
      parts.push(`local pack #${localBlock.clientPosition}`);
    }
    if (organicBlock?.clientFound) {
      parts.push(`organic #${organicBlock.clientPosition}`);
    }
    summary = `Found on Google: ${parts.join(", ")}.`;
  }

  if (businessListing.found && businessListing.reviewCount !== undefined) {
    summary += ` GBP: ${businessListing.rating ?? "?"}★ (${businessListing.reviewCount} reviews).`;
  }

  return {
    configured: true,
    blocks,
    businessListing,
    summary,
  };
}

export function googleDeficits(google: GoogleSearchAudit): AuditDeficit[] {
  const deficits: AuditDeficit[] = [];
  if (!google.configured) {
    deficits.push({
      severity: "warning",
      finding: google.summary,
      fix: "Add SERPAPI_KEY to measure real Google rankings.",
      category: "seo",
    });
    return deficits;
  }

  const local = google.blocks.find((b) => b.type === "local");
  if (local && !local.clientFound) {
    deficits.push({
      severity: "critical",
      finding: `Not in Google local results for "${local.query}".`,
      fix: "Optimize GBP, local pages, and citations (Growth / AI Visibility program).",
      category: "seo",
    });
  }

  if (google.businessListing.found) {
    const reviews = google.businessListing.reviewCount ?? 0;
    const rating = google.businessListing.rating ?? 0;
    if (reviews < 20) {
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
        finding: `Google rating is ${rating}★ — below trust threshold for premium jobs.`,
        fix: "Review response system + service quality follow-up.",
        category: "reputation",
      });
    }
  } else {
    deficits.push({
      severity: "critical",
      finding: "Google Business Profile not matched in search data.",
      fix: "Claim and optimize GBP; ensure NAP matches website.",
      category: "reputation",
    });
  }

  return deficits;
}
