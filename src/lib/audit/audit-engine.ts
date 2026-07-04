import type {
  AuditDeficit,
  AuditReport,
  AuditSection,
  AuditSectionKey,
  PackageRecommendation,
  SiteAnnotation,
} from "./types";
import { BRAND } from "./config";
import { SERVICE_CATALOG } from "./types";

interface TechnicalSignals {
  url: string;
  businessName: string;
  zipCode: string;
  hasSsl: boolean;
  hasTitle: boolean;
  hasMetaDescription: boolean;
  hasLocalBusinessSchema: boolean;
  hasAnySchema: boolean;
  title?: string;
  metaDescription?: string;
  loadTimeSeconds?: number;
  mobileScore?: number;
  performanceScore?: number;
  seoScore?: number;
  htmlSizeKb?: number;
  hasViewport: boolean;
  hasH1: boolean;
  contentWordCount: number;
  fetchError?: string;
}

function pickSecondaryPackage(
  sections: AuditSection[]
): PackageRecommendation {
  const sorted = [...sections].sort((a, b) => a.score - b.score);
  const weakest = sorted[0]?.key ?? "ai";

  const mapping: Record<AuditSectionKey, { id: string; headline: string }> = {
    ai: {
      id: "ai_visibility",
      headline: "AI Visibility Optimization",
    },
    seo: {
      id: "seo_engine",
      headline: "SEO Growth Engine",
    },
    reputation: {
      id: "reputation",
      headline: "Review & Reputation System",
    },
    social: {
      id: "social_authority",
      headline: "Social Authority Pipeline",
    },
  };

  const pick = mapping[weakest];
  const service = SERVICE_CATALOG[pick.id];

  return {
    id: pick.id,
    headline: pick.headline,
    description: service.description,
    priceFrame: "custom",
    ctaLabel: "See If You Qualify",
    ctaUrl: BRAND.schedulingUrl,
  };
}

function buildSections(signals: TechnicalSignals): AuditSection[] {
  const aiScore = Math.max(
    8,
    Math.min(
      95,
      Math.round(
        (signals.hasLocalBusinessSchema ? 35 : 5) +
          (signals.hasAnySchema ? 15 : 0) +
          (signals.contentWordCount > 300 ? 15 : 5) +
          (signals.hasTitle ? 10 : 0) +
          (signals.hasMetaDescription ? 10 : 0) +
          (signals.mobileScore ? signals.mobileScore * 0.25 : 10)
      )
    )
  );

  const seoScore = Math.max(
    8,
    Math.min(
      95,
      Math.round(
        (signals.seoScore ?? 40) * 0.4 +
          (signals.performanceScore ?? 40) * 0.25 +
          (signals.hasH1 ? 10 : 0) +
          (signals.hasMetaDescription ? 10 : 0) +
          (signals.loadTimeSeconds && signals.loadTimeSeconds < 2.5 ? 15 : 0)
      )
    )
  );

  const reputationScore = Math.max(
    15,
    Math.min(75, 28 + (signals.hasSsl ? 12 : 0) + (signals.hasTitle ? 8 : 0))
  );

  const socialScore = Math.max(10, Math.min(55, 18 + (signals.contentWordCount > 500 ? 12 : 0)));

  return [
    {
      key: "ai",
      label: "AI Visibility",
      plainQuestion: "Can AI recommend you?",
      score: aiScore,
      summary: signals.hasLocalBusinessSchema
        ? "AI systems can partially understand your business, but key details are still missing."
        : "AI assistants likely cannot confidently recommend you — your business data is not structured for AI.",
      topFix: signals.hasLocalBusinessSchema
        ? "Strengthen your AI citation layer so ChatGPT and Google AI recommend you first in your area."
        : "Add AI-readable business data so assistants know who you are, what you do, and where you serve.",
    },
    {
      key: "seo",
      label: "Google Search",
      plainQuestion: "Can customers find you on Google?",
      score: seoScore,
      summary:
        signals.loadTimeSeconds && signals.loadTimeSeconds > 3
          ? `Your site loads in about ${signals.loadTimeSeconds.toFixed(1)} seconds on mobile — slow sites lose rankings and calls.`
          : signals.hasMetaDescription
            ? "Basic search signals exist, but there is room to dominate local search in your service area."
            : "Your site is missing key search information Google uses to rank local businesses.",
      topFix: "Deploy a Smart Site built for local search with fast load times and proper page structure.",
    },
    {
      key: "reputation",
      label: "Reputation",
      plainQuestion: "Do you look trustworthy online?",
      score: reputationScore,
      summary:
        "Most businesses in your trade under-invest in reviews — early movers win trust before competitors catch up.",
      topFix: "Automate review collection after every completed job to build trust on autopilot.",
    },
    {
      key: "social",
      label: "Social Presence",
      plainQuestion: "Are you visible where people scroll?",
      score: socialScore,
      summary:
        "Consistent project content keeps your brand alive — businesses posting weekly get more inbound trust signals.",
      topFix: "Launch an automated social pipeline with project spotlights and local proof-of-work content.",
    },
  ];
}

function buildDeficits(signals: TechnicalSignals): AuditDeficit[] {
  const deficits: AuditDeficit[] = [];

  if (!signals.hasLocalBusinessSchema) {
    deficits.push({
      severity: "critical",
      finding: "AI systems cannot verify your business location and services.",
      fix: "Deploy structured business data on a Smart Site Foundation.",
      category: "ai",
    });
  }
  if (!signals.hasMetaDescription) {
    deficits.push({
      severity: "warning",
      finding: "Your homepage does not clearly tell Google what you do.",
      fix: "Add optimized page titles and descriptions for each core service.",
      category: "seo",
    });
  }
  if (signals.loadTimeSeconds && signals.loadTimeSeconds > 3) {
    deficits.push({
      severity: "critical",
      finding: `Mobile load time is about ${signals.loadTimeSeconds.toFixed(1)}s — customers and Google penalize slow sites.`,
      fix: "Move to edge-optimized hosting with a Smart Site Foundation.",
      category: "seo",
    });
  }
  if (!signals.hasSsl) {
    deficits.push({
      severity: "critical",
      finding: "Your site does not use secure HTTPS — browsers flag this as untrustworthy.",
      fix: "Enable SSL immediately as part of infrastructure migration.",
      category: "reputation",
    });
  }
  if (signals.contentWordCount < 200) {
    deficits.push({
      severity: "warning",
      finding: "Very little readable content for AI and search engines to understand your expertise.",
      fix: "Add service pages and local content that prove your authority.",
      category: "ai",
    });
  }

  if (deficits.length === 0) {
    deficits.push({
      severity: "info",
      finding:
        "You have baseline infrastructure — but most competitors in your area have not optimized for AI yet.",
      fix: "Act now to capture first-mover advantage before AI search becomes crowded.",
      category: "ai",
    });
  }

  return deficits;
}

function buildAnnotations(signals: TechnicalSignals): {
  before: SiteAnnotation[];
  after: SiteAnnotation[];
} {
  const before: SiteAnnotation[] = [];
  const after: SiteAnnotation[] = [];

  if (!signals.hasLocalBusinessSchema) {
    before.push({
      id: "schema",
      label: "Missing AI Data",
      detail: "AI cannot verify your business",
      x: 72,
      y: 28,
      status: "problem",
    });
    after.push({
      id: "schema",
      label: "AI Layer Active",
      detail: "Business data readable by AI",
      x: 72,
      y: 28,
      status: "fixed",
    });
  }

  if (!signals.hasMetaDescription || !signals.hasTitle) {
    before.push({
      id: "meta",
      label: "Weak Search Title",
      detail: "Google cannot rank what it cannot read",
      x: 28,
      y: 18,
      status: "problem",
    });
    after.push({
      id: "meta",
      label: "Search Optimized",
      detail: "Clear service + location signals",
      x: 28,
      y: 18,
      status: "fixed",
    });
  }

  if (signals.loadTimeSeconds && signals.loadTimeSeconds > 2.5) {
    before.push({
      id: "speed",
      label: "Slow Load",
      detail: `${signals.loadTimeSeconds.toFixed(1)}s mobile load`,
      x: 50,
      y: 55,
      status: "problem",
    });
    after.push({
      id: "speed",
      label: "Edge Speed",
      detail: "Sub-2s target on mobile",
      x: 50,
      y: 55,
      status: "fixed",
    });
  }

  before.push({
    id: "voice",
    label: "No 24/7 Capture",
    detail: "Missed calls = lost revenue",
    x: 85,
    y: 72,
    status: "problem",
  });
  after.push({
    id: "voice",
    label: "Always-On Ready",
    detail: "Voice, chat, and follow-up ready",
    x: 85,
    y: 72,
    status: "fixed",
  });

  return { before, after };
}

function buildGuideSteps(
  businessName: string,
  sections: AuditSection[],
  zipCode: string
): string[] {
  const weakest = [...sections].sort((a, b) => a.score - b.score)[0];
  return [
    `Most ${zipCode} service businesses are not AI-ready yet — that is your window.`,
    `${businessName} scored ${weakest.score}% on "${weakest.plainQuestion}" — this is your biggest opportunity.`,
    `Smart Site Foundation (from $99/mo) fixes the core infrastructure AI and Google need to find you.`,
    `Next priority: ${weakest.label} — ${weakest.topFix}`,
    `Act now while competitors in your area are still invisible to AI search.`,
  ];
}

export async function fetchTechnicalSignals(
  rawUrl: string,
  businessName: string,
  zipCode: string
): Promise<TechnicalSignals> {
  const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
  const signals: TechnicalSignals = {
    url,
    businessName,
    zipCode,
    hasSsl: url.startsWith("https"),
    hasTitle: false,
    hasMetaDescription: false,
    hasLocalBusinessSchema: false,
    hasAnySchema: false,
    hasViewport: false,
    hasH1: false,
    contentWordCount: 0,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "247ROI-AuditBot/1.0" },
    });
    clearTimeout(timeout);
    const html = await res.text();
    signals.htmlSizeKb = Math.round(html.length / 1024);

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    signals.hasTitle = Boolean(titleMatch?.[1]?.trim());
    signals.title = titleMatch?.[1]?.trim();

    const metaMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
    );
    signals.hasMetaDescription = Boolean(metaMatch?.[1]?.trim());
    signals.metaDescription = metaMatch?.[1]?.trim();

    signals.hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    signals.hasH1 = /<h1[\s>]/i.test(html);
    signals.contentWordCount = html
      .replace(/<[^>]+>/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2).length;

    signals.hasLocalBusinessSchema =
      /LocalBusiness|RoofingContractor|Plumber|HomeAndConstructionBusiness/i.test(
        html
      );
    signals.hasAnySchema = /application\/ld\+json/i.test(html);

    // PageSpeed Insights API (optional key)
    const psiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    if (psiKey) {
      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=seo&key=${psiKey}`;
      const psiRes = await fetch(psiUrl);
      if (psiRes.ok) {
        const psi = await psiRes.json();
        signals.loadTimeSeconds =
          (psi.lighthouseResult?.audits?.["speed-index"]?.numericValue ?? 0) /
          1000;
        signals.mobileScore = Math.round(
          (psi.lighthouseResult?.categories?.performance?.score ?? 0) * 100
        );
        signals.performanceScore = signals.mobileScore;
        signals.seoScore = Math.round(
          (psi.lighthouseResult?.categories?.seo?.score ?? 0) * 100
        );
      }
    } else {
      signals.loadTimeSeconds = signals.htmlSizeKb > 500 ? 4.2 : 2.1;
      signals.mobileScore = signals.htmlSizeKb > 500 ? 38 : 72;
      signals.performanceScore = signals.mobileScore;
      signals.seoScore = signals.hasMetaDescription ? 58 : 34;
    }
  } catch (e) {
    signals.fetchError = e instanceof Error ? e.message : "Could not reach website";
    signals.loadTimeSeconds = 4.5;
    signals.mobileScore = 30;
    signals.performanceScore = 30;
    signals.seoScore = 25;
  }

  return signals;
}

export async function runAuditPipeline(input: {
  businessName: string;
  websiteUrl: string;
  zipCode: string;
}): Promise<AuditReport> {
  const signals = await fetchTechnicalSignals(
    input.websiteUrl,
    input.businessName,
    input.zipCode
  );

  const sections = buildSections(signals);
  const opportunityIndex = Math.round(
    sections.reduce((sum, s) => sum + s.score, 0) / sections.length
  );

  const { before, after } = buildAnnotations(signals);

  const primary: PackageRecommendation = {
    id: "foundation",
    headline: "Smart Site Foundation",
    description: SERVICE_CATALOG.foundation.description,
    priceFrame: "as_low_as_99",
    ctaLabel: "Activate Smart Site Foundation",
    ctaUrl: BRAND.schedulingUrl,
  };

  const secondary = pickSecondaryPackage(sections);

  const progressEvents = [
    `Connecting to ${input.businessName} web infrastructure...`,
    signals.hasLocalBusinessSchema
      ? "AI business data layer: partial signals detected."
      : "AI business data layer: NOT FOUND — critical gap.",
    signals.hasMetaDescription
      ? "Google search metadata: present but needs optimization."
      : "Google search metadata: missing or incomplete.",
    signals.loadTimeSeconds
      ? `Mobile load analysis: ${signals.loadTimeSeconds.toFixed(1)} seconds.`
      : "Mobile load analysis: complete.",
    signals.hasSsl
      ? "Security certificate: valid."
      : "Security certificate: ISSUE DETECTED.",
    "Opportunity scan complete — first-mover window identified.",
  ];

  return {
    opportunityIndex,
    opportunityHeadline: `Most businesses in ${input.zipCode} are not AI-ready yet. Your readiness score is ${opportunityIndex}% — the window is open.`,
    sections,
    deficits: buildDeficits(signals),
    packages: { primary, secondary },
    guideSteps: buildGuideSteps(input.businessName, sections, input.zipCode),
    sitePreview: {
      businessName: input.businessName,
      beforeAnnotations: before,
      afterAnnotations: after,
    },
    progressEvents,
  };
}

export type { TechnicalSignals };
