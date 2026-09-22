import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { probeSiteCrawl, siteCrawlDeficits } from "../src/lib/audit/probes/site-crawl";
import { probePageSpeed } from "../src/lib/audit/probes/pagespeed";

async function main() {
  const unavailable = await probeSiteCrawl("https://example.com", async () => ({ status: 404, text: "<html>Not found</html>" }));
  assert.equal(unavailable.fetched, false, "404 is not a measured website");
  const site = await probeSiteCrawl("https://example.com", async (url) => ({
    status: url.endsWith("robots.txt") ? 404 : 200,
    text: url.endsWith("robots.txt") ? "<html>not found</html>" : url.endsWith("sitemap.xml") ? '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>' : '<html><title>Consulting</title><h1>Consulting</h1><script type="application/ld+json">{"@type":"Organization","name":"Example"}</script></html>',
  }));
  assert.equal(site.hasRobotsTxt, false, "HTML 404 cannot establish robots.txt");
  assert.equal(site.hasSitemap, true, "sitemap index is supported");
  assert(!siteCrawlDeficits(site).some(d => d.finding.includes("LocalBusiness") && d.severity === "critical"));

  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  process.env.GOOGLE_PAGESPEED_API_KEY = "offline-fixture-not-a-credential";
  globalThis.fetch = async (_url, options) => {
    assert(options?.signal, "PageSpeed must have a bounded fetch/body deadline");
    return Response.json({ lighthouseResult: { categories: { performance: { score: 0.8 }, seo: { score: 1 } }, audits: { "total-blocking-time": { numericValue: 900 } } } });
  };
  try {
    const ps = await probePageSpeed("https://example.com");
    assert.equal(ps.inpMs, null, "TBT cannot masquerade as measured INP");
    assert.equal(ps.performanceScore, 80);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GOOGLE_PAGESPEED_API_KEY;
    else process.env.GOOGLE_PAGESPEED_API_KEY = originalKey;
  }
  const runSource = readFileSync("src/lib/audit/run-audit.ts", "utf8");
  assert(!runSource.includes("dispatchToAthena"), "no duplicate remote execution");
  const viewSource = readFileSync("src/components/audit/PresentView.tsx", "utf8");
  assert(viewSource.includes("if (sessionData.session.report) return;"), "saved report reopened without collection");
  assert(viewSource.includes("void load()"));
  assert(!viewSource.includes("updated API keys"), "no developer troubleshooting in prospect UX");
  console.log("PASS: offline reliability checks — 404/robots/sitemap/schema, bounded PageSpeed, INP honesty, no duplicate dispatch, saved report reuse.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
