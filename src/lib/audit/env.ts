/** Resolve API keys from common Vercel env var labels. */

export const ENV_LABELS = {
  pageSpeed: "GOOGLE_PAGESPEED_API_KEY",
  serpApi: "SERPAPI_KEY",
  places: "GOOGLE_PLACES_API_KEY",
} as const;

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function getPageSpeedKey(): string | undefined {
  return firstEnv(
    "GOOGLE_PAGESPEED_API_KEY",
    "PAGESPEED_API_KEY",
    "PAGE_SPEED_API_KEY",
    "GOOGLE_PSI_API_KEY",
    "PSI_API_KEY",
    "PAGESPEED_INSIGHTS_API_KEY"
  );
}

export function getSerpApiKey(): string | undefined {
  return firstEnv(
    "SERPAPI_KEY",
    "SERP_API_KEY",
    "SERPAPI_API_KEY"
  );
}

export function getPlacesKey(): string | undefined {
  return firstEnv(
    "GOOGLE_PLACES_API_KEY",
    "GOOGLE_PLACES_KEY",
    "PLACES_API_KEY"
  );
}
