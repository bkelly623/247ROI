/* eslint-disable @typescript-eslint/no-explicit-any -- browser accessibility harness */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/home/precision_focused_solutions/.hermes/hermes-agent/node_modules/playwright');
async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const results: any[] = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.route('**/api/events', (r: any) => r.fulfill({ json: { ok: true } }));
    for (const path of ['/', '/contact', '/demo', '/missed-call-text-back', '/services']) {
      await page.goto('http://127.0.0.1:3637' + path);
      await page.waitForTimeout(650);
      await page.addScriptTag({ path: require.resolve('axe-core') });
      const violations = await page.evaluate(async () => {
        const result = await (window as any).axe.run({ include: [['main'], ['footer']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
        return result.violations.map((v: any) => ({
          id: v.id, impact: v.impact,
          nodes: v.nodes.map((n: any) => ({ target: n.target, summary: n.failureSummary, html: n.html })),
        }));
      });
      results.push({ path, violations });
    }
    writeFileSync('/tmp/247roi-client-ready-qa/accessibility.json', JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
