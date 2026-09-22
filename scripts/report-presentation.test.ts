/**
 * Pure fixture tests for Stage-4 report presentation.
 * No network, credentials, or provider calls.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildReportPresentation,
  canonicalReportPath,
  canonicalReportUrl,
  consultationHref,
} from "../src/lib/audit/report-presentation";
import type { AuditReport, ScanSession } from "../src/lib/audit/types";

const FRESH_PATH =
  "/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/website-ops/audit-sales-stage3/stage3-final-session.json";
const LEGACY_PATH =
  "/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/website-ops/seo-display-latest-session.json";

function loadSession(path: string): ScanSession {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  return (raw.session ?? raw) as ScanSession;
}

function unmeasuredReport(): AuditReport {
  return {
    opportunityHeadline: "Checks unavailable",
    opportunityIndex: 0,
    sections: [],
    deficits: [],
    packages: {
      primary: {
        id: "foundation",
        headline: "Review findings",
        description: "No measured opportunities yet.",
        priceFrame: "custom",
        ctaLabel: "Discuss",
        ctaUrl: "#",
      },
      secondary: {
        id: "ai_visibility",
        headline: "Optional",
        description: "Optional next step.",
        priceFrame: "custom",
        ctaLabel: "Discuss",
        ctaUrl: "#",
      },
    },
    growthTiers: [],
    sitePreview: { screenshotUrl: null, beforeAnnotations: [], afterAnnotations: [] },
    guideSteps: [],
    advisorSteps: [],
    progressEvents: [],
  } as unknown as AuditReport;
}

function main() {
  const fresh = loadSession(FRESH_PATH);
  assert.ok(fresh.report, "fresh fixture has report");
  const freshId = fresh.id;
  const freshP = buildReportPresentation(fresh, fresh.report!, freshId);

  assert.equal(freshP.isLegacy, false);
  assert.equal(freshP.seoCard.value, "Incomplete");
  assert.doesNotMatch(freshP.seoCard.value, /^100/);
  assert.doesNotMatch(freshP.headline, /100/);
  assert.match(freshP.aiCard.value, /0 \/ 6 mentions/);
  assert.ok(freshP.opportunities.length >= 1 && freshP.opportunities.length <= 3);
  assert.ok(
    !freshP.opportunities.some((o) => /measurement.?gap/i.test(o.title + o.evidence))
  );
  assert.doesNotMatch(freshP.headline, /bounds|revenue|competitor rank/i);
  assert.equal(freshP.consultationHref, `/ai-opportunity-audit?visibility=${encodeURIComponent(freshId)}`);
  assert.equal(freshP.reportPath, `/report/${encodeURIComponent(freshId)}`);
  assert.equal(
    canonicalReportUrl("https://www.get247roi.com", freshId),
    `https://www.get247roi.com/report/${encodeURIComponent(freshId)}`
  );
  assert.equal(canonicalReportPath("a/b?x=1"), "/report/a%2Fb%3Fx%3D1");
  assert.equal(consultationHref(freshId), freshP.consultationHref);
  // Technical 100 must stay subordinate — never overall SEO display.
  assert.equal(freshP.seoCard.supporting.length, 0);
  assert.notEqual(freshP.seoCard.value, "100 / 100");

  const legacy = loadSession(LEGACY_PATH);
  assert.ok(legacy.report);
  // Ensure we treat missing assessment as legacy even if fixture later gains one.
  const legacyReport = { ...legacy.report!, assessment: undefined };
  const legacyP = buildReportPresentation(legacy, legacyReport, legacy.id);
  assert.equal(legacyP.isLegacy, true);
  assert.equal(legacyP.seoCard.value, "Not measured");
  assert.match(legacyP.seoCard.detail, /Legacy|does not include/i);
  assert.match(legacyP.aiCard.value, /mentions|Not measured/);
  assert.doesNotMatch(legacyP.seoCard.value, /^0$/);
  assert.doesNotMatch(legacyP.aiCard.detail, /forced weakness|must improve/i);

  const bareSession: ScanSession = {
    id: "unmeasured-session",
    business_name: "Example Co",
    website_url: "https://example.com",
    zip_code: "00000",
    mode: "organic",
    status: "complete",
  } as ScanSession;
  const unmeasured = buildReportPresentation(bareSession, unmeasuredReport(), bareSession.id);
  assert.equal(unmeasured.seoCard.value, "Not measured");
  assert.equal(unmeasured.aiCard.value, "Not measured");
  assert.doesNotMatch(unmeasured.seoCard.value, /^0/);
  assert.doesNotMatch(unmeasured.aiCard.value, /^0 \/ 0/);
  assert.match(unmeasured.intro, /Legacy|measured/i);

  // Synthetic negative control: unavailable AI is unknown, never 0/1 absence.
  const failed = structuredClone(legacyReport);
  failed.aiSampling=undefined;
  failed.googleAIMode=undefined;
  failed.chatGPT={...legacyReport.chatGPT!,state:'unavailable',mentioned:null,cited:null,error:'offline fixture'};
  assert.equal(buildReportPresentation(legacy,failed,legacy.id).aiCard.value,'Not measured');
  // A new assessed report with no opportunities must not revive old legacy pitches.
  const positive=structuredClone(fresh.report!);
  positive.assessment!.opportunities=[];
  positive.assessment!.seo.overall=85;positive.assessment!.seo.incomplete=false;
  const strong=buildReportPresentation(fresh,positive,freshId);
  assert.equal(strong.seoCard.value,'85 / 100');assert.equal(strong.opportunities.length,0);
  console.log(
    JSON.stringify({
      ok: true,
      fresh: {
        seo: freshP.seoCard.value,
        ai: freshP.aiCard.value,
        opportunities: freshP.opportunities.length,
        href: freshP.consultationHref,
      },
      legacy: { seo: legacyP.seoCard.value, ai: legacyP.aiCard.value },
      unmeasured: { seo: unmeasured.seoCard.value, ai: unmeasured.aiCard.value },
    })
  );
}

main();
