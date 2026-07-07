import type { AuditDeficit } from "../types";

export interface PageSpeedResult {
  configured: boolean;
  strategy: "mobile" | "desktop";
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  lcpSeconds: number | null;
  cls: number | null;
  inpMs: number | null;
  fcpSeconds: number | null;
  speedIndexSeconds: number | null;
  ttfbMs: number | null;
  failedAudits: string[];
  passedAuditCount: number;
  totalAuditCount: number;
  rawError?: string;
}

export async function probePageSpeed(url: string): Promise<PageSpeedResult> {
  const key = process.env.GOOGLE_PAGESPEED_API_KEY;
  const empty: PageSpeedResult = {
    configured: Boolean(key),
    strategy: "mobile",
    performanceScore: null,
    seoScore: null,
    accessibilityScore: null,
    bestPracticesScore: null,
    lcpSeconds: null,
    cls: null,
    inpMs: null,
    fcpSeconds: null,
    speedIndexSeconds: null,
    ttfbMs: null,
    failedAudits: [],
    passedAuditCount: 0,
    totalAuditCount: 0,
    rawError: key ? undefined : "GOOGLE_PAGESPEED_API_KEY not configured",
  };

  if (!key) return empty;

  try {
    const psiUrl = new URL(
      "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    );
    psiUrl.searchParams.set("url", url);
    psiUrl.searchParams.set("strategy", "mobile");
    psiUrl.searchParams.set("category", "performance");
    psiUrl.searchParams.set("category", "seo");
    psiUrl.searchParams.set("category", "accessibility");
    psiUrl.searchParams.set("category", "best-practices");
    psiUrl.searchParams.set("key", key);

    const res = await fetch(psiUrl.toString());
    if (!res.ok) {
      return { ...empty, rawError: `PageSpeed API returned ${res.status}` };
    }

    const data = await res.json();
    const lh = data.lighthouseResult;
    const cats = lh?.categories ?? {};
    const audits = lh?.audits ?? {};

    const score = (cat: string) => {
      const v = cats[cat]?.score;
      return typeof v === "number" ? Math.round(v * 100) : null;
    };

    const metric = (id: string) => {
      const v = audits[id]?.numericValue;
      return typeof v === "number" ? v : null;
    };

    const failed: string[] = [];
    let passed = 0;
    let total = 0;
    for (const [id, audit] of Object.entries(audits) as [string, { score?: number; title?: string }][]) {
      if (typeof audit.score !== "number") continue;
      total++;
      if (audit.score < 1) {
        failed.push(audit.title ?? id);
      } else {
        passed++;
      }
    }

    return {
      configured: true,
      strategy: "mobile",
      performanceScore: score("performance"),
      seoScore: score("seo"),
      accessibilityScore: score("accessibility"),
      bestPracticesScore: score("best-practices"),
      lcpSeconds: metric("largest-contentful-paint")
        ? metric("largest-contentful-paint")! / 1000
        : null,
      cls: metric("cumulative-layout-shift"),
      inpMs: metric("interaction-to-next-paint") ?? metric("total-blocking-time"),
      fcpSeconds: metric("first-contentful-paint")
        ? metric("first-contentful-paint")! / 1000
        : null,
      speedIndexSeconds: metric("speed-index")
        ? metric("speed-index")! / 1000
        : null,
      ttfbMs: metric("server-response-time") ?? metric("time-to-first-byte"),
      failedAudits: failed.slice(0, 12),
      passedAuditCount: passed,
      totalAuditCount: total,
    };
  } catch (e) {
    return {
      ...empty,
      rawError: e instanceof Error ? e.message : "PageSpeed probe failed",
    };
  }
}

export function pageSpeedDeficits(ps: PageSpeedResult): AuditDeficit[] {
  const deficits: AuditDeficit[] = [];
  if (!ps.configured) {
    deficits.push({
      severity: "warning",
      finding: "Mobile performance not measured — PageSpeed API key required.",
      fix: "Configure GOOGLE_PAGESPEED_API_KEY for Lighthouse scores.",
      category: "seo",
    });
    return deficits;
  }
  if (ps.rawError) {
    deficits.push({
      severity: "warning",
      finding: `PageSpeed measurement failed: ${ps.rawError}`,
      fix: "Verify URL is reachable and API quota is available.",
      category: "seo",
    });
    return deficits;
  }
  if (ps.performanceScore !== null && ps.performanceScore < 50) {
    deficits.push({
      severity: "critical",
      finding: `Google Lighthouse mobile performance: ${ps.performanceScore}/100.`,
      fix: "Migrate to optimized hosting and compress assets (Smart Site Foundation).",
      category: "seo",
    });
  }
  if (ps.lcpSeconds !== null && ps.lcpSeconds > 2.5) {
    deficits.push({
      severity: "critical",
      finding: `Largest Contentful Paint is ${ps.lcpSeconds.toFixed(1)}s (target under 2.5s).`,
      fix: "Optimize hero images, fonts, and server response time.",
      category: "seo",
    });
  }
  if (ps.seoScore !== null && ps.seoScore < 80) {
    deficits.push({
      severity: "warning",
      finding: `Lighthouse SEO score: ${ps.seoScore}/100.`,
      fix: "Fix meta tags, crawlability, and structured data.",
      category: "seo",
    });
  }
  for (const audit of ps.failedAudits.slice(0, 3)) {
    deficits.push({
      severity: "warning",
      finding: `Lighthouse flagged: ${audit}`,
      fix: "Resolve in Smart Site Foundation migration.",
      category: "seo",
    });
  }
  return deficits;
}
