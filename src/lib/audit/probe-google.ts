import { businessNameMentioned } from "./infer-service";
import { inferServiceFromName } from "./infer-service";
import type { GoogleLocalProbe, GoogleLocalResult } from "./types";

function parseSerpLocal(data: Record<string, unknown>): GoogleLocalResult[] {
  const local = (data.local_results as Record<string, unknown>[]) ?? [];
  return local.slice(0, 10).map((item, i) => ({
    position: (item.position as number) ?? i + 1,
    name: String(item.title ?? item.name ?? "Unknown"),
    rating: item.rating as number | undefined,
    reviewCount: item.reviews as number | undefined,
    address: item.address as string | undefined,
    isClient: false,
  }));
}

async function probeViaSerpAPI(
  query: string,
  businessName: string
): Promise<GoogleLocalResult[]> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return [];

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_local");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", key);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return [];

  const data = await res.json();
  return parseSerpLocal(data).map((r) => ({
    ...r,
    isClient: businessNameMentioned(r.name, businessName),
  }));
}

async function probeViaPlaces(
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
        "places.displayName,places.formattedAddress,places.rating,places.userRatingCount",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 10 }),
  });

  if (!res.ok) return [];

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

export async function runGoogleLocalProbe(input: {
  businessName: string;
  zipCode: string;
}): Promise<GoogleLocalProbe> {
  const { servicePhrase } = inferServiceFromName(input.businessName);
  const searchQueries = [
    `${servicePhrase} near ${input.zipCode}`,
    `best ${servicePhrase} ${input.zipCode}`,
    input.businessName,
  ];

  const allResults: { query: string; results: GoogleLocalResult[] }[] = [];

  for (const query of searchQueries) {
    let results = await probeViaSerpAPI(query, input.businessName);
    if (results.length === 0) {
      results = await probeViaPlaces(query, input.businessName);
    }
    allResults.push({ query, results });
  }

  const flat = allResults.flatMap((b) => b.results);
  const clientHits = flat.filter((r) => r.isClient);
  const bestPosition = clientHits.length
    ? Math.min(...clientHits.map((r) => r.position))
    : null;

  const hasApi =
    Boolean(process.env.SERPAPI_KEY) ||
    Boolean(process.env.GOOGLE_PLACES_API_KEY);

  const primaryBlock = allResults.find((b) => b.results.length > 0);

  return {
    searchQueries,
    blocks: allResults,
    primaryResults: primaryBlock?.results ?? [],
    primaryQuery: primaryBlock?.query ?? searchQueries[0],
    clientPosition: bestPosition,
    inMapPack: bestPosition !== null && bestPosition <= 3,
    configured: hasApi,
    summary: !hasApi
      ? "Google local probe not configured — add SERPAPI_KEY or GOOGLE_PLACES_API_KEY"
      : bestPosition === null
        ? `${input.businessName} did not appear in top local results for ${input.zipCode}.`
        : bestPosition <= 3
          ? `Found in local results (position #${bestPosition}) for "${primaryBlock?.query}".`
          : `Found at position #${bestPosition} — outside the top 3 map pack where most clicks go.`,
  };
}
