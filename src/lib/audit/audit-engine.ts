import type {
  AuditDeficit,
  AuditReport,
  AuditSection,
  AuditSectionKey,
  GoogleLocalProbe,
  PackageRecommendation,
  SiteAnnotation,
} from "./types";
import { BRAND } from "./config";
import { GROWTH_TIERS } from "./industry-stats";
import { SERVICE_CATALOG } from "./types";
import { inferServiceFromName } from "./infer-service";
import {
  detectSocialLinks,
  socialScoreFromSignals,
  socialSummary,
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

export interface AuditDataSources {
  pageSpeed: boolean;
  googleSearch: boolean;
  siteCrawl: boolean;
  missing: string[];
}

function pickSecondaryPackage(
  sections: AuditSection[]
): PackageRecommendation {
  const supporting = sections.filter((s) => s.key !== "ai" && s.measured);
  const weakest = [...supporting].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];
  const emphasisKey = weakest?.key ?? "seo";

  const emphasisCopy: Record<Exclude<AuditSectionKey, "ai">, string> = {
    seo: "technical SEO, local page structure, and Google indexation",
    reputation: "automated reviews and trust signals AI models rely on",
    social: "entity-linked profiles so AI connects your brand across the web",
  };

  const key = emphasisKey === "ai" ? "seo" : emphasisKey;
  const emphasis =
    emphasisCopy[key as Exclude<AuditSectionKey, "ai">] ?? emphasisCopy.seo;

  return {
    id: "ai_visibility",
    headline: "AI Visibility Growth Program",
    description: `Your phase-two growth engine. We build citation layers, structured data, and AI-readable entity signals — including ${emphasis}.`,
    priceFrame: "custom",
    ctaLabel: "See If You Qualify for AI Visibility",
    ctaUrl: BRAND.schedulingUrl,
  };
}

function weightedReadinessIndex(sections: AuditSection[]): number | null {
  const measured = sections.filter((s) => s.measured && s.score !== null);
  if (measured.length === 0) return null;

  const weights: Record<AuditSectionKey, number> = {
    ai: 0.35,
    seo: 0.35,
    reputation: 0.2,
    social: 0.1,
  };
  const totalWeight = measured.reduce((s, sec) => s + (weights[sec.key] ?? 0.25), 0);
  const total = measured.reduce(
    (sum, s) => sum + (s.score ?? 0) * (weights[s.key] ?? 0.25),
    0
  );
  return Math.round(total / totalWeight);
}

function buildAnnotations(
  site: Awaited<ReturnType<typeof probeSiteCrawl>>,
  pageSpeed: Awaited<ReturnType<typeof probePageSpeed>>
): { before: SiteAnnotation[]; after: SiteAnnotation[] } {
  const before: SiteAnnotation[] = [];
  const after: SiteAnnotation[] = [];

  if (!site.hasLocalBusinessSchema) {
    before.push({ id: "schema", label: "Missing AI Data", detail: "No LocalBusiness schema", x: 72, y: 28, status: "problem" });
    after.push({ id: "schema", label: "AI Layer Active", detail: "Schema injected", x: 72, y: 28, status: "fixed" });
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
  const { site, pageSpeed, google } = input;
  const social = detectSocialLinks(site.html);
  const socialScore = socialScoreFromSignals(social);
  const socialCopy = socialSummary(social);

  // AI score — from measurable site + schema + PageSpeed SEO only
  let aiScore: number | null = null;
  let aiMeasured = false;
  if (site.fetched) {
    aiMeasured = true;
    let pts = 0;
    if (site.hasLocalBusinessSchema) pts += 35;
    else pts += 5;
    if (site.schemaBlocks.some((b) => b.valid)) pts += 15;
    if (site.contentWordCount > 300) pts += 15;
    else if (site.contentWordCount > 150) pts += 8;
    if (site.title && site.metaDescription) pts += 10;
    if (site.ogTitle && site.ogDescription) pts += 5;
    if (pageSpeed.configured && pageSpeed.seoScore !== null) {
      pts = Math.round(pts * 0.6 + pageSpeed.seoScore * 0.4);
    }
    aiScore = Math.min(100, Math.max(5, pts));
  }

  // SEO score — PageSpeed SEO + performance + Google visibility
  let seoScore: number | null = null;
  let seoMeasured = false;
  if (pageSpeed.configured && pageSpeed.seoScore !== null) {
    seoMeasured = true;
    seoScore = pageSpeed.seoScore;
    if (pageSpeed.performanceScore !== null) {
      seoScore = Math.round(seoScore * 0.55 + pageSpeed.performanceScore * 0.25);
    }
    if (google.configured) {
      const local = google.blocks.find((b) => b.type === "local");
      if (local?.clientFound) seoScore = Math.min(100, seoScore + 15);
      else if (local) seoScore = Math.max(5, seoScore - 10);
      const organic = google.blocks.find((b) => b.type === "organic");
      if (organic?.clientFound) seoScore = Math.min(100, seoScore + 10);
    }
    if (site.hasSitemap) seoScore = Math.min(100, seoScore + 5);
    if (!site.hasH1) seoScore = Math.max(5, seoScore - 8);
  }

  // Reputation — real GBP data only
  let repScore: number | null = null;
  let repMeasured = false;
  if (google.configured && google.businessListing.found) {
    repMeasured = true;
    const rating = google.businessListing.rating ?? 0;
    const reviews = google.businessListing.reviewCount ?? 0;
    repScore = Math.min(
      100,
      Math.round(rating * 15 + Math.min(reviews, 100) * 0.35)
    );
  }

  return [
    {
      key: "ai",
      label: "AI Readiness",
      plainQuestion: "Can AI systems read your business?",
      score: aiScore,
      measured: aiMeasured,
      dataSource: "Site crawl + schema analysis + Lighthouse SEO",
      summary: !aiMeasured
        ? "Could not measure — site unreachable."
        : !site.hasLocalBusinessSchema
          ? "No LocalBusiness schema — AI cannot confidently recommend you."
          : site.schemaBlocks.some((b) => !b.valid)
            ? "Schema present but incomplete — AI entity matching is weak."
            : "Baseline AI-readable structure detected — can be strengthened.",
      topFix: site.hasLocalBusinessSchema
        ? "Expand citation layers and service-area content for AI retrieval."
        : "Deploy LocalBusiness JSON-LD schema on Smart Site Foundation.",
    },
    {
      key: "seo",
      label: "Google Search",
      plainQuestion: "Can customers find you on Google?",
      score: seoScore,
      measured: seoMeasured,
      dataSource: "Google PageSpeed Insights + SerpAPI local/organic",
      summary: !seoMeasured
        ? "Not measured — add GOOGLE_PAGESPEED_API_KEY."
        : pageSpeed.performanceScore !== null && pageSpeed.performanceScore < 50
          ? `Lighthouse mobile performance ${pageSpeed.performanceScore}/100 hurts rankings.`
          : google.blocks.find((b) => b.type === "local" && !b.clientFound)
            ? "Not appearing in measured local pack results for your service area."
            : "Measurable search signals collected — see detailed findings.",
      topFix: "Smart Site Foundation + local SEO optimization.",
    },
    {
      key: "reputation",
      label: "Reputation",
      plainQuestion: "Do you look trustworthy on Google?",
      score: repScore,
      measured: repMeasured,
      dataSource: "Google Business Profile via SerpAPI",
      summary: !repMeasured
        ? "Not measured — add SERPAPI_KEY for GBP review data."
        : `Google listing: ${google.businessListing.rating ?? "?"}★ · ${google.businessListing.reviewCount ?? 0} reviews.`,
      topFix: "Automated review generation after every completed job.",
    },
    {
      key: "social",
      label: "Social Presence",
      plainQuestion: "Are profiles linked on your site?",
      score: socialScore,
      measured: site.fetched,
      dataSource: "Homepage HTML link detection",
      summary: socialCopy.summary,
      topFix: socialCopy.topFix,
    },
  ];
}

function toGoogleLocalProbe(
  google: Awaited<ReturnType<typeof probeGoogleSearch>>
): GoogleLocalProbe {
  const primary = google.blocks.find((b) => b.type === "local") ?? google.blocks[0];
  return {
    searchQueries: google.blocks.map((b) => b.query),
    blocks: google.blocks.map((b) => ({ query: b.query, results: b.results })),
    primaryResults: primary?.results ?? [],
    primaryQuery: primary?.query ?? "",
    clientPosition: primary?.clientPosition ?? null,
    inMapPack: Boolean(primary?.clientFound && (primary.clientPosition ?? 99) <= 3),
    configured: google.configured,
    summary: google.summary,
  };
}

export async function runAuditPipeline(input: {
  businessName: string;
  websiteUrl: string;
  zipCode: string;
}): Promise<AuditReport> {
  const url = input.websiteUrl.startsWith("http")
    ? input.websiteUrl
    : `https://${input.websiteUrl}`;
  const { servicePhrase } = inferServiceFromName(input.businessName);

  const [site, pageSpeed, google] = await Promise.all([
    probeSiteCrawl(url),
    probePageSpeed(url),
    probeGoogleSearch({
      businessName: input.businessName,
      zipCode: input.zipCode,
      servicePhrase,
      websiteUrl: url,
    }),
  ]);

  const sections = buildSections({ site, pageSpeed, google });
  const opportunityIndex = weightedReadinessIndex(sections) ?? 0;

  const deficits: AuditDeficit[] = [
    ...siteCrawlDeficits(site),
    ...pageSpeedDeficits(pageSpeed),
    ...googleDeficits(google),
  ];

  const uniqueDeficits = deficits.filter(
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
  if (!pageSpeed.configured) missing.push("GOOGLE_PAGESPEED_API_KEY");
  if (!google.configured) missing.push("SERPAPI_KEY or GOOGLE_PLACES_API_KEY");

  const progressEvents = [
    site.fetched ? `Site crawl: HTTP ${site.httpStatus} — ${site.contentWordCount} words.` : `Site crawl failed: ${site.fetchError}`,
    pageSpeed.configured
      ? `Lighthouse mobile: performance ${pageSpeed.performanceScore}/100, SEO ${pageSpeed.seoScore}/100.`
      : "PageSpeed: NOT MEASURED (API key missing).",
    google.configured ? `Google: ${google.summary}` : "Google rankings: NOT MEASURED (API key missing).",
    site.hasLocalBusinessSchema ? "Schema: LocalBusiness detected." : "Schema: LocalBusiness NOT FOUND.",
    google.businessListing.found
      ? `GBP: ${google.businessListing.rating}★ · ${google.businessListing.reviewCount} reviews.`
      : "GBP: listing not matched.",
    "Audit complete.",
  ];

  const weakest = [...sections].filter((s) => s.measured).sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];

  return {
    opportunityIndex,
    opportunityHeadline: weakest
      ? `${input.businessName} — weakest measured area: ${weakest.label} (${weakest.score ?? "N/A"}%). Window is open in ${input.zipCode}.`
      : `Audit incomplete — configure API keys for full measurement.`,
    sections,
    deficits: uniqueDeficits.slice(0, 12),
    packages: {
      primary: {
        id: "foundation",
        headline: "Smart Site Foundation",
        description: SERVICE_CATALOG.foundation.description,
        priceFrame: "as_low_as_99",
        ctaLabel: "Activate Smart Site Foundation",
        ctaUrl: BRAND.schedulingUrl,
      },
      secondary: pickSecondaryPackage(sections),
    },
    guideSteps: [
      `Live AI visibility test: run ChatGPT/Gemini on the call (not in this report).`,
      `Google local: ${google.summary}`,
      `Weakest measured pillar: ${weakest?.label ?? "N/A"} — ${weakest?.topFix ?? ""}`,
      `Smart Site Foundation ($99/mo) fixes infrastructure gaps found in this audit.`,
      `Growth ($297/mo) and AI Visibility ($497+/mo) build on the foundation.`,
    ],
    sitePreview: {
      businessName: input.businessName,
      websiteUrl: url,
      screenshotUrl: `https://image.thum.io/get/width/900/noanimate/${encodeURIComponent(url)}`,
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
        pageSpeed: pageSpeed.configured,
        googleSearch: google.configured,
        siteCrawl: site.fetched,
        missing,
      },
      pageSpeed: pageSpeed.configured ? pageSpeed : undefined,
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
      note: "AI mention testing (ChatGPT/Gemini) is performed live on the sales call, not in this automated audit.",
    },
  };
}
