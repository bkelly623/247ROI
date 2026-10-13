import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const CANONICAL_PAGES = [
  ["missed-call-calculator", "/missed-call-calculator"],
  ["plumbing-ai-receptionist", "/plumbing-ai-receptionist"],
  ["hvac-ai-receptionist", "/hvac-ai-receptionist"],
  ["roofing-estimate-follow-up", "/roofing-estimate-follow-up"],
  ["ai-estimator", "/ai-estimator"],
  ["ai-follow-up-agent", "/ai-follow-up-agent"],
  ["contractor-bid-assistant", "/contractor-bid-assistant"],
  ["privacy-policy", "/privacy-policy"],
  ["terms-of-service", "/terms-of-service"],
  ["consent", "/consent"],
  ["guarantee", "/guarantee"],
];

const EXPECTED_INDEXABLE_PATHS = [
  "/",
  "/ai-opportunity-audit",
  "/services",
  "/ai-employees",
  "/demo",
  "/contact",
  "/articles",
  "/about",
  "/brendan-kelly",
  "/referral-partners",
  "/missed-call-calculator",
  "/missed-call-text-back",
  "/llms.txt",
  "/llms-full.txt",
  "/plumbing-ai-receptionist",
  "/hvac-ai-receptionist",
  "/roofing-estimate-follow-up",
  "/ai-estimator",
  "/ai-follow-up-agent",
  "/contractor-bid-assistant",
  "/privacy-policy",
  "/terms-of-service",
  "/consent",
  "/guarantee",
  "/transcripts",
];

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function extractIndexablePaths(source: string) {
  const match = source.match(/const INDEXABLE_PATHS = \[([\s\S]*?)\];/);
  assert.ok(match, "INDEXABLE_PATHS array must remain in sitemap.ts");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function aiEmployeeRoutes(source: string) {
  return [...source.matchAll(/route:\s*"(\/ai-employees\/[^"]+)"/g)].map((m) => m[1]);
}

function seoLandingPaths(source: string) {
  const start = source.indexOf("export const SEO_LANDING_PAGES");
  const end = source.indexOf("export const SEO_LANDING_PAGE_PATHS");
  assert.ok(start >= 0 && end > start, "SEO_LANDING_PAGES export must remain parseable");
  const block = source.slice(start, end);
  return [...block.matchAll(/^\s*slug:\s*"([^"]+)"/gm)].map((m) => `/${m[1]}`);
}

function articlePaths(source: string) {
  const start = source.indexOf("export const ARTICLES");
  const end = source.indexOf("export function getArticle");
  assert.ok(start >= 0 && end > start, "ARTICLES export must remain parseable");
  const block = source.slice(start, end);
  return [...block.matchAll(/^\s*(?:slug|"slug")\s*:\s*"([^"]+)"/gm)].map((m) => `/articles/${m[1]}`);
}

function transcriptPaths() {
  const index: Array<{ slug: string; publishedAt: string }> = JSON.parse(read("content/transcripts/index.json"));
  return index
    .filter((t) => typeof t?.slug === "string")
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .map((t) => `/transcripts/${t.slug}`);
}

function main() {
  for (const [dir, canonical] of CANONICAL_PAGES) {
    const source = read(`src/app/${dir}/page.tsx`);
    const escaped = canonical.replace(/\//g, "\\/");
    assert.match(
      source,
      new RegExp(`alternates:\\s*\\{\\s*canonical:\\s*"${escaped}"\\s*\\}`),
      `${dir} must export self-referencing canonical ${canonical}`,
    );
    assert.match(source, /export const metadata:\s*Metadata/, `${dir} must use typed Metadata export`);
    assert.doesNotMatch(source, /["']use client["']/, `${dir} remains a server page that can export metadata`);
  }

  const guarantee = read("src/app/guarantee/page.tsx");
  assert.doesNotMatch(guarantee, /\btitle\s*:/, "guarantee metadata adds only canonical");
  assert.doesNotMatch(guarantee, /\bdescription\s*:/, "guarantee metadata adds only canonical");

  const layout = read("src/app/layout.tsx");
  assert.match(layout, /metadataBase:\s*new URL\(SITE_URL\)/);

  const sitemap = read("src/app/sitemap.ts");
  assert.doesNotMatch(sitemap, /\blastModified\b/);
  assert.doesNotMatch(sitemap, /new Date\s*\(/);
  assert.deepEqual(extractIndexablePaths(sitemap), EXPECTED_INDEXABLE_PATHS);
  assert.match(
    sitemap,
    /return\s*\[\s*\.\.\.baseUrls\s*,\s*\.\.\.aiEmployeeUrls\s*,\s*\.\.\.seoLandingUrls\s*,\s*\.\.\.articleUrls\s*,\s*\.\.\.transcriptUrls\s*\]/,
  );
  assert.match(sitemap, /AI_EMPLOYEE_OFFERS\.map/);
  assert.match(sitemap, /SEO_LANDING_PAGE_PATHS\.map/);
  assert.match(sitemap, /ARTICLE_PATHS\.map/);
  assert.match(sitemap, /getTranscriptsIndex/);
  assert.doesNotMatch(sitemap, /\/payment\//);
  assert.doesNotMatch(sitemap, /\/dashboard/);

  const expectedPaths = [
    ...EXPECTED_INDEXABLE_PATHS,
    ...aiEmployeeRoutes(read("src/lib/aiEmployees.ts")),
    ...seoLandingPaths(read("src/lib/seoLandingPages.ts")),
    ...articlePaths(read("src/lib/articles.ts")),
    ...transcriptPaths(),
  ];

  assert.equal(expectedPaths.length, new Set(expectedPaths).size, "expected sitemap path set must be unique");
  assert.equal(aiEmployeeRoutes(read("src/lib/aiEmployees.ts")).length, 7);
  assert.equal(seoLandingPaths(read("src/lib/seoLandingPages.ts")).length, 14);
  assert.equal(articlePaths(read("src/lib/articles.ts")).length, 5);
  assert.equal(transcriptPaths().length, 2);
  assert.ok(expectedPaths.includes("/guarantee"));
  assert.ok(expectedPaths.includes("/privacy-policy"));
  assert.ok(!expectedPaths.some((p) => p.startsWith("/payment")));

  console.log(
    `PASS seo foundation: ${CANONICAL_PAGES.length} exact canonicals; sitemap indexable paths frozen (${EXPECTED_INDEXABLE_PATHS.length}); composed public path set ${expectedPaths.length}; no synthetic lastModified`,
  );
}

main();
