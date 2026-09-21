import type { AuditReport } from './types';

/** Present retained measurements; never derive a ranking/AI score from missing data. */
export function seoOverview(report: AuditReport) {
  const ps = report.auditMeta?.pageSpeed;
  const measured = report.auditMeta?.dataSources.pageSpeed === true && !report.auditMeta?.apiErrors?.pageSpeed;
  const validScore = (value: unknown): number | null => measured && typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
  const pages = report.siteReview?.pages.filter(p => p.status === 'observed') ?? [];
  const checks = [
    { label: 'Page titles present', passed: pages.filter(p => Boolean(p.title?.trim())).length },
    { label: 'Meta descriptions present', passed: pages.filter(p => Boolean(p.metaDescription?.trim())).length },
    { label: 'Primary H1 present', passed: pages.filter(p => p.headings?.some(h => h.level === 1 && h.text.trim())).length },
    { label: 'Canonical link present', passed: pages.filter(p => Boolean(p.canonical)).length },
  ];
  return {
    score: validScore(ps?.seoScore), performance: validScore(ps?.performanceScore),
    pages, checks, fixes: report.deficits.filter(d => d.category === 'seo').slice(0, 4),
    noindex: pages.filter(p => p.noindex === true).length,
    unknownIndexability: pages.filter(p => p.noindex === null).length,
    brokenLinks: report.siteReview?.brokenLinks?.length ?? null,
  };
}
