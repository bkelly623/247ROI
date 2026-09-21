import assert from "node:assert/strict";
import { probeSiteReview, isPublicSiteAddress, siteReviewRobotsAllows, type SiteReviewDependencies } from "../src/lib/audit/probes/site-review";

const origin = "https://public.example.org";
const html = (body = "", title = "Example consultancy") => `<html><head><title>${title}</title><meta content='Independent consulting &amp; research' name='description'><link href='/' rel='canonical'></head><body><h1>Research <em>and strategy</em></h1>${body}</body></html>`;
const link = (path: string) => `<a href='${path}'>${path}</a>`;
function fixture(routes: Record<string, { status?: number; text?: string; headers?: Record<string, string> }>) {
  const calls: string[] = []; let active = 0, maxActive = 0;
  const deps: SiteReviewDependencies = {
    resolve: async () => [{ address: "93.184.215.14", family: 4 }],
    request: async u => {
      calls.push(u.href); active++; maxActive = Math.max(active, maxActive);
      await new Promise(r => setTimeout(r, 2)); active--;
      const route = routes[u.pathname] ?? { status: 404, text: "Not found" };
      return { status: route.status ?? 200, text: route.text ?? "", headers: { "content-type": u.pathname === "/robots.txt" ? "text/plain" : "text/html", ...route.headers } };
    },
  };
  return { deps, calls, max: () => maxActive };
}
async function main() {
  for (const ip of ["127.0.0.1", "10.0.0.1", "169.254.169.254", "100.64.0.1", "192.168.1.1", "172.31.0.1", "::1", "fe80::1", "fc00::1", "::ffff:127.0.0.1", "2001:db8::1", "2002:7f00:1::1"]) assert.equal(isPublicSiteAddress(ip), false, ip);
  assert.equal(isPublicSiteAddress("8.8.8.8"), true);
  assert.equal(isPublicSiteAddress("2606:4700:4700::1111"), true);
  const policy = "User-agent: *\nDisallow: /services\nAllow: /services/public$\nUser-agent: OtherBot\nDisallow: /";
  assert.equal(siteReviewRobotsAllows(policy, new URL("/services/private", origin)), false);
  assert.equal(siteReviewRobotsAllows(policy, new URL("/%73ervices/private", origin)), false);
  assert.equal(siteReviewRobotsAllows("User-agent: *\nDisallow:\nUser-agent: OtherBot\nDisallow: /", new URL(origin)), true);
  assert.equal(siteReviewRobotsAllows("User-agent: *\nDisallow: /*private$", new URL("/services/private", origin)), false);
  assert.equal(siteReviewRobotsAllows("User-agent: *\nDisallow: /*private$", new URL("/services/private/public", origin)), true);
  assert.equal(siteReviewRobotsAllows(policy, new URL("/services/public", origin)), true);
  assert.equal(siteReviewRobotsAllows(policy, new URL("/about", origin)), true);
  assert.equal(siteReviewRobotsAllows("User-agent: *\nDisallow: /\nUser-agent: 247ROI-AuditBot\nAllow: /", new URL(origin)), true);

  const routes = fixture({
    "/robots.txt": { text: "User-agent: *\nDisallow: /services/private" },
    "/": { text: html(["/services", "/about", "/contact", "/services/private", "/services/missing", "/services/denied", "/unfetched"].map(link).join("") + "<script>const sample=\"<a href='/services/fake'>fake</a>\";</script>") },
    "/services": { text: html("<meta name='robots' content='noindex'>") },
    "/about": { text: html() }, "/contact": { text: html() },
    "/services/denied": { status: 403 },
  });
  const sample = await probeSiteReview({ websiteUrl: origin }, routes.deps);
  assert.equal(sample.status, "partial");
  assert.equal(sample.coverage.inspected, 4);
  assert.equal(sample.coverage.discovered, 7);
  assert.equal(sample.duplicateTitles[0].urls.length, 4);
  assert.equal(sample.duplicateDescriptions[0].urls.length, 4);
  assert.equal(sample.brokenLinks.length, 1);
  assert.equal(sample.brokenLinks[0].url, origin + "/services/missing");
  assert.equal(sample.pages[0].headings[0].text, "Research and strategy");
  assert.equal(sample.pages[0].metaDescription, "Independent consulting & research");
  assert.equal(sample.pages.find(p => p.url.endsWith("/services"))?.noindex, true);
  assert.ok(sample.findings.every(f => !f.finding.includes("403") && !f.finding.includes("LocalBusiness")));
  assert.ok(!routes.calls.includes(origin + "/services/private"));
  assert.ok(!routes.calls.includes(origin + "/unfetched"));
  assert.ok(routes.max() <= 3);

  const many = fixture({ "/robots.txt": { status: 404 }, "/": { text: html(Array.from({ length: 30 }, (_, n) => link(`/services/${n}`)).join("")) } });
  const bounded = await probeSiteReview({ websiteUrl: origin }, many.deps);
  assert.equal(bounded.coverage.attempted, 8); assert.equal(many.calls.length, 9); assert.ok(many.max() <= 3);

  for (const websiteUrl of ["http://127.0.0.1", "http://2130706433", "http://169.254.169.254", "https://a:b@public.example.org", "http://[::ffff:127.0.0.1]", "http://localhost", "http://foo.local"]) {
    const f = fixture({}); const r = await probeSiteReview({ websiteUrl }, f.deps);
    assert.equal(r.status, "unavailable"); assert.equal(f.calls.length, 0, websiteUrl);
  }
  const dns = fixture({}); dns.deps.resolve = async () => [{ address: "8.8.8.8", family: 4 }, { address: "10.0.0.1", family: 4 }];
  assert.equal((await probeSiteReview({ websiteUrl: origin }, dns.deps)).status, "unavailable"); assert.equal(dns.calls.length, 0);

  for (const location of ["http://169.254.169.254/", "https://private.example.org/", "/services/private"]) {
    const f = fixture({ "/robots.txt": { text: "User-agent: *\nDisallow: /services/private" }, "/": { status: 302, headers: { location } } });
    f.deps.resolve = async host => [{ address: host === "private.example.org" ? "10.0.0.2" : "8.8.8.8", family: 4 }];
    assert.equal((await probeSiteReview({ websiteUrl: origin }, f.deps)).status, "unavailable"); assert.equal(f.calls.length, 2);
  }
  for (const route of [{ status: 403 }, { status: 429 }, { status: 200, text: "<html><title>Just a moment</title></html>" }]) {
    const f = fixture({ "/robots.txt": { status: 404 }, "/": route });
    const r = await probeSiteReview({ websiteUrl: origin }, f.deps);
    assert.equal(r.status, "unavailable"); assert.equal(r.findings.length, 0); assert.equal(f.calls.length, 2);
  }
  const blocked = fixture({ "/robots.txt": { status: 403 }, "/": { text: html() } });
  assert.equal((await probeSiteReview({ websiteUrl: origin }, blocked.deps)).status, "unavailable"); assert.equal(blocked.calls.length, 1);
  const huge = fixture({ "/robots.txt": { status: 404 }, "/": { text: "x".repeat(512 * 1024 + 1) } });
  assert.equal((await probeSiteReview({ websiteUrl: origin }, huge.deps)).pages[0].error, "body_limit");
  const stalled = fixture({}); stalled.deps.resolve = async () => new Promise(() => {}); stalled.deps.timeoutMs = 15;
  const before = Date.now(); assert.equal((await probeSiteReview({ websiteUrl: origin }, stalled.deps)).status, "unavailable"); assert.ok(Date.now() - before < 500);
  const bodyStalled = fixture({}); bodyStalled.deps.request = async () => new Promise(() => {}); bodyStalled.deps.timeoutMs = 15;
  assert.equal((await probeSiteReview({ websiteUrl: origin }, bodyStalled.deps)).status, "unavailable");
  console.log("PASS: offline site review safety, robots, metadata, duplicates, broken-link evidence, bounded sampling/concurrency/body/deadline; synthetic fixtures only.");
  if (process.argv.includes("--live")) {
    const r = await probeSiteReview({ websiteUrl: "https://example.com" });
    console.log("LIVE PUBLIC READ", JSON.stringify(r, null, 2));
    assert.ok(r.coverage.inspected > 0, "Live public HTML inspection must actually succeed");
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
