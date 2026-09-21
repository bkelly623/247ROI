export type SearchQueryEvidence = { query: string; page?: string; clicks: number; impressions: number; ctr: number; position: number };
export type SearchConsoleEvidence = {
  state: "observed" | "not_connected" | "unavailable";
  source: "Google Search Console";
  property?: string;
  startDate?: string;
  endDate?: string;
  observedAt: string;
  clicks?: number;
  impressions?: number;
  queries: SearchQueryEvidence[];
  opportunities: Array<SearchQueryEvidence & { action: string; rationale: string }>;
};
const endpoint = "https://247-ops-dashboard.vercel.app/api/search-console/performance?days=28";
// Existing owner-authorized property only. Never substitute our data for a prospect.
export async function probeSearchConsole(websiteUrl: string): Promise<SearchConsoleEvidence> {
  const base: SearchConsoleEvidence = { state: "not_connected", source: "Google Search Console", observedAt: new Date().toISOString(), queries: [], opportunities: [] };
  let host: string;
  try { host = new URL(websiteUrl).hostname.toLowerCase().replace(/^www\./, ""); } catch { return base; }
  if (host !== "get247roi.com") return base;
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000), cache: "no-store" });
    if (!response.ok) return { ...base, state: "unavailable" };
    return parseSearchConsole(await response.json(), base.observedAt);
  } catch { return { ...base, state: "unavailable" }; }
}
export function parseSearchConsole(value: unknown, observedAt = new Date().toISOString()): SearchConsoleEvidence {
  const base: SearchConsoleEvidence = { state: "unavailable", source: "Google Search Console", observedAt, queries: [], opportunities: [] };
  if (!value || typeof value !== "object") return base;
  const d = value as Record<string, unknown>;
  if (d.siteUrl !== "sc-domain:get247roi.com" || typeof d.startDate !== "string" || typeof d.endDate !== "string" || !Array.isArray(d.queries)) return base;
  const number = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;
  const rows = Array.isArray(d.queryPages) && d.queryPages.length ? d.queryPages : d.queries;
  const queries: SearchQueryEvidence[] = rows.flatMap((raw: unknown) => {
    if (!raw || typeof raw !== "object") return [];
    const r = raw as Record<string, unknown>;
    if (!Array.isArray(r.keys) || typeof r.keys[0] !== "string" || !number(r.clicks) || !number(r.impressions) || !number(r.ctr) || !number(r.position)) return [];
    let page: string | undefined;
    if (typeof r.keys[1] === "string") {
      try { const u = new URL(r.keys[1]); if (u.hostname.replace(/^www\./, "") === "get247roi.com" && u.protocol === "https:") page = u.href; } catch { /* omit invalid page */ }
    }
    return [{ query: r.keys[0], page, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }];
  });
  const opportunities = [...queries].filter(r => r.impressions >= 3).sort((a,b) => {
    const near = (r: SearchQueryEvidence) => r.position > 3 && r.position <= 20 ? 1 : 0;
    return near(b)-near(a) || b.impressions-a.impressions;
  }).slice(0,3).map(r => ({ ...r,
    action: r.position <= 20 ? "Review the matched page’s search intent, title and description; strengthen useful content and internal links." : "Confirm this query is a core service, then improve the matched page’s relevance, depth and supporting links.",
    rationale: `${r.impressions} recorded impressions, ${r.clicks} clicks, average position ${r.position.toFixed(1)} in this reporting window. ${r.impressions < 100 ? "Small sample: validate relevance and collect more data before prioritizing spend." : "Prioritized by observed impressions and position, not predicted traffic lift."}`,
  }));
  return { ...base, state: "observed", property: d.siteUrl, startDate:d.startDate, endDate:d.endDate, clicks:number(d.clicks)?d.clicks:undefined, impressions:number(d.impressions)?d.impressions:undefined, queries, opportunities };
}
