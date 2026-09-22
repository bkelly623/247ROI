import { createHash } from "node:crypto";
import type { AuditContext, Geography } from "./audit-context";
import { isLegacyLocalContext } from "./audit-context";

const US_ZIP = /^\d{5}(?:-\d{4})?$/;
const ZIP5 = /^\d{5}$/;

export type GeographyResolution =
  | {
      ok: true;
      geography: Geography | "legacy_local";
      /** Provider location string for SerpAPI / DataForSEO location_name. */
      providerLocation: string;
      /** Natural-language area phrase embedded in buyer query text (no forced ZIP for national). */
      queryAreaPhrase: string;
      /** Dimensions that must appear in cache keys so geography changes never reuse old local evidence. */
      cacheDims: {
        geography: string;
        providerLocation: string;
        zipForLocal: string | null;
        serviceArea: string | null;
      };
      /** When true, local ZIP catalog resolution is required before Google Search geographic samples. */
      requiresZipResolver: boolean;
      zipCode: string | null;
    }
  | { ok: false; error: string };

/**
 * Shared geography resolver: provider location, query wording and cache dimensions travel together.
 * Regional/mixed reject without confirmed service area — never silent national fallback.
 */
export function resolveGeography(input: {
  context?: AuditContext | null;
  zipCode?: string | null;
}): GeographyResolution {
  const zipRaw = (input.zipCode ?? "").trim();
  const context = input.context ?? null;

  if (isLegacyLocalContext(context)) {
    if (!US_ZIP.test(zipRaw)) return { ok: false, error: "A valid US ZIP is required" };
    const zip5 = zipRaw.slice(0, 5);
    const providerLocation = `${zipRaw}, United States`;
    return {
      ok: true,
      geography: "legacy_local",
      providerLocation,
      queryAreaPhrase: `serving ZIP code ${zipRaw} in the United States`,
      cacheDims: {
        geography: "legacy_local",
        providerLocation,
        zipForLocal: zipRaw,
        serviceArea: null,
      },
      requiresZipResolver: true,
      zipCode: zipRaw,
    };
  }

  const geography = context!.geography;

  if (geography === "national") {
    const providerLocation = "United States";
    return {
      ok: true,
      geography: "national",
      providerLocation,
      queryAreaPhrase: "in the United States",
      cacheDims: {
        geography: "national",
        providerLocation,
        zipForLocal: null,
        serviceArea: null,
      },
      requiresZipResolver: false,
      zipCode: ZIP5.test(zipRaw) || US_ZIP.test(zipRaw) ? zipRaw : null,
    };
  }

  if (geography === "local") {
    if (!US_ZIP.test(zipRaw)) return { ok: false, error: "A valid US ZIP is required for local geography" };
    const providerLocation = `${zipRaw}, United States`;
    return {
      ok: true,
      geography: "local",
      providerLocation,
      queryAreaPhrase: `serving ZIP code ${zipRaw} in the United States`,
      cacheDims: {
        geography: "local",
        providerLocation,
        zipForLocal: zipRaw,
        serviceArea: null,
      },
      requiresZipResolver: true,
      zipCode: zipRaw,
    };
  }

  // regional / mixed
  const area = context!.serviceArea?.trim();
  if (!area) {
    return {
      ok: false,
      error: "Regional/mixed geography requires an explicit confirmed service area; refusing silent national fallback",
    };
  }
  const providerLocation = `${area}, United States`;
  return {
    ok: true,
    geography,
    providerLocation,
    queryAreaPhrase: `serving ${area} in the United States`,
    cacheDims: {
      geography,
      providerLocation,
      zipForLocal: US_ZIP.test(zipRaw) ? zipRaw : null,
      serviceArea: area,
    },
    requiresZipResolver: false,
    zipCode: US_ZIP.test(zipRaw) ? zipRaw : null,
  };
}

/** Stable geography digest for sample/cache keys (includes provider location + query area). */
export function geographyCacheKey(dims: {
  geography: string;
  providerLocation: string;
  zipForLocal: string | null;
  serviceArea: string | null;
  queryAreaPhrase: string;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        "geo-v1",
        dims.geography,
        dims.providerLocation,
        dims.zipForLocal,
        dims.serviceArea,
        dims.queryAreaPhrase,
      ])
    )
    .digest("hex");
}

export function zipForSerpResolver(resolution: Extract<GeographyResolution, { ok: true }>): string | null {
  if (!resolution.requiresZipResolver || !resolution.zipCode) return null;
  const zip5 = resolution.zipCode.slice(0, 5);
  return ZIP5.test(zip5) ? zip5 : null;
}
