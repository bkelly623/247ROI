import type { AuditReport } from "./types";

type RankCheck = NonNullable<AuditReport["directRank"]>["checks"][number];
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 2 && !["the", "for", "and", "with", "services", "development"].includes(w));
export function safePagePath(url: string): string { try { return new URL(url).pathname; } catch { return ""; } }
const ranked = (c: RankCheck) => c.outcome === "ranked" && Number.isInteger(c.position) && c.position! > 0;
const usable = (c: RankCheck) => ranked(c) || (["not_found_top20", "unknown_incomplete"].includes(c.outcome) && c.hits.some(h => Number.isInteger(h.position) && h.position > 0));

export function rankLabel(c: RankCheck): string {
  if (ranked(c)) return `#${c.position}`;
  if (!usable(c)) return "Not measured";
  return `Not found · ${c.hits.filter(h => Number.isInteger(h.position) && h.position > 0).length} results checked`;
}
/** Deterministic editorial shortlist, not demand validation or a ranking forecast. */
export function buildVisualBrief(report: AuditReport) {
  const pages = (report.siteReview?.pages ?? []).filter(p => p.status === "observed");
  const checks = report.directRank?.checks ?? [];
  const measured = checks.filter(usable);
  const candidates = (report.directRank?.plan.candidates ?? []).filter(c => c.intent === "service_provider");
  const options = candidates.map(candidate => {
    const terms = words(candidate.query);
    const matches = pages.map(page => {
      const text = words(`${page.title ?? ""} ${safePagePath(page.url).replace(/-/g, " ")}`);
      return { page, overlap: terms.filter(w => text.includes(w)).length / Math.max(terms.length, 1) };
    }).sort((a,b) => b.overlap-a.overlap);
    const support = matches[0]?.overlap >= 0.5 ? matches[0].page : undefined;
    const check = checks.find(c => c.query === candidate.query);
    const rivals = check && usable(check) ? check?.hits.filter(h => !h.isTarget && h.position > 0 && h.position <= 5) ?? [] : [];
    const score = (support ? 10 : 0) + (matches[0]?.overlap ?? 0) + (rivals.length ? 1 : 0);
    return { query: candidate.query, support, check, rivals, score, basis: candidate.source };
  }).sort((a,b) => b.score-a.score || a.query.localeCompare(b.query));
  const opportunities = options.filter(o => o.support && o.check && usable(o.check)).slice(0,3);
  const broader = options.find(o => !o.support) ?? options.find(o => !opportunities.some(chosen => chosen.query === o.query));
  const samples = report.aiSampling?.samples ?? [];
  const ai = samples.filter(s => s.evidence.state === "observed" && !s.evidence.error && typeof s.evidence.mentioned === "boolean");
  const questions = [...new Set(samples.map(s => s.query))].map(query => ({ query, samples: samples.filter(s => s.query === query) }));
  return {
    pages, checks, opportunities, questions,
    broader,
    seoStanding: measured.length ? `${measured.filter(ranked).length} / ${measured.length} searches` : "Not measured",
    seoDetail: measured.length ? "Buyer searches where your site appeared in the saved checks." : "No usable buyer-search positions saved.",
    aiStanding: ai.length ? `${ai.filter(s => s.evidence.mentioned).length} / ${ai.length} answers` : "Not measured",
    citations: ai.filter(s => typeof s.evidence.cited === "boolean"),
    aiUsable: ai,
  };
}
