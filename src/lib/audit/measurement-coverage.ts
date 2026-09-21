import type { AuditReport, AuditDeficit } from "./types";
import type { SiteReviewResult } from "./probes/site-review";

export function measurementCoverage(base: AuditReport, site: SiteReviewResult): string[] {
  const missing: string[] = [];
  if (!base.auditMeta?.dataSources.pageSpeed) missing.push("Mobile PageSpeed measurement unavailable; performance is unmeasured, not a website defect");
  if (!site.coverage.inspected) missing.push("Multi-page website inspection");
  else {
    if (site.coverage.inspected < site.coverage.attempted || site.errors.length > 0) missing.push("Some website page checks unavailable; see collection errors");
    if (site.status === "partial" && site.discoveries.some(d => !site.pages.some(p => p.url === d.url && p.status === "observed"))) missing.push("Bounded website sample; not all discovered pages were inspected");
  }
  return missing;
}

export function primaryRecommendation(deficits: AuditDeficit[]) {
  return {
    headline: deficits.some(d => d.category === "seo" && d.severity !== "info") ? "Technical SEO & Website Fix Plan" : "Visibility & Measurement Review",
    description: deficits[0] ? `Start with: ${deficits[0].finding} ${deficits[0].fix} 247ROI can scope the specific work; this audit does not require a rebuild.` : "Review your ranking pages, sampled AI sources and collection coverage before selecting an improvement project.",
  };
}
