/* eslint-disable @typescript-eslint/no-explicit-any -- external Playwright harness */
/**
 * Stage-4 browser verification: summary/delivery UX against intercepted real fixture.
 * Uses Hermes Playwright; does not submit email or call real providers.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("/home/precision_focused_solutions/.hermes/hermes-agent/node_modules/playwright");

const FRESH_PATH =
  "/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/website-ops/audit-sales-stage3/stage3-final-session.json";
const OUT_DIR =
  process.env.STAGE4_OUTPUT_DIR ||
  "/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/website-ops/audit-sales-stage4";

async function main() {
  const base = process.env.AUDIT_BASE ?? "http://127.0.0.1:3224";
  mkdirSync(OUT_DIR, { recursive: true });
  const fixture = JSON.parse(readFileSync(FRESH_PATH, "utf8"));
  const session = fixture.session;
  assert.ok(session?.report?.assessment, "fresh fixture must include assessment");
  const id = session.id;

  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const results: Record<string, unknown>[] = [];

  try {
    for (const width of [390, 1280]) {
      for (const routeName of ["report", "present"] as const) {
        const page = await browser.newPage({ viewport: { width, height: 844 } });
        // tsx/esbuild names inline functions inside evaluate closures.
        await page.addInitScript('window.__name = (fn) => fn');
        let runs = 0;
        let emailPosts = 0;
        const errors: string[] = [];
        page.on("pageerror", (e: Error) => errors.push(e.message));

        await page.route("**/*", async (route: any) => {
          const req = route.request();
          const u = new URL(req.url());
          if (u.origin !== base) return route.abort();
          if (!u.pathname.startsWith("/api/")) return route.continue();
          if (u.pathname.endsWith("/run")) {
            runs++;
            return route.abort();
          }
          if (req.method() === "POST" && /email|mail|subscribe/i.test(u.pathname)) {
            emailPosts++;
            return route.abort();
          }
          if (u.pathname.startsWith(`/api/sessions/${id}`) || u.pathname.startsWith("/api/sessions/")) {
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({ session }),
            });
          }
          return route.fulfill({ json: { ok: true } });
        });

        await page.goto(`${base}/${routeName}/${id}`, { waitUntil: "domcontentloaded" });
        const summary = page.getByTestId("report-summary");
        await summary.waitFor({ timeout: 20000 });

        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);

        await page.getByTestId("report-seo-card").waitFor();
        await page.getByTestId("report-ai-card").waitFor();
        const seoValue = await page.getByTestId("report-seo-card-value").innerText();
        assert.match(seoValue, /Incomplete|Not measured|\d+ \/ 100/);
        assert.doesNotMatch(seoValue, /^100\s*\/\s*100/);

        const details = page.getByTestId("report-full-details");
        assert.equal(await details.evaluate((el: HTMLDetailsElement) => el.open), false);
        await details.locator(":scope > summary").click();
        assert.equal(await details.evaluate((el: HTMLDetailsElement) => el.open), true);
        await page.getByTestId("assessment-summary").waitFor();

        // Copy success
        await page.evaluate(() => {
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText: async (t: string) => { (window as any).__copied = t; } },
          });
        });
        await page.getByTestId("copy-report-link").click();
        const copied = await page.evaluate(() => (window as any).__copied as string);
        assert.equal(copied, `${base}/report/${encodeURIComponent(id)}`);
        assert.match(await page.getByTestId("report-delivery-actions").getByRole("status").innerText(), /anyone with this link|Anyone with this link/i);

        // Clipboard denied → selectable fallback
        await page.evaluate(() => {
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: {
              writeText: async () => {
                throw new Error("SECRET-clipboard-denied");
              },
            },
          });
        });
        await page.getByTestId("copy-report-link").click();
        const fallback = page.getByTestId("copy-fallback-input");
        await fallback.waitFor();
        assert.equal(await fallback.inputValue(), `${base}/report/${encodeURIComponent(id)}`);
        const statusText = await page.getByTestId("report-delivery-actions").getByRole("status").innerText();
        assert.match(statusText, /Clipboard permission|Select the link|copy it manually/i);
        assert.doesNotMatch(statusText, /SECRET-clipboard-denied/);

        // Print invocation + print media visibility
        await page.evaluate(() => {
          (window as any).__printed = 0;
          window.print = () => {
            (window as any).__printed++;
          };
        });
        await page.getByTestId("print-report").click();
        assert.equal(await page.evaluate(() => (window as any).__printed), 1);

        await details.locator(":scope > summary").click();
        assert.equal(await details.evaluate((el: HTMLDetailsElement)=>el.open),false);
        await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
        assert.equal(await details.evaluate((el: HTMLDetailsElement)=>el.open),true);
        await page.emulateMedia({ media: "print" });
        const deliveryHidden = await page.getByTestId("report-delivery-actions").evaluate((el) => {
          return window.getComputedStyle(el).display === "none";
        });
        assert.equal(deliveryHidden, true, "delivery toolbar hidden in print");
        const evidenceVisible = await page.getByTestId("assessment-summary").evaluate((el) => {
          return window.getComputedStyle(el).display !== "none";
        });
        assert.equal(evidenceVisible, true, "evidence readable in print");
        assert((await page.getByTestId("assessment-summary").boundingBox())!.height > 0);
        if(width===1280 && routeName==="report") await page.pdf({path:OUT_DIR+'/247ROI-full-report.pdf',format:'A4',printBackground:true,margin:{top:'12mm',bottom:'12mm',left:'12mm',right:'12mm'}});
        await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
        await page.emulateMedia({ media: "screen" });

        const cta = page.getByTestId("consultation-link");
        const href = await cta.getAttribute("href");
        assert.equal(href, `/ai-opportunity-audit?visibility=${encodeURIComponent(id)}`);

        // No email form / gate
        assert.equal(await page.locator('input[type="email"], form[action*="email"]').count(), 0);
        assert.equal(emailPosts, 0);

        // Re-run control removed from saved report chrome
        assert.equal(await page.getByRole("button", { name: /re-run audit/i }).count(), 0);

        await page.evaluate(()=>{document.documentElement.style.scrollBehavior="auto";window.scrollTo(0,0);});
        await page.screenshot({
          path: `${OUT_DIR}/stage4-${routeName}-${width}.png`,
          fullPage: true,
        });

        await page.reload({ waitUntil: "domcontentloaded" });
        await page.getByTestId("report-summary").waitFor({ timeout: 20000 });
        assert.equal(runs, 0, "saved reload must not hit /run");
        assert.deepEqual(errors, []);

        results.push({
          width,
          routeName,
          overflow: false,
          copyOk: true,
          copyDeniedFallback: true,
          printInvoked: true,
          printHidesDelivery: deliveryHidden,
          ctaHref: href,
          reopenRuns: runs,
          emailPosts,
          emailGates: 0,
        });
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  assert.equal(results.length, 4);
  writeFileSync(`${OUT_DIR}/stage4-browser-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ ok: true, results, outDir: OUT_DIR }));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
