import { z } from "zod";
import type { AuditContext } from "./audit-context";
import type { AISamplingReport } from "./probes/ai-sampling";
import type { DirectRankReport, DirectRankCheck } from "./probes/direct-rank";
import type { AuditReport } from "./types";
import { detectSocialLinks } from "./social-detect";

export const RUBRIC_VERSION = "seo-v0.1" as const;
export const AI_RUBRIC_VERSION = "ai-v0.1" as const;

export type EvidenceBasis = "observed" | "owner_confirmed" | "unknown";

export interface DimensionCheck {
  id: string;
  label: string;
  score: 0 | 0.5 | 1 | null;
  basis: EvidenceBasis;
  evidenceRefs: string[];
  note?: string;
}

export interface ScoreDimension {
  key: "visibility" | "content" | "technical" | "authority";
  weight: number;
  score: number | null;
  checks: DimensionCheck[];
  incompleteReason?: string;
}

export interface SeoAssessment {
  rubricVersion: typeof RUBRIC_VERSION;
  applicabilityProfile: "local_eligible" | "remote_b2b";
  overall: number | null;
  incomplete: boolean;
  incompleteReason?: string;
  dimensions: ScoreDimension[];
  /** Bound when incomplete: math lower/upper if some dims known — not a flattering point estimate. */
  bounds?: { lower: number; upper: number } | null;
}

export interface AiJudgment {
  sampleKey: string;
  recommended: boolean;
  evidenceRef: string;
  note?: string;
}

export interface AiAssessment {
  rubricVersion: typeof AI_RUBRIC_VERSION;
  overall: number | null;
  incomplete: boolean;
  incompleteReason?: string;
  smallSample: true;
  byEngine: Record<
    "chatgpt" | "google_ai_mode",
    { overall: number | null; recommendations: number; citations: number; usable: number; planned: number }
  >;
  mentions: { count: number; denominator: number };
  citations: { count: number; denominator: number };
  judgmentsUsed: boolean;
}

export interface CompetitorCandidate {
  domain: string;
  status: "observed" | "verified";
  appearances: number;
  sourceUrls: string[];
  note: string;
}

export interface OpportunityCard {
  id: string;
  problem: string;
  evidence: string[];
  kind: "measurement_gap" | "website_defect" | "thin_reputation" | "ai_absence" | "search_content_gap" | "positive_monitor";
  recommendedService: string;
  deliverables: string[];
  confidence: "high" | "medium" | "low";
  effort: "small" | "medium" | "larger";
  /** Never invent forecasts or phantom demand/volume. */
  demandVolume: null;
  offerFit: string;
}

export interface AuditAssessment {
  version: 1;
  seo: SeoAssessment;
  ai: AiAssessment;
  competitors: CompetitorCandidate[];
  opportunities: OpportunityCard[];
  keywordCandidates: { query: string; validatedRecommendation: false }[];
  generatedAt: string;
}

/** Conservative admission — no arbitrary frontend score injection. */
export const ReviewedContentEvidenceSchema = z.object({
  pageUrl: z.string().url().max(2048),
  checkId: z.enum([
    "dedicated_landing",
    "service_customer_geo_fit",
    "buyer_selection_answers",
    "demo_case_evidence",
    "nav_titles",
  ]),
  score: z.union([z.literal(0), z.literal(0.5), z.literal(1)]),
  excerpt: z.string().max(1000),
  reviewer: z.literal("human_review"),
});

export const ReviewedAuthorityEvidenceSchema = z.object({
  itemId: z.enum(["listing_presence", "review_evidence", "case_proof", "independent_mentions"]),
  score: z.union([z.literal(0), z.literal(0.5), z.literal(1)]),
  basis: z.enum(["observed", "owner_confirmed"]),
  sourceUrl: z.string().url().max(2048).optional(),
  note: z.string().max(500),
  reviewer: z.literal("human_review"),
});

export const VerifiedSocialEvidenceSchema = z.object({
  platform: z.enum(["facebook", "instagram", "linkedin", "youtube", "google_business"]),
  profileUrl: z.string().url().max(2048),
  verifiedActive: z.boolean(),
  /** Never infer followers from homepage links alone. */
  followerCount: z.null(),
  reviewer: z.literal("human_review"),
});

export const AiJudgmentSchema = z.object({
  sampleKey: z.string().min(8).max(128),
  recommended: z.boolean(),
  evidenceRef: z.string().min(1).max(500),
  note: z.string().max(500).optional(),
});

export type ReviewedContentEvidence = z.infer<typeof ReviewedContentEvidenceSchema>;
export type ReviewedAuthorityEvidence = z.infer<typeof ReviewedAuthorityEvidenceSchema>;
export type VerifiedSocialEvidence = z.infer<typeof VerifiedSocialEvidenceSchema>;

export function visibilityPointsForRank(position: number | null, outcome: DirectRankCheck["outcome"]): number | null {
  if (outcome === "not_found_top20") return 0;
  if (outcome !== "ranked" || position === null || !Number.isInteger(position) || position < 1) return null;
  if (position === 1) return 100;
  if (position <= 3) return 90;
  if (position <= 5) return 75;
  if (position <= 10) return 50;
  if (position <= 20) return 20;
  return null;
}

function roundHalfUp(value: number): number {
  return Math.round(value);
}

function meanKnown(checks: DimensionCheck[]): number | null {
  const known = checks.filter(c => c.score !== null);
  if (!known.length || known.length < checks.length) return null;
  return (known.reduce((s, c) => s + (c.score as number), 0) / known.length) * 100;
}

function gbpIneligible(context: AuditContext | null | undefined): boolean {
  if (!context) return false;
  if (context.geography === "national") return true;
  return context.ownerAssertions?.gbp?.status === "ineligible";
}

/**
 * Versioned SEO assessment. Unknown required dimensions suppress the total
 * (no zero-fill or renormalization). Technical alone never becomes overall.
 */
export function scoreSeoAssessment(input: {
  report: Pick<AuditReport, "auditMeta" | "siteReview" | "googleLocal" | "socialFindings">;
  directRank?: DirectRankReport | null;
  auditContext?: AuditContext | null;
  reviewedContent?: ReviewedContentEvidence[];
  reviewedAuthority?: ReviewedAuthorityEvidence[];
}): SeoAssessment {
  const context = input.auditContext ?? null;
  const remote = context?.geography === "national" || gbpIneligible(context);
  const profile: SeoAssessment["applicabilityProfile"] = remote ? "remote_b2b" : "local_eligible";

  // Visibility — equal weight across planned direct-rank checks (band points 0–100)
  const planned = input.directRank?.plan.selected.length ?? 0;
  const visibilityChecks: DimensionCheck[] = (input.directRank?.plan.selected ?? []).map((cand, i) => {
    const check = input.directRank?.checks.find(c => c.query === cand.query);
    const points = check ? visibilityPointsForRank(check.position, check.outcome) : null;
    return {
      id: `vis-${i}`,
      label: cand.query,
      // Per-term utility is a 0–100 band; DimensionCheck.score uses 0/0.5/1 only for checklist dims.
      // Store unknown here; aggregate uses band points below.
      score: points === null ? null : points === 0 ? 0 : points >= 75 ? 1 : 0.5,
      basis: points === null ? ("unknown" as const) : ("observed" as const),
      evidenceRefs: check?.sourceIds ?? [],
      note:
        points === null
          ? check
            ? `Outcome ${check.outcome}; visibility unknown`
            : "Not measured"
          : `Bounded visibility points ${points} from position ${check?.position ?? "n/a"} (outcome ${check?.outcome})`,
    };
  });
  let visibilityScore: number | null = null;
  if (planned > 0) {
    const selectedChecks = (input.directRank?.plan.selected ?? []).map(cand =>
      input.directRank?.checks.find(c => c.query === cand.query)
    );
    if (selectedChecks.every(Boolean) && selectedChecks.length === planned) {
      const bands = selectedChecks.map(c => visibilityPointsForRank(c!.position, c!.outcome));
      if (bands.every(b => b !== null)) {
        visibilityScore = roundHalfUp(bands.reduce((s, b) => s + (b as number), 0) / bands.length);
      }
    }
  }

  const visibility: ScoreDimension = {
    key: "visibility",
    weight: 0.4,
    score: visibilityScore,
    checks: visibilityChecks,
    incompleteReason: visibilityScore === null ? "Required buyer-search visibility not fully measured" : undefined,
  };

  // Content — only from reviewed evidence against actual siteReview pages
  const pages = input.report.siteReview?.pages.filter(p => p.status === "observed") ?? [];
  const contentIds = [
    "dedicated_landing",
    "service_customer_geo_fit",
    "buyer_selection_answers",
    "demo_case_evidence",
    "nav_titles",
  ] as const;
  const contentChecks: DimensionCheck[] = contentIds.map(id => {
    const review = (input.reviewedContent ?? []).find(r => r.checkId === id);
    if (!review) {
      return {
        id,
        label: id,
        score: null,
        basis: "unknown",
        evidenceRefs: pages.slice(0, 1).map(p => p.finalUrl ?? p.url),
        note: pages.length
          ? "Page HTML captured; semantic quality pending human review"
          : "No inspected pages for content quality",
      };
    }
    const pageOk = pages.some(p => (p.finalUrl ?? p.url) === review.pageUrl);
    if (!pageOk) {
      return {
        id,
        label: id,
        score: null,
        basis: "unknown",
        evidenceRefs: [review.pageUrl],
        note: "Reviewed URL not in siteReview pages; judgment not admitted",
      };
    }
    return {
      id,
      label: id,
      score: review.score,
      basis: "observed",
      evidenceRefs: [review.pageUrl],
      note: review.excerpt.slice(0, 200),
    };
  });
  const contentScore = meanKnown(contentChecks);
  const content: ScoreDimension = {
    key: "content",
    weight: 0.25,
    score: contentScore === null ? null : roundHalfUp(contentScore),
    checks: contentChecks,
    incompleteReason: contentScore === null ? "Content quality requires reviewed evidence against inspected pages" : undefined,
  };

  // Technical — five categories from existing auditMeta / site review where observed
  const ps = input.report.auditMeta?.pageSpeed;
  const techMeta = input.report.auditMeta?.technical;
  const psOk = input.report.auditMeta?.dataSources.pageSpeed === true && !input.report.auditMeta?.apiErrors?.pageSpeed;
  const technicalChecks: DimensionCheck[] = [
    {
      id: "crawl_directives",
      label: "Crawl/indexing directives",
      score: pages.length && pages.every(p => typeof p.noindex === "boolean")
        ? pages.every(p => p.noindex === false)
          ? 1
          : pages.some(p => p.noindex === true)
            ? 0
            : 0.5
        : null,
      basis: pages.length && pages.every(p => typeof p.noindex === "boolean") ? "observed" : "unknown",
      evidenceRefs: pages.slice(0, 2).map(p => p.finalUrl ?? p.url),
      note: "Absence of noindex is not proof of Google indexation",
    },
    {
      id: "http_availability",
      label: "Important-page HTTP availability",
      score: pages.length ? (pages.every(p => (p.httpStatus ?? 0) >= 200 && (p.httpStatus ?? 0) < 400) ? 1 : 0.5) : null,
      basis: pages.length ? "observed" : "unknown",
      evidenceRefs: pages.slice(0, 2).map(p => p.finalUrl ?? p.url),
    },
    {
      id: "metadata_integrity",
      label: "Metadata/canonical integrity",
      score: pages.length
        ? pages.filter(p => p.title && p.metaDescription && p.canonical).length / pages.length >= 0.8
          ? 1
          : pages.some(p => p.title)
            ? 0.5
            : 0
        : null,
      basis: pages.length ? "observed" : "unknown",
      evidenceRefs: pages.slice(0, 2).map(p => p.finalUrl ?? p.url),
    },
    {
      id: "mobile_performance",
      label: "Mobile usability/performance",
      score: psOk && typeof ps?.performanceScore === "number"
        ? ps.performanceScore >= 90
          ? 1
          : ps.performanceScore >= 50
            ? 0.5
            : 0
        : null,
      basis: psOk && typeof ps?.performanceScore === "number" ? "observed" : "unknown",
      evidenceRefs: ["pagespeed"],
    },
    {
      id: "structured_data",
      label: "JSON-LD parsing/basic required-field checks where used",
      score: typeof techMeta?.schemaBasicValid === "boolean" ? (techMeta.schemaBasicValid ? 1 : 0) : null,
      basis: typeof techMeta?.schemaBasicValid === "boolean" ? "observed" : "unknown",
      evidenceRefs: ["technical"],
      note: "Missing optional schema is not an automatic failure",
    },
  ];
  const technicalScore = meanKnown(technicalChecks);
  const technical: ScoreDimension = {
    key: "technical",
    weight: 0.15,
    score: technicalScore === null ? null : roundHalfUp(technicalScore),
    checks: technicalChecks,
    incompleteReason: technicalScore === null ? "Technical checks incomplete" : undefined,
  };

  // Authority
  const ownerReviews = context?.ownerAssertions?.reviews;
  const ownerGbp = context?.ownerAssertions?.gbp;
  const gbpFound = input.report.auditMeta?.gbp?.found === true;
  const authorityItems: DimensionCheck[] = remote
    ? [
        {
          id: "review_evidence",
          label: "Independent customer/reputation evidence",
          score:
            ownerReviews?.status === "none"
              ? 0
              : ownerReviews?.status === "has_reviews"
                ? 1
                : null,
          basis: ownerReviews ? "owner_confirmed" : "unknown",
          evidenceRefs: ownerReviews ? ["owner_assertion:reviews"] : [],
          note: ownerReviews?.status === "none" ? "Owner-confirmed no reviews (this item only)" : undefined,
        },
        {
          id: "case_proof",
          label: "Substantive attributable case proof",
          score: (input.reviewedAuthority ?? []).find(a => a.itemId === "case_proof")?.score ?? null,
          basis: (input.reviewedAuthority ?? []).find(a => a.itemId === "case_proof") ? "observed" : "unknown",
          evidenceRefs: [],
        },
        {
          id: "independent_mentions",
          label: "Independent mentions/citations/credentials",
          score: (input.reviewedAuthority ?? []).find(a => a.itemId === "independent_mentions")?.score ?? null,
          basis: (input.reviewedAuthority ?? []).find(a => a.itemId === "independent_mentions") ? "observed" : "unknown",
          evidenceRefs: [],
        },
      ]
    : [
        {
          id: "listing_presence",
          label: "Verified business listing/presence",
          score:
            ownerGbp?.status === "none"
              ? 0
              : ownerGbp?.status === "has_listing" || gbpFound
                ? ownerGbp?.status === "has_listing" || input.report.auditMeta?.gbp?.found
                  ? 1
                  : 0.5
                : ownerGbp?.status === "ineligible"
                  ? null
                  : null,
          basis: ownerGbp ? "owner_confirmed" : gbpFound ? "observed" : "unknown",
          evidenceRefs: ownerGbp ? ["owner_assertion:gbp"] : [],
          note: ownerGbp?.status === "ineligible" ? "GBP ineligible — not penalized" : undefined,
        },
        {
          id: "review_evidence",
          label: "Independent customer/review evidence",
          score:
            ownerReviews?.status === "none"
              ? 0
              : ownerReviews?.status === "has_reviews"
                ? 1
                : typeof input.report.auditMeta?.gbp?.reviewCount === "number"
                  ? input.report.auditMeta.gbp.reviewCount > 0
                    ? 1
                    : 0
                  : null,
          basis: ownerReviews ? "owner_confirmed" : typeof input.report.auditMeta?.gbp?.reviewCount === "number" ? "observed" : "unknown",
          evidenceRefs: ownerReviews ? ["owner_assertion:reviews"] : [],
          note: ownerReviews?.status === "none" ? "Owner-confirmed no reviews informs this item only" : undefined,
        },
        {
          id: "case_proof",
          label: "Case proof and corroboration",
          score: (input.reviewedAuthority ?? []).find(a => a.itemId === "case_proof")?.score ?? null,
          basis: (input.reviewedAuthority ?? []).find(a => a.itemId === "case_proof") ? "observed" : "unknown",
          evidenceRefs: [],
        },
      ];

  // Filter ineligible listing from remote/ineligible profiles
  const authorityChecks = authorityItems.filter(c => !(c.id === "listing_presence" && (remote || ownerGbp?.status === "ineligible")));
  const authorityScore = meanKnown(authorityChecks);
  const authority: ScoreDimension = {
    key: "authority",
    weight: 0.2,
    score: authorityScore === null ? null : roundHalfUp(authorityScore),
    checks: authorityChecks,
    incompleteReason: authorityScore === null ? "Authority/public proof incomplete" : undefined,
  };

  const dimensions = [visibility, content, technical, authority];
  const known = dimensions.filter(d => d.score !== null);
  const incomplete = known.length < dimensions.length;
  let overall: number | null = null;
  let bounds: SeoAssessment["bounds"] = null;
  if (!incomplete) {
    overall = roundHalfUp(
      0.4 * (visibility.score as number) +
        0.25 * (content.score as number) +
        0.15 * (technical.score as number) +
        0.2 * (authority.score as number)
    );
  } else if (known.length) {
    // Mathematical lower/upper with unknowns as 0..100 — not published as the score
    const lower = roundHalfUp(
      dimensions.reduce((s, d) => s + d.weight * (d.score ?? 0), 0)
    );
    const upper = roundHalfUp(
      dimensions.reduce((s, d) => s + d.weight * (d.score ?? 100), 0)
    );
    bounds = { lower, upper };
  }

  // Technical alone never becomes overall (already enforced by incomplete when others unknown)
  if (known.length === 1 && known[0].key === "technical") {
    overall = null;
  }

  return {
    rubricVersion: RUBRIC_VERSION,
    applicabilityProfile: profile,
    overall,
    incomplete: overall === null,
    incompleteReason: overall === null ? "Overall assessment incomplete — required dimensions unresolved" : undefined,
    dimensions,
    bounds,
  };
}

/**
 * AI score requires recommendation judgments, not incidental substring mentions.
 * Formula when fully known: 60 * recommendation fraction + 40 * own-domain citation fraction.
 */
export function scoreAiAssessment(input: {
  aiSampling?: AISamplingReport | null;
  judgments?: AiJudgment[];
}): AiAssessment {
  const sampling = input.aiSampling;
  const planned = 6;
  const emptyEngine = { overall: null, recommendations: 0, citations: 0, usable: 0, planned: 3 };
  if (!sampling) {
    return {
      rubricVersion: AI_RUBRIC_VERSION,
      overall: null,
      incomplete: true,
      incompleteReason: "AI sampling not available",
      smallSample: true,
      byEngine: { chatgpt: emptyEngine, google_ai_mode: emptyEngine },
      mentions: { count: 0, denominator: 0 },
      citations: { count: 0, denominator: 0 },
      judgmentsUsed: false,
    };
  }

  const usable = sampling.samples.filter(
    (s,i,all) => all.findIndex(other => other.key === s.key) === i && s.evidence.state === "observed" && !s.evidence.error && s.evidence.answer?.trim() && s.evidence.query === s.query
  );
  const mentions = {count:usable.filter(s => s.evidence.mentioned === true).length,denominator:usable.length};
  const citations = {count:usable.filter(s => s.evidence.cited === true).length,denominator:usable.length};
  const balancedCoverage = usable.filter(s => s.engine === "chatgpt").length === 3 && usable.filter(s => s.engine === "google_ai_mode").length === 3;
  const judgmentMap = new Map((input.judgments ?? []).map(j => [j.sampleKey, j]));
  const hasJudgments = usable.length > 0 && usable.every(s => judgmentMap.has(s.key));

  function engineScore(engine: "chatgpt" | "google_ai_mode") {
    const samples = usable.filter(s => s.engine === engine);
    const plannedEngine = 3;
    if (samples.length !== plannedEngine) {
      return { overall: null as number | null, recommendations: 0, citations: samples.filter(s => s.evidence.cited === true).length, usable: samples.length, planned: plannedEngine };
    }
    if (!samples.every(s => judgmentMap.has(s.key))) {
      // Legacy: allow 0 only when every sample is valid non-mention AND cited is boolean false/true known
      const allNonMention = samples.every(s => s.evidence.mentioned === false && typeof s.evidence.cited === "boolean");
      if (allNonMention && !hasJudgments) {
        const citeFrac = samples.filter(s => s.evidence.cited === true).length / samples.length;
        return {
          overall: roundHalfUp(60 * 0 + 40 * citeFrac),
          recommendations: 0,
          citations: samples.filter(s => s.evidence.cited === true).length,
          usable: samples.length,
          planned: plannedEngine,
        };
      }
      return { overall: null, recommendations: 0, citations: samples.filter(s => s.evidence.cited === true).length, usable: samples.length, planned: plannedEngine };
    }
    const recs = samples.filter(s => judgmentMap.get(s.key)!.recommended).length;
    const cites = samples.filter(s => s.evidence.cited === true).length;
    return {
      overall: roundHalfUp(60 * (recs / samples.length) + 40 * (cites / samples.length)),
      recommendations: recs,
      citations: cites,
      usable: samples.length,
      planned: plannedEngine,
    };
  }

  const chatgpt = engineScore("chatgpt");
  const google = engineScore("google_ai_mode");
  let overall: number | null = null;
  let incomplete = true;
  let incompleteReason: string | undefined = "Pending recommendation judgments or incomplete sample coverage";
  let judgmentsUsed = false;

  if (balancedCoverage && usable.length === planned && hasJudgments) {
    const recs = usable.filter(s => judgmentMap.get(s.key)!.recommended).length;
    const cites = usable.filter(s => s.evidence.cited === true).length;
    overall = roundHalfUp(60 * (recs / usable.length) + 40 * (cites / usable.length));
    incomplete = false;
    incompleteReason = undefined;
    judgmentsUsed = true;
  } else if (
    balancedCoverage && usable.length === planned &&
    usable.every(s => s.evidence.mentioned === false && typeof s.evidence.cited === "boolean") &&
    (input.judgments ?? []).length === 0
  ) {
    // Legacy zero when exact valid nonmention evidence justifies — never manufacture recommendation flags
    const citeFrac = usable.filter(s => s.evidence.cited === true).length / usable.length;
    overall = roundHalfUp(40 * citeFrac);
    incomplete = false;
    incompleteReason = undefined;
    judgmentsUsed = false;
  }

  return {
    rubricVersion: AI_RUBRIC_VERSION,
    overall,
    incomplete,
    incompleteReason,
    smallSample: true,
    byEngine: { chatgpt, google_ai_mode: google },
    mentions: { count: mentions.count, denominator: mentions.denominator },
    citations: { count: citations.count, denominator: citations.denominator },
    judgmentsUsed,
  };
}

export function deriveCompetitorCandidates(input: {
  aiSampling?: AISamplingReport | null;
  directRank?: DirectRankReport | null;
  businessHost: string;
}): CompetitorCandidate[] {
  const counts = new Map<string, { urls: Set<string>; appearances: number }>();
  for (const sample of input.aiSampling?.samples ?? []) {
    if (sample.evidence.state !== "observed" || sample.evidence.error) continue;
    const seenInSample = new Set<string>();
    for (const c of sample.evidence.citations ?? []) {
      try {
        const host = new URL(c.url).hostname.toLowerCase().replace(/^www\./, "");
        if (!host || host === input.businessHost.replace(/^www\./, "")) continue;
        const row = counts.get(host) ?? { urls: new Set<string>(), appearances: 0 };
        if (!seenInSample.has(host)) row.appearances++;
        seenInSample.add(host);
        row.urls.add(c.url);
        counts.set(host, row);
      } catch { /* ignore */ }
    }
  }
  for (const check of input.directRank?.checks ?? []) {
    if (!["ranked", "not_found_top20"].includes(check.outcome)) continue;
    const seenInCheck = new Set<string>();
    for (const hit of check.hits) {
      if (hit.isTarget || !hit.hostname) continue;
      const row = counts.get(hit.hostname) ?? { urls: new Set<string>(), appearances: 0 };
      if (!seenInCheck.has(hit.hostname)) row.appearances++;
      seenInCheck.add(hit.hostname);
      if (hit.url) row.urls.add(hit.url);
      counts.set(hit.hostname, row);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].appearances - a[1].appearances)
    .slice(0, 5)
    .map(([domain, data]) => ({
      domain,
      status: "observed" as const,
      appearances: data.appearances,
      sourceUrls: [...data.urls].slice(0, 5),
      note: "Observed in retained search/AI source URLs; not verified as a same-scope business competitor",
    }));
}

export function deriveOpportunities(input: {
  seo: SeoAssessment;
  ai: AiAssessment;
  auditContext?: AuditContext | null;
  directRank?: DirectRankReport | null;
  socialLinkDetectionOnly?: boolean;
}): OpportunityCard[] {
  const cards: OpportunityCard[] = [];
  const ctx = input.auditContext;

  if (input.seo.incomplete && input.seo.dimensions.find(d => d.key === "visibility")?.score === null) {
    cards.push({
      id: "measurement-visibility",
      problem: "Relevant organic buyer-search positions are not fully measured",
      evidence: ["seo.visibility incomplete"],
      kind: "measurement_gap",
      recommendedService: "Targeted SEO research and measured improvement plan",
      deliverables: ["Authorized direct-rank collection for confirmed buyer queries", "Same-scope competitor verification", "Repeat measurement"],
      confidence: "high",
      effort: "medium",
      demandVolume: null,
      offerFit: "247ROI can scope measurement and content/SEO work for the confirmed services — not an automatic website rebuild",
    });
  }

  const techCritical = input.seo.dimensions
    .find(d => d.key === "technical")
    ?.checks.some(c => c.score === 0 && c.basis === "observed");
  if (techCritical) {
    cards.push({
      id: "website-technical",
      problem: "Observed technical/accessibility defect on important pages",
      evidence: ["seo.technical observed failure"],
      kind: "website_defect",
      recommendedService: "Technical website fixes",
      deliverables: ["Fix indexing/availability/metadata issues with evidence", "Re-check Lighthouse and page fetch"],
      confidence: "high",
      effort: "small",
      demandVolume: null,
      offerFit: "Targeted fix plan; rebuild is not required by this finding",
    });
  }

  if (ctx?.ownerAssertions?.reviews?.status === "none") {
    cards.push({
      id: "thin-reputation",
      problem: "Owner-confirmed absence of public reviews (thin proof, not bad reputation)",
      evidence: ["owner_assertion:reviews=none"],
      kind: "thin_reputation",
      recommendedService: "Review-request and case-study workflow",
      deliverables: ["Review request automation respecting platform rules", "Attributable case-study workflow"],
      confidence: "high",
      effort: "medium",
      demandVolume: null,
      offerFit: "Proof-building for the confirmed review gap only — does not imply all authority dimensions are absent",
    });
  }

  if (input.ai.overall === 0 || (input.ai.mentions.denominator >= 6 && input.ai.mentions.count === 0 && !input.ai.incomplete)) {
    cards.push({
      id: "ai-absence",
      problem: "No qualifying AI recommendation appearances in this small-sample snapshot",
      evidence: [`ai.mentions ${input.ai.mentions.count}/${input.ai.mentions.denominator}`],
      kind: "ai_absence",
      recommendedService: "AI visibility + search/content/authority engagement with repeat measurement",
      deliverables: ["Improve demonstrated content/entity gaps", "Repeat comparable buyer questions", "Never guarantee citations"],
      confidence: "medium",
      effort: "larger",
      demandVolume: null,
      offerFit: "247ROI AI visibility work fits when content/identity gaps are also evidenced",
    });
  }

  if (input.socialLinkDetectionOnly) {
    // Homepage link detection alone is not a posting-service pitch
  }

  if (!cards.length && input.seo.overall !== null && input.seo.overall >= 70) {
    cards.push({
      id: "positive-monitor",
      problem: "No substantial evidenced acquisition gap in current scope",
      evidence: [`seo.overall ${input.seo.overall}`],
      kind: "positive_monitor",
      recommendedService: "Optional monitoring / discovery",
      deliverables: ["Periodic comparable measurement", "Opportunity discovery without manufactured crisis"],
      confidence: "medium",
      effort: "small",
      demandVolume: null,
      offerFit: "Honest positive verdict — no forced rebuild pitch",
    });
  }

  return cards.slice(0, 3);
}

export function buildAuditAssessment(input: {
  report: AuditReport;
  auditContext?: AuditContext | null;
  directRank?: DirectRankReport | null;
  reviewedContent?: ReviewedContentEvidence[];
  reviewedAuthority?: ReviewedAuthorityEvidence[];
  aiJudgments?: AiJudgment[];
  businessHost: string;
}): AuditAssessment {
  const seo = scoreSeoAssessment({
    report: input.report,
    directRank: input.directRank,
    auditContext: input.auditContext,
    reviewedContent: input.reviewedContent,
    reviewedAuthority: input.reviewedAuthority,
  });
  const ai = scoreAiAssessment({
    aiSampling: input.report.aiSampling,
    judgments: input.aiJudgments,
  });
  const competitors = deriveCompetitorCandidates({
    aiSampling: input.report.aiSampling,
    directRank: input.directRank,
    businessHost: input.businessHost,
  });
  const opportunities = deriveOpportunities({
    seo,
    ai,
    auditContext: input.auditContext,
    directRank: input.directRank,
    socialLinkDetectionOnly: true,
  });
  const keywordCandidates = (input.directRank?.plan.candidates ?? []).map(c => ({
    query: c.query,
    validatedRecommendation: false as const,
  }));

  return {
    version: 1,
    seo,
    ai,
    competitors,
    opportunities,
    keywordCandidates,
    generatedAt: new Date().toISOString(),
  };
}

/** Social links remain link detection unless verified profile evidence is supplied. */
export function socialAssessmentNote(
  html: string | undefined,
  verified?: VerifiedSocialEvidence[]
): { detected: string[]; verifiedActive: string[]; note: string } {
  if (!html) return { detected: [], verifiedActive: [], note: "Homepage not available for link detection" };
  const social = detectSocialLinks(html);
  const detected = (
    [
      social.hasFacebook && "Facebook",
      social.hasInstagram && "Instagram",
      social.hasLinkedIn && "LinkedIn",
      social.hasYouTube && "YouTube",
      social.hasGoogleBusiness && "Google Business",
    ] as const
  ).filter(Boolean) as string[];
  const verifiedActive = (verified ?? []).filter(v => v.verifiedActive).map(v => v.platform);
  return {
    detected,
    verifiedActive,
    note: "Homepage link detection only unless verified profile evidence is supplied; activity/followers are never inferred from links",
  };
}
