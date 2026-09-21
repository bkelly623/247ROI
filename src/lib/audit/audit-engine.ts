import type {
  AuditDeficit,
  AuditReport,
  AuditSection,
  GoogleLocalProbe,
  PackageRecommendation,
  SiteAnnotation,
} from "./types";
import { BRAND } from "./config";
import { GROWTH_TIERS } from "./industry-stats";
import { inferServiceFromName } from "./infer-service";
import {
  detectSocialLinks,
} from "./social-detect";
import { probePageSpeed, pageSpeedDeficits } from "./probes/pagespeed";
import {
  probeGoogleSearch,
  googleDeficits,
} from "./probes/google-search";
import {
  probeSiteCrawl,
  siteCrawlDeficits,
} from "./probes/site-crawl";
import { ENV_LABELS, getPageSpeedKey, getPlacesKey, getSerpApiKey } from "./env";

export interface AuditDataSources {
  pageSpeed: boolean;
  googleSearch: boolean;
  siteCrawl: boolean;
  missing: string[];
}

function pickSecondaryPackage(): PackageRecommendation {
  return { id: "ai_visibility", headline: "AI Visibility Review", description: "Establish dated AI-answer evidence for relevant buyer questions, then evaluate content and entity improvements. SEO and AI work can complement each other; neither guarantees recommendations.", priceFrame: "custom", ctaLabel: "Discuss AI Visibility", ctaUrl: BRAND.schedulingUrl };
}

function buildAnnotations(
  site: Awaited<ReturnType<typeof probeSiteCrawl>>,
  pageSpeed: Awaited<ReturnType<typeof probePageSpeed>>
): { before: SiteAnnotation[]; after: SiteAnnotation[] } {
  if (!site.fetched) return { before: [], after: [] };
  const before: SiteAnnotation[] = [];
  const after: SiteAnnotation[] = [];

  if (site.fetched && site.schemaBlocks.length === 0) {
    before.push({ id: "schema", label: "Schema review", detail: "No structured data detected; choose a business-appropriate type", x: 72, y: 28, status: "problem" });
    after.push({ id: "schema", label: "Suggested schema", detail: "Proposed only — not deployed", x: 72, y: 28, status: "fixed" });
  }
  if (!site.metaDescription || !site.title) {
    before.push({ id: "meta", label: "Weak Meta", detail: "Title/description gaps", x: 28, y: 18, status: "problem" });
    after.push({ id: "meta", label: "Search Optimized", detail: "Meta complete", x: 28, y: 18, status: "fixed" });
  }
  if (pageSpeed.lcpSeconds && pageSpeed.lcpSeconds > 2.5) {
    before.push({ id: "speed", label: "Slow LCP", detail: `${pageSpeed.lcpSeconds.toFixed(1)}s`, x: 50, y: 55, status: "problem" });
    after.push({ id: "speed", label: "Fast Load", detail: "Sub-2.5s LCP", x: 50, y: 55, status: "fixed" });
  }
  if (!site.hasTelLink) {
    before.push({ id: "cta", label: "No Click-to-Call", detail: "Missing tel: link", x: 85, y: 72, status: "problem" });
    after.push({ id: "cta", label: "Call Ready", detail: "tel: wired", x: 85, y: 72, status: "fixed" });
  }

  return { before, after };
}

function buildSections(input: {
  site: Awaited<ReturnType<typeof probeSiteCrawl>>;
  pageSpeed: Awaited<ReturnType<typeof probePageSpeed>>;
  google: Awaited<ReturnType<typeof probeGoogleSearch>>;
}): AuditSection[] {
  const { site, google } = input;
  const social = detectSocialLinks(site.html);
  const linkedPlatforms = Object.entries(social).filter(([key, value]) => key.startsWith("has") && value === true).length;

  // Retired: schema, word count and Lighthouse cannot establish AI visibility
  // or a Google discoverability percentage. Preserve raw observations separately.
  const aiScore: number | null = null;
  const aiMeasured = false;
  const seoScore: number | null = null;
  const seoMeasured = google.blocks.some(b => b.results.length > 0);

  // Reputation — real GBP data only
  let repScore: number | null = null;
  let repMeasured = false;
  if (google.configured && google.businessListing.found && google.businessListing.rating !== undefined && google.businessListing.reviewCount !== undefined) {
    repMeasured = true;
    const rating = google.businessListing.rating;
    const reviews = google.businessListing.reviewCount;
    repScore = Math.min(
      100,
      Math.round((rating ?? 0) * 15 + Math.min(reviews ?? 0, 100) * 0.35)
    );
  }

  return [
    {
      key: "ai",
      label: "AI Visibility",
      plainQuestion: "Can AI systems read your business?",
      score: aiScore,
      measured: aiMeasured,
      dataSource: "Consumer AI visibility not measured by this legacy collector",
      summary: "AI recommendations are unmeasured. Website structure is not recommendation evidence.",
      topFix: "Review directly observed AI answers before recommending visibility work.",
    },
    {
      key: "seo",
      label: "Google Search",
      plainQuestion: "Can customers find you on Google?",
      score: seoScore,
      measured: seoMeasured,
      dataSource: "Google PageSpeed Insights + SerpAPI local/organic",
      summary: google.summary,
      topFix: "Prioritize evidenced search and conversion issues; no compulsory rebuild.",
    },
    {
      key: "reputation",
      label: "Reputation",
      plainQuestion: "Do you look trustworthy on Google?",
      score: repScore,
      measured: repMeasured,
      dataSource: "Google Business Profile via SerpAPI",
      summary: !repMeasured
        ? "No verified review count or rating was returned. This does not mean you have no reviews."
        : `Google listing: ${google.businessListing.rating ?? "?"}★ · ${google.businessListing.reviewCount ?? 0} reviews.`,
      topFix: "Confirm the relevant business listing and review data before choosing a review-request workflow.",
    },
    {
      key: "social",
      label: "Social Presence",
      plainQuestion: "Are profiles linked on your site?",
      score: null,
      measured: site.fetched,
      dataSource: "Homepage HTML link detection",
      summary: site.fetched ? `Homepage links detected to ${linkedPlatforms} tracked social platforms. This does not measure profile activity or reputation.` : "Homepage could not be assessed.",
      topFix: "Link official active profiles where useful; do not infer a need for a posting service from missing links alone.",
    },
  ];
}

function toGoogleLocalProbe(
  google: Awaited<ReturnType<typeof probeGoogleSearch>>
): GoogleLocalProbe {
  const primary = google.blocks.find((b) => b.type === "local") ?? google.blocks[0];
  return {
    aiOverviews: google.aiOverviews,
    captures: google.captures,
    searchQueries: google.blocks.map((b) => b.query),
    blocks: google.blocks.map((b) => ({ query: b.query, queryIntent: b.queryIntent, queryCorrection: b.queryCorrection, results: b.results, type: b.type, source: b.source, observedAt: b.observedAt, location: b.location })),
    primaryResults: primary?.results ?? [],
    primaryQuery: primary?.query ?? "",
    clientPosition: primary?.clientPosition ?? null,
    inMapPack: Boolean(primary?.source === "serpapi" && primary.type === "local" && primary.clientFound && (primary.clientPosition ?? 99) <= 3),
    configured: google.configured,
    summary: google.summary,
    rawError: google.rawError,
  };
}

export async function runAuditPipeline(input: {
  businessName: string;
  websiteUrl: string;
  zipCode: string;
  servicePhrase?: string;
  site?: Awaited<ReturnType<typeof probeSiteCrawl>>;
}): Promise<AuditReport> {
  const url = input.websiteUrl.startsWith("http")
    ? input.websiteUrl
    : `https://${input.websiteUrl}`;
  const servicePhrase = input.servicePhrase ?? inferServiceFromName(input.businessName).servicePhrase;

  const [site, pageSpeed, google] = await Promise.all([
    input.site ? Promise.resolve(input.site) : probeSiteCrawl(url),
    probePageSpeed(url),
    probeGoogleSearch({
      businessName: input.businessName,
      zipCode: input.zipCode,
      servicePhrase,
      websiteUrl: url,
    }),
  ]);

  const sections = buildSections({ site, pageSpeed, google });
  const opportunityIndex = 0; // Compatibility field only; no composite visibility percentage is established.

  const deficits: AuditDeficit[] = [
    ...siteCrawlDeficits(site).filter((d) => !d.finding.includes("LocalBusiness")).map((d) => d.finding.startsWith("Thin content") ? { ...d, severity: "info" as const, finding: `Homepage text sample: ${site.contentWordCount} words.`, fix: "Review whether the page clearly explains services and audience; word count alone is not a ranking or AI visibility finding." } : d),
    ...pageSpeedDeficits(pageSpeed),
    ...googleDeficits(google),
  ];

  const uniqueDeficits = deficits.sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a.severity] - { critical: 0, warning: 1, info: 2 }[b.severity])).filter(
    (d, i, arr) => arr.findIndex((x) => x.finding === d.finding) === i
  );

  const { before, after } = buildAnnotations(site, pageSpeed);

  const social = detectSocialLinks(site.html);
  const foundSocial = [
    social.hasFacebook && "Facebook",
    social.hasInstagram && "Instagram",
    social.hasLinkedIn && "LinkedIn",
    social.hasYouTube && "YouTube",
    social.hasGoogleBusiness && "Google Business",
  ].filter(Boolean) as string[];

  const missing: string[] = [];
  if (!getPageSpeedKey()) missing.push(ENV_LABELS.pageSpeed);
  if (!getSerpApiKey() && !getPlacesKey()) {
    missing.push(`${ENV_LABELS.serpApi} or ${ENV_LABELS.places}`);
  }

  const pageSpeedMeasured =
    pageSpeed.performanceScore !== null && !pageSpeed.rawError;
  const googleMeasured = google.blocks.some((b) => b.results.length > 0);

  const progressEvents = [
    site.fetched ? `Site crawl: HTTP ${site.httpStatus} — ${site.contentWordCount} words.` : `Site crawl failed: ${site.fetchError}`,
    pageSpeedMeasured
      ? `Lighthouse mobile: performance ${pageSpeed.performanceScore}/100, SEO ${pageSpeed.seoScore}/100.`
      : pageSpeed.rawError
        ? `PageSpeed error: ${pageSpeed.rawError}`
        : "PageSpeed: NOT MEASURED (API key missing).",
    googleMeasured
      ? `Google: ${google.summary}`
      : google.rawError
        ? `Google error: ${google.rawError}`
        : "Google rankings: NOT MEASURED (API key missing).",
    site.hasLocalBusinessSchema ? "Schema: LocalBusiness detected." : "Schema: LocalBusiness NOT FOUND.",
    google.businessListing.found
      ? `GBP: ${google.businessListing.rating}★ · ${google.businessListing.reviewCount} reviews.`
      : "GBP: listing not matched.",
    "Audit complete.",
  ];

  const weakest = [...sections].filter((s) => s.measured).sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];

  return {
    opportunityIndex,
    opportunityHeadline: `${input.businessName} — website checks and sampled search observations. AI recommendations and traffic impact are not established by these checks.`,
    sections,
    deficits: uniqueDeficits.slice(0, 12),
    packages: {
      primary: {
        id: "foundation",
        headline: uniqueDeficits.some(d => d.category === "seo" && d.severity !== "info") ? "Technical SEO & Website Fix Plan" : "Visibility & Measurement Review",
        description: uniqueDeficits[0] ? `Start with the observed issue: ${uniqueDeficits[0].finding} 247ROI can scope the relevant website, SEO or workflow improvement; a rebuild is not required by this audit.` : "Confirm your services and buyer queries, then collect missing evidence before choosing website, SEO or AI visibility work.",
        priceFrame: "custom",
        ctaLabel: "Discuss Your Fix Plan",
        ctaUrl: BRAND.schedulingUrl,
      },
      secondary: pickSecondaryPackage(),
    },
    guideSteps: [
      `Review the dated AI answer samples and their citations below; one sample is not a general visibility verdict.`,
      `Google local: ${google.summary}`,
      `Weakest measured pillar: ${weakest?.label ?? "N/A"} — ${weakest?.topFix ?? ""}`,
      `Review the highest-priority observed issue and scope a targeted fix, not an automatic rebuild.`,
      `Choose SEO, AI visibility, review workflows or custom automation only when the evidence supports that service. Quotes are free after the audit.`,
    ],
    sitePreview: {
      businessName: input.businessName,
      websiteUrl: url,
      screenshotUrl: `https://image.thum.io/get/width/900/noanimate/${url}`,
      beforeAnnotations: before,
      afterAnnotations: after,
    },
    socialFindings: {
      found: foundSocial,
      notLinked: ["Facebook", "Instagram", "LinkedIn", "YouTube", "Google Business"].filter(
        (p) => !foundSocial.includes(p)
      ),
      note: "Detected from homepage HTML only.",
    },
    progressEvents,
    growthTiers: GROWTH_TIERS,
    googleLocal: toGoogleLocalProbe(google),
    auditMeta: {
      dataSources: {
        pageSpeed: pageSpeedMeasured,
        googleSearch: googleMeasured,
        siteCrawl: site.fetched,
        missing,
      },
      pageSpeed: getPageSpeedKey() ? pageSpeed : undefined,
      technical: site.fetched
        ? {
            httpStatus: site.httpStatus,
            contentWordCount: site.contentWordCount,
            hasLocalBusinessSchema: site.hasLocalBusinessSchema,
            schemaBlocks: site.schemaBlocks.length,
            hasSitemap: site.hasSitemap,
            hasRobotsTxt: site.hasRobotsTxt,
            lcpSeconds: pageSpeed.lcpSeconds,
            cls: pageSpeed.cls,
          }
        : undefined,
      gbp: google.businessListing.found ? google.businessListing : undefined,
      apiErrors: {
        pageSpeed: pageSpeed.rawError,
        google: google.rawError,
      },
      note: "Website findings and public search samples are separate from the retained consumer-AI answers. Missing measurements are not proof of brand absence.",
    },
  };
}
