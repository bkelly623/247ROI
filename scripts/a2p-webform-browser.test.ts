/* eslint-disable @typescript-eslint/no-explicit-any -- browser acceptance harness */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/home/precision_focused_solutions/.openclaw/workspace/node_modules/playwright-core");
const base = process.env.SITE_BASE || "http://127.0.0.1:3637";
const V3 = "247roi-llc-inquiry-v3";

async function main() {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    for (const path of ["/contact", "/consent"]) for (const checked of [false, true]) {
      const page = await browser.newPage();
      const captured: any[] = [];
      // Every submission is fulfilled locally; nothing reaches the real endpoint.
      await page.route("**/api/contact", async (route: any) => {
        captured.push(route.request().postDataJSON());
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, saved: true, reference: "offline-test-ref", notification: "queued" }) });
      });
      await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
      const boxes = page.locator('form input[type="checkbox"]');
      assert.equal(await boxes.count(), 1, `${path}: exactly one checkbox`);
      const box = page.locator("#contact-sms-consent");
      assert.equal(await box.isChecked(), false, `${path}: starts unchecked`);
      assert.equal(await box.getAttribute("required"), null, `${path}: not required`);
      assert.equal(await page.locator("#contact-review-consent").count(), 0);
      await page.fill("#contact-name", "Offline Test");
      await page.fill("#contact-phone", "+12025550123");
      await page.fill("#contact-message", "Offline browser test, intercepted.");
      if (checked) await box.check();
      await page.click('button[type="submit"]');
      await page.getByText("Your message is saved.").waitFor({ timeout: 15000 });
      assert.equal(captured.length, 1);
      const body = captured[0];
      assert.equal(body.smsConsent, checked);
      assert.equal(body.consentVersion, V3);
      assert.equal("reviewConsent" in body, false);
      assert.equal("reviewConsentVersion" in body, false);
      assert.equal(body.phone, "+12025550123");
      assert.match(body.submissionId, /^[0-9a-f-]{36}$/);
      assert.ok(body.source.startsWith(path.slice(1)));
      console.log(`PASS ${path} checked=${checked}`);
      await page.close();
    }
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
