/* eslint-disable @typescript-eslint/no-explicit-any -- external Playwright test harness */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { runAuditPipeline } from "../src/lib/audit/audit-engine";
const require = createRequire(import.meta.url);
const { chromium } = require('/home/precision_focused_solutions/.hermes/hermes-agent/node_modules/playwright');
const base = process.env.AUDIT_QA_BASE || 'http://127.0.0.1:3189';
async function main() {
  // Explicitly offline provider responses, never a real visibility measurement.
  for (const key of ['GOOGLE_PAGESPEED_API_KEY','PAGESPEED_API_KEY','PAGE_SPEED_API_KEY','GOOGLE_PSI_API_KEY','PSI_API_KEY','PAGESPEED_INSIGHTS_API_KEY','SERPAPI_KEY','SERP_API_KEY','SERPAPI_API_KEY','GOOGLE_PLACES_API_KEY','GOOGLE_PLACES_KEY','PLACES_API_KEY']) delete process.env[key];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => new Response(String(url).endsWith('robots.txt') ? 'User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml' : '<html><title>Independent consulting fixture</title><meta name="description" content="Business automation consulting"><h1>Business automation consulting</h1><p>Useful business consulting.</p></html>', { status: 200 });
  const report = await runAuditPipeline({ businessName: '247ROI', websiteUrl: 'https://example.com', zipCode: '27401' });
  globalThis.fetch = originalFetch;
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    for (const width of [390,1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, acceptDownloads: true });
      const id = '11111111-1111-4111-8111-111111111111';
      let runs = 0;
      await page.route('**/*', async (route: any) => {
        const req = route.request(); const url = new URL(req.url());
        if (url.origin !== base) return route.abort();
        if (!url.pathname.startsWith('/api/')) return route.continue();
        if (url.pathname.endsWith('/run')) { runs++; return route.fulfill({ json: { report } }); }
        if (url.pathname === `/api/sessions/${id}`) return route.fulfill({ json: { session: { id, business_name: '247ROI', website_url: 'https://example.com', zip_code: '27401', status: 'complete', mode: 'organic', report } } });
        return route.fulfill({ json: { ok: true } });
      });
      await page.goto(`${base}/present/${id}`);
      await page.getByText('247ROI', { exact: true }).first().waitFor();
      await page.waitForTimeout(800);
      assert.equal(runs, 0, 'saved report open must not start a new scan');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'no horizontal overflow');
      const body = await page.locator('body').innerText();
      assert(!body.includes('AI cannot confidently recommend you'));
      assert(!body.includes('home services in 27401'));
      const opportunityLinks = await page.locator('a[href*="/ai-opportunity-audit"]').count();
      assert(opportunityLinks > 0, 'qualification CTA is a native navigable link');
      await page.reload(); await page.getByText('247ROI', { exact: true }).first().waitFor();
      assert.equal(runs, 0, 'refresh must reopen saved evidence without collection');
      await page.screenshot({ path: `/tmp/247roi-visibility-${width}.png`, fullPage: true });
      await page.close();
      console.log(`PASS offline browser ${width}: saved report/reopen, no scan rerun, qualification links, no horizontal overflow`);
    }
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
