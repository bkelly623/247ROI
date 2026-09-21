import { getSerpApiKey } from "../env";

export interface SerpCapture {
  engine: string;
  query?: string;
  location?: string;
  observedAt: string;
  elapsedMs: number;
  status: "success" | "http_error" | "provider_error" | "timeout" | "network_error" | "invalid_response" | "body_limit" | "not_configured";
  httpStatus?: number;
  providerStatus?: string;
  searchId?: string;
  raw?: unknown;
  error?: string;
  data?: Record<string, unknown>;
}

// Keep provider evidence but never persist authentication or reusable page tokens.
export function redactSerp(value: unknown, key = getSerpApiKey()): unknown {
  if (typeof value === "string") return (key ? value.split(key).join("[REDACTED]") : value)
    .replace(/([?&](?:api_key|page_token)=)[^&\s"]+/g, "$1[REDACTED]")
    .replace(/("(?:api_key|page_token)"\s*:\s*)"(?:\\.|[^"\\])*"/g, '$1"[REDACTED]"');
  if (Array.isArray(value)) return value.map(v => redactSerp(v, key));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, /^(api_key|page_token)$/i.test(k) ? "[REDACTED]" : redactSerp(v, key)]));
  return value;
}

export async function requestSerp(params: Record<string, string>, timeoutMs = 40000): Promise<SerpCapture> {
  const start = Date.now();
  const capture: SerpCapture = { engine: params.engine, query: params.q, location: params.location, observedAt: new Date().toISOString(), elapsedMs: 0, status: "not_configured" };
  const key = getSerpApiKey();
  if (!key) return { ...capture, error: "SERPAPI_KEY not configured" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = new URL("https://serpapi.com/search.json");
  for (const [k, v] of Object.entries({ ...params, api_key: key })) url.searchParams.set(k, v);
  let rawText = "";
  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    capture.httpStatus = res.status;
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    if (reader) while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 2_000_000) { controller.abort(); capture.status = "body_limit"; throw new Error("body_limit"); }
      rawText += decoder.decode(value, { stream: true });
    }
    rawText += decoder.decode();
    capture.raw = redactSerp(rawText, key);
    let data: Record<string, unknown>;
    try { data = JSON.parse(rawText); } catch { capture.status = res.ok ? "invalid_response" : "http_error"; throw new Error("invalid_json"); }
    if (!data || typeof data !== "object" || Array.isArray(data)) { capture.status = "invalid_response"; throw new Error("invalid_shape"); }
    const metadata = data.search_metadata as Record<string, unknown> | undefined;
    capture.providerStatus = typeof metadata?.status === "string" ? metadata.status : undefined;
    capture.searchId = typeof metadata?.id === "string" ? metadata.id : undefined;
    const detail = typeof data.error === "string" ? String(redactSerp(data.error, key)).slice(0, 500) : undefined;
    capture.status = !res.ok ? "http_error" : data.error || (capture.providerStatus && capture.providerStatus !== "Success") ? "provider_error" : "success";
    if (capture.status === "success") capture.data = data;
    else capture.error = `${params.engine}: HTTP ${res.status}${capture.providerStatus ? ` / ${capture.providerStatus}` : ""}${detail ? ` / ${detail}` : ""}`;
  } catch {
    if (capture.status === "not_configured") capture.status = controller.signal.aborted ? "timeout" : "network_error";
    if (rawText) capture.raw = redactSerp(rawText, key);
    capture.error = `${params.engine}: ${capture.status}${capture.httpStatus ? ` (HTTP ${capture.httpStatus})` : ""}${capture.status === "timeout" ? ` after ${timeoutMs}ms` : ""}`;
  } finally { clearTimeout(timer); capture.elapsedMs = Date.now() - start; }
  return capture;
}

// Free catalog lookup: use an exact US ZIP canonical location, never silently
// substitute the provider's most-popular fuzzy location.
export async function resolveSerpLocation(zip: string): Promise<{ location?: string; error?: string }> {
  if (!/^\d{5}$/.test(zip)) return { error: "Invalid US ZIP; geographic sample not sent" };
  try {
    const res = await fetch(`https://serpapi.com/locations.json?q=${encodeURIComponent(zip)}&limit=10`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { error: `Location catalog HTTP ${res.status}; geographic sample not sent` };
    const rows = await res.json();
    const match = Array.isArray(rows) ? rows.find(r => r.country_code === "US" && r.name === zip && typeof r.canonical_name === "string") : undefined;
    return match ? { location: match.canonical_name } : { error: `ZIP ${zip} not matched in SerpAPI location catalog; geographic sample not sent` };
  } catch { return { error: "Location catalog timed out or failed; geographic sample not sent" }; }
}
