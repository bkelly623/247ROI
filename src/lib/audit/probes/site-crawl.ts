import type { AuditDeficit } from "../types";

export interface SchemaBlock {
  type: string;
  valid: boolean;
  missingFields: string[];
  raw?: Record<string, unknown>;
}

export interface SiteCrawlResult {
  url: string;
  fetched: boolean;
  fetchError?: string;
  hasSsl: boolean;
  httpStatus?: number;
  title?: string;
  metaDescription?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  hasViewport: boolean;
  hasH1: boolean;
  h1Text?: string;
  contentWordCount: number;
  imageCount: number;
  imagesMissingAlt: number;
  hasTelLink: boolean;
  hasMailto: boolean;
  internalLinkCount: number;
  hasRobotsTxt: boolean;
  robotsAllowsCrawl: boolean;
  hasSitemap: boolean;
  sitemapUrl?: string;
  schemaBlocks: SchemaBlock[];
  hasLocalBusinessSchema: boolean;
  hasAnySchema: boolean;
  html: string;
}

const LOCAL_BUSINESS_TYPES = [
  "LocalBusiness",
  "RoofingContractor",
  "Plumber",
  "Electrician",
  "HVACBusiness",
  "GeneralContractor",
  "HomeAndConstructionBusiness",
  "ProfessionalService",
];

function parseJsonLd(html: string): SchemaBlock[] {
  const blocks: SchemaBlock[] = [];
  const regex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      const items = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];
      for (const item of items) {
        const type = String(item["@type"] ?? "Unknown");
        const types = Array.isArray(type) ? type : [type];
        const missing: string[] = [];
        if (types.some((t) => LOCAL_BUSINESS_TYPES.some((lb) => t.includes(lb)))) {
          if (!item.name) missing.push("name");
          if (!item.address && !item.areaServed) missing.push("address/areaServed");
          if (!item.telephone) missing.push("telephone");
          if (!item.url) missing.push("url");
        }
        blocks.push({
          type: types.join(", "),
          valid: missing.length === 0,
          missingFields: missing,
          raw: item,
        });
      }
    } catch {
      blocks.push({ type: "Invalid JSON-LD", valid: false, missingFields: ["parse error"] });
    }
  }
  return blocks;
}

async function fetchText(url: string, timeoutMs = 8000): Promise<{ text: string; status: number } | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "247ROI-AuditBot/2.0" },
    });
    clearTimeout(t);
    return { text: await res.text(), status: res.status };
  } catch {
    return null;
  }
}

export async function probeSiteCrawl(rawUrl: string): Promise<SiteCrawlResult> {
  const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
  const origin = new URL(url).origin;

  const empty: SiteCrawlResult = {
    url,
    fetched: false,
    hasSsl: url.startsWith("https"),
    hasViewport: false,
    hasH1: false,
    contentWordCount: 0,
    imageCount: 0,
    imagesMissingAlt: 0,
    hasTelLink: false,
    hasMailto: false,
    internalLinkCount: 0,
    hasRobotsTxt: false,
    robotsAllowsCrawl: true,
    hasSitemap: false,
    schemaBlocks: [],
    hasLocalBusinessSchema: false,
    hasAnySchema: false,
    html: "",
  };

  const page = await fetchText(url);
  if (!page) {
    return { ...empty, fetchError: "Could not reach website" };
  }

  const html = page.text;
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const metaMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  );
  const canonicalMatch = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i
  );
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);
  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);
  const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);

  const images = [...html.matchAll(/<img\b[^>]*>/gi)];
  const missingAlt = images.filter((m) => !/alt=["'][^"']+["']/i.test(m[0])).length;
  const internalLinks = [...html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)].filter(
    (m) => m[1].startsWith("/") || m[1].includes(new URL(url).hostname)
  ).length;

  const schemaBlocks = parseJsonLd(html);
  const hasLB = schemaBlocks.some((b) =>
    LOCAL_BUSINESS_TYPES.some((t) => b.type.includes(t))
  );

  const robots = await fetchText(`${origin}/robots.txt`);
  let hasRobots = false;
  let allowsCrawl = true;
  if (robots) {
    hasRobots = true;
    if (/Disallow:\s*\/\s*$/im.test(robots.text)) allowsCrawl = false;
  }

  let hasSitemap = false;
  let sitemapUrl: string | undefined;
  const sitemapLoc = robots?.text.match(/Sitemap:\s*(.+)/i)?.[1]?.trim();
  if (sitemapLoc) {
    hasSitemap = true;
    sitemapUrl = sitemapLoc;
  } else {
    const sm = await fetchText(`${origin}/sitemap.xml`);
    if (sm && sm.text.includes("<urlset")) {
      hasSitemap = true;
      sitemapUrl = `${origin}/sitemap.xml`;
    }
  }

  return {
    url,
    fetched: true,
    httpStatus: page.status,
    hasSsl: url.startsWith("https"),
    title: titleMatch?.[1]?.trim(),
    metaDescription: metaMatch?.[1]?.trim(),
    canonical: canonicalMatch?.[1],
    ogTitle: ogTitle?.[1],
    ogDescription: ogDesc?.[1],
    hasViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    hasH1: /<h1[\s>]/i.test(html),
    h1Text: h1Match?.[1]?.trim(),
    contentWordCount: html
      .replace(/<[^>]+>/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2).length,
    imageCount: images.length,
    imagesMissingAlt: missingAlt,
    hasTelLink: /href=["']tel:/i.test(html),
    hasMailto: /href=["']mailto:/i.test(html),
    internalLinkCount: internalLinks,
    hasRobotsTxt: hasRobots,
    robotsAllowsCrawl: allowsCrawl,
    hasSitemap,
    sitemapUrl,
    schemaBlocks,
    hasLocalBusinessSchema: hasLB,
    hasAnySchema: schemaBlocks.length > 0,
    html,
  };
}

export function siteCrawlDeficits(site: SiteCrawlResult): AuditDeficit[] {
  const deficits: AuditDeficit[] = [];

  if (!site.fetched) {
    deficits.push({
      severity: "critical",
      finding: site.fetchError ?? "Website unreachable.",
      fix: "Fix hosting/DNS or deploy Smart Site Foundation.",
      category: "seo",
    });
    return deficits;
  }

  if (!site.hasSsl) {
    deficits.push({
      severity: "critical",
      finding: "Site not served over HTTPS.",
      fix: "Enable SSL certificate immediately.",
      category: "reputation",
    });
  }

  if (!site.hasLocalBusinessSchema) {
    deficits.push({
      severity: "critical",
      finding: "No valid LocalBusiness JSON-LD schema detected.",
      fix: "Inject structured business data (Smart Site Foundation).",
      category: "ai",
    });
  } else {
    for (const block of site.schemaBlocks) {
      if (!block.valid && block.missingFields.length) {
        deficits.push({
          severity: "warning",
          finding: `Schema ${block.type} missing: ${block.missingFields.join(", ")}.`,
          fix: "Complete schema fields for AI and Google entity matching.",
          category: "ai",
        });
      }
    }
  }

  if (!site.metaDescription) {
    deficits.push({
      severity: "warning",
      finding: "Missing meta description on homepage.",
      fix: "Add service + location meta description.",
      category: "seo",
    });
  }

  if (!site.hasH1) {
    deficits.push({
      severity: "warning",
      finding: "No H1 heading on homepage.",
      fix: "Add clear H1 with primary service and location.",
      category: "seo",
    });
  }

  if (site.contentWordCount < 250) {
    deficits.push({
      severity: "warning",
      finding: `Thin content (${site.contentWordCount} words) — AI and Google lack context.`,
      fix: "Add service area pages and expertise content.",
      category: "ai",
    });
  }

  if (!site.hasTelLink) {
    deficits.push({
      severity: "info",
      finding: "No click-to-call link detected on homepage.",
      fix: "Add tel: link above the fold for mobile conversions.",
      category: "seo",
    });
  }

  if (!site.hasSitemap) {
    deficits.push({
      severity: "warning",
      finding: "No XML sitemap detected.",
      fix: "Publish sitemap.xml and submit to Google Search Console.",
      category: "seo",
    });
  }

  if (!site.robotsAllowsCrawl) {
    deficits.push({
      severity: "critical",
      finding: "robots.txt may be blocking search engine crawlers.",
      fix: "Update robots.txt to allow indexing.",
      category: "seo",
    });
  }

  if (site.imagesMissingAlt > 0 && site.imageCount > 0) {
    const pct = Math.round((site.imagesMissingAlt / site.imageCount) * 100);
    if (pct > 40) {
      deficits.push({
        severity: "info",
        finding: `${pct}% of images missing alt text.`,
        fix: "Add descriptive alt tags for accessibility and SEO.",
        category: "seo",
      });
    }
  }

  return deficits;
}
