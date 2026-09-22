import { runAuditPipeline } from "./audit-engine";
import { enrichReportWithLlm } from "./llm-enrich";
import type { AuditReport } from "./types";
import type { AuditContext } from "./audit-context";
import { probeGoogleAIMode } from "./probes/google-ai-mode";
import { probeChatGPT, type ChatGPTEvidence } from "./probes/chatgpt-search";
import type { GoogleAIModeEvidence } from "./probes/google-ai-mode";
import { archivePublicResponse, reservePublicCollection, recordPublicCollection, type CollectionReservation } from "./probes/collection-budget";
import { getProviderPricing } from "./probes/provider-pricing";
import { probeDomainResearch } from "./probes/domain-research";
import { probeSiteReview } from "./probes/site-review";
import { collectAISamples } from "./probes/ai-sampling";
import { collectDirectRanks, type DirectRankOptions, type DirectRankReport } from "./probes/direct-rank";
import { inferServiceContext } from "./service-context";
import { probeSiteCrawl } from "./probes/site-crawl";
import { researchDeficits } from "./research-deficits";
import { measurementCoverage, primaryRecommendation } from "./measurement-coverage";
import { buildAuditAssessment, type AiJudgment, type ReviewedAuthorityEvidence, type ReviewedContentEvidence } from "./assessment";

export interface ExecuteFullAuditInput {
  sessionId: string;
  businessName: string;
  websiteUrl: string;
  zipCode: string;
  mode: "organic" | "rep";
  callbackUrl: string;
  previousReport?: AuditReport | null;
  lead?: { firstName: string; lastName: string; phone: string; email: string };
  /** Validated session context; absent = legacy local. */
  auditContext?: AuditContext | null;
  /**
   * Operator-supplied authorized direct-rank options.
   * Public routes MUST omit this — additional paid collection stays disabled.
   */
  directRankOptions?: DirectRankOptions;
  /** Optional human-reviewed evidence admissions (never arbitrary frontend scores). */
  reviewedContent?: ReviewedContentEvidence[];
  reviewedAuthority?: ReviewedAuthorityEvidence[];
  aiJudgments?: AiJudgment[];
  /**
   * Offline test / operator seam: inject probe adapters. Production public routes omit this.
   * When provided, network probes are skipped in favor of these adapters.
   */
  adapters?: {
    siteCrawl?: typeof probeSiteCrawl;
    siteReview?: typeof probeSiteReview;
    runPipeline?: typeof runAuditPipeline;
    domainResearch?: typeof probeDomainResearch;
    pricing?: typeof getProviderPricing;
    aiSamples?: typeof collectAISamples;
    enrich?: typeof enrichReportWithLlm;
  };
}

export async function executeFullAudit(input: ExecuteFullAuditInput): Promise<AuditReport> {
  const url = input.websiteUrl.startsWith("http") ? input.websiteUrl : `https://${input.websiteUrl}`;
  const target = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  const auditContext = input.auditContext ?? null;
  const crawl = input.adapters?.siteCrawl ?? probeSiteCrawl;
  const pricingFn = input.adapters?.pricing ?? getProviderPricing;
  const reviewFn = input.adapters?.siteReview ?? probeSiteReview;
  const pipelineFn = input.adapters?.runPipeline ?? runAuditPipeline;
  const domainFn = input.adapters?.domainResearch ?? probeDomainResearch;
  const aiFn = input.adapters?.aiSamples ?? collectAISamples;
  const enrichFn = input.adapters?.enrich ?? enrichReportWithLlm;

  const [site, pricing] = await Promise.all([crawl(url), pricingFn()]);
  const serviceContext = inferServiceContext(input.businessName, site);
  const sampleInput = {
    ...input,
    websiteUrl: url,
    servicePhrase: serviceContext.servicePhrase,
    auditContext,
  };
  const labsReservations: CollectionReservation[] = [];
  const domainPromise = (async () => {
    if (input.previousReport?.domainResearch) return input.previousReport.domainResearch;
    const evidence = await domainFn({ target }, {
      quote: pricing ?? undefined,
      captureResponse: (request, raw) => archivePublicResponse(input.sessionId, request.requestKey, raw),
      authorize: async r => {
        const reservation = { sessionId: input.sessionId, kind: r.kind, query: target, requestBody: r.requestBody, upperCostMicros: r.upperCostMicros };
        const allowed = await reservePublicCollection(reservation);
        if (allowed) labsReservations.push(reservation);
        return allowed;
      },
    });
    for (const r of labsReservations) {
      const lane = r.kind === "ranked_keywords" ? evidence.rankedKeywords : evidence.relatedCompetitors;
      await recordPublicCollection(r, { status: lane.state === "observed" ? "observed" : lane.state === "no_data" ? "unmeasured" : "error", ...lane });
    }
    return evidence;
  })();
  const aiPromise = serviceContext.source === "unconfirmed" ? Promise.resolve(undefined) : aiFn(sampleInput, {
    existingReport: input.previousReport?.aiSampling,
    perSampleTimeoutMs: 95000,
    totalTimeoutMs: 150000,
    collectors: {
      googleAIMode: probeGoogleAIMode,
      chatgpt: async (sample, options) => {
        let reservation: CollectionReservation | undefined;
        const evidence = await probeChatGPT(sample, {
          ...options,
          authorize: async r => {
            const allowed = await options.authorize?.(r);
            if (allowed) reservation = { ...r, sessionId: input.sessionId, kind: "chatgpt" };
            return allowed === true;
          },
        });
        if (reservation) await recordPublicCollection(reservation, { status: evidence.state === "observed" ? "observed" : "error", ...evidence });
        return evidence;
      },
    },
    budgetChatGPTQuote: async () =>
      pricing
        ? { quote: pricing.chatGPT, authorize: r => reservePublicCollection({ ...r, sessionId: input.sessionId, kind: "chatgpt" }) }
        : null,
  });

  // Direct-rank: public default is plan-only / unmeasured unless operator options enable collection.
  const directRankPromise: Promise<DirectRankReport> = collectDirectRanks(
    {
      businessName: input.businessName,
      websiteUrl: url,
      zipCode: input.zipCode,
      servicePhrase: serviceContext.servicePhrase,
      auditContext,
    },
    input.directRankOptions ?? {
      enableCollection: false,
      transport: async () => {
        throw new Error("Public direct-rank transport must not be invoked");
      },
      authorize: async () => false,
      existingReport: input.previousReport?.directRank,
    }
  );

  const [baseReport, domainResearch, siteReview, aiSampling, directRank] = await Promise.all([
    pipelineFn({
      businessName: input.businessName,
      websiteUrl: url,
      zipCode: input.zipCode,
      site,
      servicePhrase: serviceContext.servicePhrase,
      auditContext,
    }),
    domainPromise,
    reviewFn({ websiteUrl: url, homepage: site }),
    aiPromise,
    directRankPromise,
  ]);

  const chatGPT = aiSampling?.samples.find(s => s.engine === "chatgpt")?.evidence as ChatGPTEvidence | undefined;
  const googleAIMode = aiSampling?.samples.find(s => s.engine === "google_ai_mode")?.evidence as GoogleAIModeEvidence | undefined;
  const missing = ["Email report delivery"];
  if (domainResearch.rankedKeywords.state !== "observed") missing.push(domainResearch.rankedKeywords.state === "no_data" ? "Keyword database coverage unavailable" : "Existing keyword research");
  if (domainResearch.relatedCompetitors.state !== "observed") missing.push("Search-competitor database coverage");
  if (!aiSampling || aiSampling.summary.available < aiSampling.summary.total) missing.push("Some AI answer samples");
  missing.push(...measurementCoverage(baseReport, siteReview));
  if (baseReport.googleLocal?.rawError && !baseReport.googleLocal.rawError.split("; ").every(e => e.startsWith("google_ai_overview:"))) missing.push("Some live Google search captures");
  const overviews = baseReport.googleLocal?.aiOverviews ?? [];
  if (!overviews.length || overviews.some(s => s.state === "unavailable")) missing.push("Google AI Overview collection");
  if (serviceContext.source === "unconfirmed") missing.push("Confirmed service context");
  if (directRank.publicPaidCollection === "disabled" || directRank.checks.some(c => c.outcome === "not_authorized")) {
    missing.push("Authorized direct buyer-search rank collection (not enabled for public scans)");
  }

  const deficits = researchDeficits(input.businessName, baseReport, domainResearch, siteReview, aiSampling);
  const summary = aiSampling
    ? `ChatGPT: ${aiSampling.byEngine.chatgpt.available}/${aiSampling.byEngine.chatgpt.total} usable answers, ${aiSampling.byEngine.chatgpt.mentions.count} measured brand mentions. Google AI Mode: ${aiSampling.byEngine.google_ai_mode.available}/${aiSampling.byEngine.google_ai_mode.total} usable answers, ${aiSampling.byEngine.google_ai_mode.mentions.count} measured brand mentions. Counts apply only to these buyer questions.`
    : "AI sampling requires a confirmed service category; not proof of brand absence.";

  const draft: AuditReport = {
    ...baseReport,
    serviceContext,
    domainResearch,
    siteReview,
    aiSampling,
    chatGPT,
    googleAIMode,
    auditContext,
    directRank,
    deficits,
    opportunityHeadline: `${input.businessName}: ${domainResearch.rankedKeywords.keywords.length} keyword records, ${siteReview.coverage.inspected} inspected pages and ${aiSampling?.summary.available ?? 0} captured AI answers. Scope and unavailable checks are shown below.`,
    coverage: { status: missing.length ? "partial" : "complete", missing },
    sections: baseReport.sections.map(s =>
      s.key === "ai"
        ? {
            ...s,
            measured: Boolean(aiSampling?.summary.available),
            plainQuestion: "Did AI answers mention or cite your business?",
            summary,
            dataSource: "Consumer ChatGPT via DataForSEO; Google AI Mode via SerpAPI; three shared buyer questions",
            topFix: "Compare retained answers and cited sources, improve demonstrated content/entity gaps, then repeat comparable measurements.",
          }
        : s
    ),
    packages: { ...baseReport.packages, primary: { ...baseReport.packages.primary, priceFrame: "custom", ...primaryRecommendation(deficits) } },
    progressEvents: [
      ...baseReport.progressEvents,
      `Public domain research: ${domainResearch.rankedKeywords.state}; competitors: ${domainResearch.relatedCompetitors.state}.`,
      `Multi-page review: ${siteReview.coverage.inspected} inspected pages.`,
      `AI sampling: ${aiSampling?.summary.available ?? 0} usable answers.`,
      `Direct-rank: ${directRank.publicPaidCollection}; ${directRank.checks.filter(c => c.outcome === "ranked").length} ranked / ${directRank.plan.selected.length} planned (transport calls: ${directRank.transportCalls}).`,
      "Report saved with explicit coverage.",
    ],
  };

  const assessment = buildAuditAssessment({
    report: draft,
    auditContext,
    directRank,
    reviewedContent: input.reviewedContent,
    reviewedAuthority: input.reviewedAuthority,
    aiJudgments: input.aiJudgments,
    businessHost: target,
  });
  draft.assessment = assessment;

  const enriched = await enrichFn({
    businessName: input.businessName,
    websiteUrl: url,
    zipCode: input.zipCode,
    baseReport: draft,
  });

  // Protect measurement fields against LLM enrichment mutation.
  return {
    ...enriched,
    auditContext: draft.auditContext,
    directRank: draft.directRank,
    assessment: draft.assessment,
    aiSampling: draft.aiSampling,
    domainResearch: draft.domainResearch,
    siteReview: draft.siteReview,
    chatGPT: draft.chatGPT,
    googleAIMode: draft.googleAIMode,
    coverage: draft.coverage,
  };
}
