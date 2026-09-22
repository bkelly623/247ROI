/**
 * Stage 3 retained DataForSEO pilot integration — offline only.
 * Paths via STAGE3_PILOT / STAGE3_OUTPUT / STAGE3_SESSION / STAGE3_SITE_REVIEW.
 * Never sends paid requests.
 */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  admitReviewedCompetitors,
  admitReviewedContent,
  buildAuditAssessment,
  deriveOpportunities,
  LOCAL_AUTHORITY_WEIGHTS,
  REMOTE_AUTHORITY_WEIGHTS,
  ReviewedCompetitorEvidenceSchema,
  ReviewedContentEvidenceSchema,
  scoreAiAssessment,
  scoreSeoAssessment,
  weightedKnown,
  type DimensionCheck,
  type ReviewedCompetitorEvidence,
  type ReviewedContentEvidence,
} from "../src/lib/audit/assessment";
import { AuditContextSchema } from "../src/lib/audit/audit-context";
import {
  parsePilotDirectory,
  parseRetainedOrganicCheck,
  verifyRetainedArtifact,
} from "../src/lib/audit/probes/dataforseo-retained";
import { executeFullAudit } from "../src/lib/audit/run-audit";
import type { AuditReport } from "../src/lib/audit/types";
import type { SiteReviewResult } from "../src/lib/audit/probes/site-review";

Object.assign(process.env, { NODE_ENV: "test" });

const PILOT =
  process.env.STAGE3_PILOT ||
  "/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/website-ops/audit-sales-stage3/live-pilot";
const OUTPUT =
  process.env.STAGE3_OUTPUT ||
  "/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/website-ops/audit-sales-stage3/stage3-final-session.json";
const SESSION_PATH =
  process.env.STAGE3_SESSION ||
  "/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/website-ops/seo-display-latest-session.json";
const SITE_REVIEW_PATH =
  process.env.STAGE3_SITE_REVIEW ||
  "/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/website-ops/audit-sales-stage3/fresh-free-site-review.json";

function readPilot(name: string): string {
  return readFileSync(join(PILOT, name), "utf8");
}

async function main() {
  const ctx = {
    businessName: "247ROI",
    websiteUrl: "https://get247roi.com",
    expectedLocation: "United States",
  };

  // --- Parse all 14 retained captures ---
  const pilot = parsePilotDirectory(readPilot, ctx);
  assert.equal(pilot.hashes.length, 14, "all 14 raw hashes verified");
  assert.equal(new Set(pilot.hashes).size, 14, "hashes unique");
  assert.equal(pilot.directRank.checks.length, 8);
  assert.equal(pilot.aiSampling.samples.length, 6);
  assert.equal(pilot.directRank.transportCalls, 0);
  assert.equal(pilot.directRank.publicPaidCollection, "disabled");

  for (const check of pilot.directRank.checks) {
    assert.equal(check.completeTop20Window, false, "partial depth must not certify complete top20");
    assert.ok(["unknown_incomplete", "ranked"].includes(check.outcome));
    assert.ok(check.checkedDepth >= 1 && check.checkedDepth < 20);
    const positions = new Set(check.hits.map(h => h.position));
    for (let p=1; p<=check.checkedDepth; p++) assert(positions.has(p));
    assert(!positions.has(check.checkedDepth+1));
    assert.ok(check.hits.every(h => !h.isTarget), "no own-domain organic match");
    assert.ok(check.sourceIds.some(id => id.startsWith("sha256:")));
  }
  assert.match(pilot.directRank.methodology, /DataForSEO/);

  assert.equal(pilot.aiSampling.summary.mentions.count, 0);
  assert.equal(pilot.aiSampling.summary.mentions.denominator, 6);
  assert.equal(pilot.aiSampling.summary.citations.count, 0);
  assert.ok(pilot.scopeWarnings.length >= 1, "LA geographic scope warning required");
  assert.ok(pilot.scopeWarnings.some(w => /Los Angeles/i.test(w)));

  for (const sample of pilot.aiSampling.samples) {
    assert.equal(sample.evidence.state, "observed");
    assert.equal(sample.evidence.mentioned, false);
    assert.equal(sample.evidence.cited, false);
    assert.equal(sample.evidence.source, "dataforseo");
    if (sample.engine === "chatgpt") {
      assert.ok("product" in sample.evidence);
      assert.equal((sample.evidence as { modelObserved?: string | null }).modelObserved, null);
      // Citations come from sources, not fabricated
      assert.ok(Array.isArray(sample.evidence.citations));
    }
  }

  // Hash / scope / query rejection
  const badReceipt = JSON.parse(readPilot("00-organic.receipt.json"));
  badReceipt.rawSha256 = "0".repeat(64);
  const mismatch = verifyRetainedArtifact(
    {
      rawJson: readPilot("00-organic.raw.json"),
      receipt: badReceipt,
      reservation: JSON.parse(readPilot("00-organic.reservation.json")),
    },
    { kind: "organic", locationCode: 2840 }
  );
  assert.equal(mismatch.ok, false);

  const scopeMismatch = verifyRetainedArtifact(
    {
      rawJson: readPilot("00-organic.raw.json"),
      receipt: JSON.parse(readPilot("00-organic.receipt.json")),
      reservation: JSON.parse(readPilot("00-organic.reservation.json")),
    },
    { kind: "organic", query: "totally different query", locationCode: 2840 }
  );
  assert.equal(scopeMismatch.ok, false);

  const wrongKind = verifyRetainedArtifact(
    {
      rawJson: readPilot("00-organic.raw.json"),
      receipt: JSON.parse(readPilot("00-organic.receipt.json")),
      reservation: JSON.parse(readPilot("00-organic.reservation.json")),
    },
    { kind: "chatgpt", locationCode: 2840 }
  );
  assert.equal(wrongKind.ok, false);

  const organicOk = parseRetainedOrganicCheck(
    {
      rawJson: readPilot("00-organic.raw.json"),
      receipt: JSON.parse(readPilot("00-organic.receipt.json")),
      reservation: JSON.parse(readPilot("00-organic.reservation.json")),
    },
    ctx
  );
  assert.equal(organicOk.ok, true);

  // --- Weighted authority math ---
  const remoteChecks: DimensionCheck[] = [
    { id: "review_evidence", label: "r", score: 0, basis: "owner_confirmed", evidenceRefs: [] },
    { id: "case_proof", label: "c", score: 1, basis: "observed", evidenceRefs: [] },
    { id: "independent_mentions", label: "m", score: 0.5, basis: "observed", evidenceRefs: [] },
  ];
  const remoteWeighted = weightedKnown(remoteChecks, REMOTE_AUTHORITY_WEIGHTS);
  assert.equal(remoteWeighted, (0.4 * 0 + 0.3 * 1 + 0.3 * 0.5) * 100);
  const equalMean = ((0 + 1 + 0.5) / 3) * 100;
  assert.notEqual(remoteWeighted, equalMean, "weights must not equal unweighted mean");

  const localChecks: DimensionCheck[] = [
    { id: "listing_presence", label: "l", score: 1, basis: "observed", evidenceRefs: [] },
    { id: "review_evidence", label: "r", score: 0, basis: "owner_confirmed", evidenceRefs: [] },
    { id: "case_proof", label: "c", score: 0.5, basis: "observed", evidenceRefs: [] },
  ];
  const localWeighted = weightedKnown(localChecks, LOCAL_AUTHORITY_WEIGHTS);
  assert.equal(localWeighted, (0.25 * 1 + 0.45 * 0 + 0.3 * 0.5) * 100);

  // --- Admissions validation ---
  assert.equal(admitReviewedContent([{ checkId: "dedicated_landing", score: 1 }]).length, 0);
  assert.equal(
    ReviewedContentEvidenceSchema.safeParse({
      pageUrl: "https://www.get247roi.com/services",
      checkId: "dedicated_landing",
      score: 1,
      excerpt: "Business systems built with AI agents, automation, and custom software.",
      provenance: "fresh-free-site-review.json headings",
      reviewer: "analyst_review",
    }).success,
    true
  );

  const malformedCompetitor = ReviewedCompetitorEvidenceSchema.safeParse({
    domain: "zapier.com",
    status: "verified",
    pageUrl: "https://zapier.com",
    excerpt: "platform",
    provenance: "x",
    serviceOverlap: true,
    geographyOverlap: "verified",
    kind: "directory",
    independentOutcomesVerified: true,
    reviewer: "analyst_review",
  });
  assert.equal(malformedCompetitor.success, false);

  const kivolaro: ReviewedCompetitorEvidence = {
    domain: "kivolaro.com",
    status: "verified",
    pageUrl: "https://kivolaro.com/en-us/services/internal-tools",
    excerpt: "Kivolaro builds custom internal tools for U.S. small businesses with 1–50 employees",
    provenance: "parent-retrieved public service page",
    serviceOverlap: true,
    geographyOverlap: "verified",
    kind: "business_competitor",
    independentOutcomesVerified: false,
    reviewer: "analyst_review",
  };
  const speedy: ReviewedCompetitorEvidence = {
    domain: "speedy.solutions",
    status: "candidate",
    pageUrl: "https://speedy.solutions/solutions/internal-tools/",
    excerpt: "Public page describes internal tools, ops dashboards, audit logs and deployment",
    provenance: "parent-retrieved public service page",
    serviceOverlap: true,
    geographyOverlap: "unverified",
    kind: "business_competitor",
    independentOutcomesVerified: false,
    reviewer: "analyst_review",
  };
  const dacforge: ReviewedCompetitorEvidence = {
    domain: "dacforge.com",
    status: "candidate",
    pageUrl: "https://dacforge.com/services/internal-tool-developer-for-small-business/",
    excerpt: "Dedicated page explains custom dashboards, admin UIs, integrations",
    provenance: "parent-retrieved public service page",
    serviceOverlap: true,
    geographyOverlap: "unverified",
    kind: "business_competitor",
    independentOutcomesVerified: false,
    reviewer: "analyst_review",
  };
  const admittedCompetitors = admitReviewedCompetitors([kivolaro, speedy, dacforge, { domain: "bad" }]);
  assert.equal(admittedCompetitors.length, 3);
  assert.ok(admittedCompetitors.some(c => c.domain === "kivolaro.com" && c.status === "verified"));

  // Reject verified without geography
  assert.equal(
    admitReviewedCompetitors([{ ...kivolaro, geographyOverlap: "unverified", status: "verified" }]).length,
    0
  );

  // --- Load baseline session + optional fresh site review ---
  const sessionEnvelope = JSON.parse(readFileSync(SESSION_PATH, "utf8")) as {
    session: { id: string; report: AuditReport; business_name: string; website_url: string; zip_code: string };
  };
  const baselineReport = sessionEnvelope.session.report;
  assert.ok(baselineReport.auditMeta, "technical baseline present");
  const technicalSnapshot = structuredClone(baselineReport.auditMeta);

  let siteReview: SiteReviewResult | undefined = baselineReport.siteReview;
  try {
    const fresh = JSON.parse(readFileSync(SITE_REVIEW_PATH, "utf8")) as SiteReviewResult;
    if (fresh?.pages?.length && fresh.coverage?.inspected > 0) {
      siteReview = fresh;
    }
  } catch {
    /* keep baseline siteReview */
  }
  assert.ok(siteReview?.pages?.length);
  const priorityPath=process.env.STAGE3_PRIORITY_REVIEW;
  if(priorityPath){
    const extras=JSON.parse(readFileSync(priorityPath,"utf8")) as SiteReviewResult[];
    const pages=new Map(siteReview!.pages.map(p=>[p.finalUrl ?? p.url,p]));
    extras.forEach(r=>r.pages.forEach(p=>pages.set(p.finalUrl ?? p.url,p)));
    siteReview={...siteReview!,pages:[...pages.values()],coverage:{...siteReview!.coverage,inspected:pages.size},samplingLimits:[...siteReview!.samplingLimits,"Priority service/demo pages added from separate free crawls; bounded sample, not whole-site coverage."]};
  }

  // Pilot human review: owner-confirmed no reviews; content only when excerpt supported
  const auditContext = AuditContextSchema.parse({
    geography: "national",
    priorityService: "AI automation consultant",
    buyerType: "small business",
    seoInvestment: "unknown",
    ownerAssertions: {
      reviews: { status: "none", source: "owner_confirmed" },
      gbp: { status: "none", source: "owner_confirmed" },
    },
  });

  const servicesPage = siteReview!.pages.find(p => /\/services\/?$/.test(p.finalUrl ?? p.url));
  const reviewedContent: ReviewedContentEvidence[] = [];
  if (servicesPage) {
    const h1 = servicesPage.headings?.find(h => h.level === 1)?.text;
    const meta = servicesPage.metaDescription;
    if (h1 && /business systems|automation|AI agents|dashboards|internal/i.test(h1)) {
      reviewedContent.push({
        pageUrl: servicesPage.finalUrl ?? servicesPage.url,
        checkId: "dedicated_landing",
        score: 1,
        excerpt: h1,
        provenance: "fresh-free-site-review.json /services h1",
        reviewer: "analyst_review",
      });
    }
    if (meta && /workflow|dashboard|internal|AI agents|owners and operators/i.test(meta)) {
      reviewedContent.push({
        pageUrl: servicesPage.finalUrl ?? servicesPage.url,
        checkId: "service_customer_geo_fit",
        score: 0.5,
        excerpt: meta,
        provenance: "fresh-free-site-review.json /services metaDescription",
        reviewer: "analyst_review",
      });
    }
    // buyer_selection_answers / demo_case_evidence remain unknown without stronger excerpts
  }
  if(process.env.STAGE3_CONTENT_REVIEW){
    const admitted=JSON.parse(readFileSync(process.env.STAGE3_CONTENT_REVIEW,"utf8")).reviews;
    reviewedContent.splice(0,reviewedContent.length,...admitReviewedContent(admitted.map((r:Record<string,unknown>)=>({...r,provenance:"Hermes analyst review of public page; not owner/human review; see analyst-content-review.json"}))));
  }
  assert.ok(admitReviewedContent(reviewedContent).length === reviewedContent.length);

  // --- executeFullAudit with retained bundle; trap paid collectors ---
  let paidTrap = 0;
  const trapTransport = async () => {
    paidTrap++;
    throw new Error("paid collector must not run");
  };
  const report = await executeFullAudit({
    sessionId: sessionEnvelope.session.id,
    businessName: sessionEnvelope.session.business_name || "247ROI",
    websiteUrl: sessionEnvelope.session.website_url || "https://get247roi.com",
    zipCode: sessionEnvelope.session.zip_code || "19008",
    mode: "organic",
    callbackUrl: "http://localhost/callback",
    auditContext,
    previousReport: {
      ...baselineReport,
      siteReview,
    },
    retainedEvidence: {
      directRank: pilot.directRank,
      aiSampling: pilot.aiSampling,
    },
    reviewedContent,
    reviewedCompetitors: [kivolaro, speedy, dacforge],
    directRankOptions: {
      enableCollection: true,
      transport: trapTransport,
      authorize: async () => {
        paidTrap++;
        return true;
      },
    },
    adapters: {
      siteCrawl: async () => JSON.parse(readFileSync(process.env.STAGE3_SITE_CRAWL || "/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/website-ops/audit-sales-stage3/fresh-homepage-crawl.json", "utf8")),
      siteReview: async () => siteReview!,
      domainResearch: async () =>
        baselineReport.domainResearch ?? {
          source: "dataforseo" as const,
          product: "google_labs_domain_research" as const,
          target: "get247roi.com",
          locationCode: 2840 as const,
          locationName: "United States" as const,
          languageCode: "en" as const,
          collectedAt: "2026-01-01T00:00:00.000Z",
          databaseUpdatedAt: null,
          methodology: "offline-fixture",
          rankedKeywords: {
            state: "no_data" as const,
            totalDatabaseItems: 0,
            keywords: [],
            competitors: [],
            organicKeywordCount: null,
            estimatedMonthlyTraffic: null,
          },
          relatedCompetitors: {
            state: "no_data" as const,
            totalDatabaseItems: 0,
            keywords: [],
            competitors: [],
            organicKeywordCount: null,
            estimatedMonthlyTraffic: null,
          },
        },
      pricing: async () => null,
      runPipeline: async () => ({
        ...baselineReport,
        siteReview,
        auditMeta: technicalSnapshot,
      }),
      aiSamples: async () => {
        paidTrap++;
        throw new Error("AI paid collector must not run when retainedEvidence.aiSampling is set");
      },
      enrich: async ({ baseReport }) => baseReport,
    },
  });

  assert.equal(paidTrap, 0, "retained evidence must skip paid collectors");
  assert.equal(report.directRank?.checks.length, 8);
  assert.equal(report.aiSampling?.samples.length, 6);
  assert.equal(report.assessment?.seo.overall, null, "no manufactured overall SEO score");
  assert.equal(report.assessment?.ai.overall, null, "geo warning suppresses national AI score");
  assert.equal(report.assessment?.ai.mentions.count, 0);
  assert.equal(report.assessment?.ai.mentions.denominator, 6);
  assert.ok((report.assessment?.ai.scopeWarnings?.length ?? 0) >= 1);
  assert.ok(report.assessment?.competitors.some(c => c.domain === "kivolaro.com" && c.status === "verified"));
  assert.ok(report.assessment?.competitors.some(c => c.domain === "speedy.solutions"));
  assert.ok(report.assessment?.opportunities.some(o => o.kind === "thin_reputation"));
  assert.ok(!report.assessment?.opportunities.some(o => o.kind === "measurement_gap"));
  assert.ok(
    report.assessment?.opportunities.every(o => !/measurement gap/i.test(o.problem) || o.kind !== "measurement_gap")
  );
  // Technical baseline timestamps / meta not relabeled as fresh
  assert.deepEqual(report.auditMeta?.pageSpeed, technicalSnapshot?.pageSpeed);
  assert.deepEqual(report.auditMeta?.technical, technicalSnapshot?.technical);

  // Visibility suppressed by partial depth
  const vis = report.assessment?.seo.dimensions.find(d => d.key === "visibility");
  assert.equal(vis?.score, null);

  // AI-only absence without content/proof would not pitch — with owner no-reviews, thin_reputation + maybe ai_absence ok
  const aiOnly = deriveOpportunities({
    seo: scoreSeoAssessment({ report: { ...report, siteReview }, auditContext: { geography: "national", version: 1 } }),
    ai: scoreAiAssessment({ aiSampling: pilot.aiSampling }),
    auditContext: { geography: "national", version: 1 },
  });
  assert.ok(!aiOnly.some(o => o.kind === "ai_absence"), "AI absence alone is not a sales opportunity");
  assert.ok(!aiOnly.some(o => o.kind === "measurement_gap"));

  // Positive scenario still works
  const positiveSeo = scoreSeoAssessment({
    report: {
      ...report,
      siteReview,
      auditMeta: {
        dataSources: { pageSpeed: true, googleSearch: true, siteCrawl: true, missing: [] },
        pageSpeed: {
          performanceScore: 95,
          seoScore: 100,
          lcpSeconds: 1,
          cls: 0,
          fcpSeconds: 1,
          speedIndexSeconds: 1,
          failedAudits: [],
        },
        technical: {
          contentWordCount: 800,
          hasLocalBusinessSchema: false,
          schemaBlocks: 1,
          schemaBasicValid: true,
          hasSitemap: true,
          hasRobotsTxt: true,
          lcpSeconds: 1,
          cls: 0,
        },
      },
    },
    auditContext: {
      geography: "national",
      version: 1,
      ownerAssertions: { reviews: { status: "unknown", source: "unknown" }, gbp: { status: "ineligible", source: "owner_confirmed" } },
    },
    directRank: {
      ...pilot.directRank,
      checks: pilot.directRank.checks.map(c => ({
        ...c,
        outcome: "ranked" as const,
        completeTop20Window: true,
        checkedDepth: 20,
        position: 1,
      })),
    },
    reviewedContent: [
      {
        pageUrl: servicesPage?.finalUrl ?? servicesPage?.url ?? "https://www.get247roi.com/services",
        checkId: "dedicated_landing",
        score: 1,
        excerpt: "ok",
        provenance: "test",
        reviewer: "analyst_review",
      },
      {
        pageUrl: servicesPage?.finalUrl ?? servicesPage?.url ?? "https://www.get247roi.com/services",
        checkId: "service_customer_geo_fit",
        score: 1,
        excerpt: "ok",
        provenance: "test",
        reviewer: "analyst_review",
      },
      {
        pageUrl: servicesPage?.finalUrl ?? servicesPage?.url ?? "https://www.get247roi.com/services",
        checkId: "buyer_selection_answers",
        score: 1,
        excerpt: "ok",
        provenance: "test",
        reviewer: "analyst_review",
      },
      {
        pageUrl: servicesPage?.finalUrl ?? servicesPage?.url ?? "https://www.get247roi.com/services",
        checkId: "demo_case_evidence",
        score: 1,
        excerpt: "ok",
        provenance: "test",
        reviewer: "analyst_review",
      },
      {
        pageUrl: servicesPage?.finalUrl ?? servicesPage?.url ?? "https://www.get247roi.com/services",
        checkId: "nav_titles",
        score: 1,
        excerpt: "ok",
        provenance: "test",
        reviewer: "analyst_review",
      },
    ],
    reviewedAuthority: [
      {
        itemId: "review_evidence",
        score: 1,
        basis: "observed",
        sourceUrl: "https://independent.example/reviews", excerpt: "SYNTHETIC TEST ONLY benchmarked review evidence",
        provenance: "test",
        note: "has reviews",
        reviewer: "analyst_review",
      },
      {
        itemId: "case_proof",
        score: 1,
        basis: "observed",
        provenance: "test",
        sourceUrl: "https://independent.example/case", excerpt: "SYNTHETIC TEST ONLY case evidence",
        note: "case",
        reviewer: "analyst_review",
      },
      {
        itemId: "independent_mentions",
        score: 1,
        basis: "observed",
        provenance: "test",
        sourceUrl: "https://independent.example/mention", excerpt: "SYNTHETIC TEST ONLY independent mention",
        note: "mention",
        reviewer: "analyst_review",
      },
    ],
  });
  // May still be incomplete if page URL doesn't match — attach matching URL pages
  assert.equal(positiveSeo.overall, 100, "Fully observed strong synthetic fixture earns 100, never forced weakness");
  {
    const posOpps = deriveOpportunities({ seo: positiveSeo, ai: { ...report.assessment!.ai, overall: 50, incomplete: false, scopeWarnings: [] } });
    assert.ok(posOpps.some(o => o.kind === "positive_monitor") || posOpps.length === 0 || posOpps.every(o => o.kind !== "measurement_gap"));
  }

  // Write full session fixture
  const outSession = {
    source: "stage3-retained-pilot",
    sessionId: sessionEnvelope.session.id,
    note: "Retained technical baseline from seo-display-latest-session; DataForSEO pilot evidence integrated offline. Technical timestamps not relabeled fresh.",
    session: {
      ...sessionEnvelope.session,
      report,
    },
  };
  mkdirSync(join(OUTPUT, ".."), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(outSession, null, 2));
  assert.ok(readFileSync(OUTPUT, "utf8").includes(sessionEnvelope.session.id));

  // Sanity: assessment from build uses same geo suppress
  const built = buildAuditAssessment({
    report,
    auditContext,
    directRank: pilot.directRank,
    reviewedContent,
    reviewedCompetitors: [kivolaro, speedy, dacforge],
    businessHost: "get247roi.com",
  });
  assert.equal(built.ai.overall, null);
  assert.equal(built.seo.overall, null);

  console.log(
    JSON.stringify({
      pass: true,
      sessionId: sessionEnvelope.session.id,
      hashes: pilot.hashes.length,
      organic: pilot.directRank.checks.length,
      ai: pilot.aiSampling.samples.length,
      scopeWarnings: pilot.scopeWarnings,
      output: OUTPUT,
      opportunities: report.assessment?.opportunities.map(o => o.kind),
      contentAdmitted: reviewedContent.map(c => c.checkId),
    })
  );
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
