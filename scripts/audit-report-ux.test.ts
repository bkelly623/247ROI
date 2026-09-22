import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runAuditPipeline } from '../src/lib/audit/audit-engine';
import { buildDefaultAdvisorSteps } from '../src/lib/audit/llm-enrich';
import { inferServiceFromName } from '../src/lib/audit/infer-service';
import { probeGoogleSearch, parseAIOverview, googleDeficits } from '../src/lib/audit/probes/google-search';

async function main() {
  assert.equal(inferServiceFromName('247ROI').servicePhrase, 'AI business automation consultant');
  assert.equal(inferServiceFromName('247 ROI').tradeLabel, 'AI & Business Automation');
  assert.equal(inferServiceFromName('Acme').tradeLabel, 'Business Services (unconfirmed)');
  assert.equal(inferServiceFromName('Acme Roofing').servicePhrase, 'roofer');
  const report = readFileSync('src/components/audit/BlueprintReport.tsx', 'utf8');
  const view = readFileSync('src/components/audit/ReportView.tsx', 'utf8');
  assert.match(report, /<a href=\{BRAND.schedulingUrl/);
  assert.match(report, /encodeURIComponent\(sessionId\)/);
  assert.doesNotMatch(view, /window.open|await fetch\(`\/api\/sessions\/\$\{sessionId\}\/events/);
  assert.match(view, /keepalive: true/);
  assert.match(report, /not a verified list of keywords/);
  assert.match(report, /Places discovery order — not a Google ranking/);
  const observed = parseAIOverview({ ai_overview: { text_blocks: [{ snippet: "Offline fixture answer" }], references: [{ title: "Source", link: "https://example.com" }] } }, "test", "10001");
  assert.equal(observed.state, "observed");
  assert.equal(observed.answer, "Offline fixture answer");
  assert.equal(observed.citations.length, 1);
  assert.equal(parseAIOverview({}, "test", "10001").state, "not_returned");
  assert.equal(parseAIOverview({ai_overview: {page_token: "never-follow"}}, "test", "10001").state, "unavailable");
  const engine = readFileSync('src/lib/audit/audit-engine.ts', 'utf8');
  const llm = readFileSync('src/lib/audit/llm-enrich.ts', 'utf8');
  assert.doesNotMatch(engine, /weightedReadinessIndex|AI cannot confidently|phase-two growth engine/);
  assert.doesNotMatch(llm, /ALWAYS package|Most businesses in your area|covert sales/);
  assert.doesNotMatch(report, /<GrowthSimulator|<IndustryPulse|<ScoreRing/);
  assert.match(report, /<AssessmentSummary/);
  assert.match(readFileSync("src/components/audit/AssessmentSummary.tsx", "utf8"), /Overall assessment incomplete/);
  const emptyFindings = googleDeficits({ configured: true, blocks: [{ query: "test", type: "local", source: "places", results: [], clientFound: false, clientPosition: null }], businessListing: { found: true }, summary: "empty" });
  assert.equal(emptyFindings.length, 0, 'No fake absent ranking or zero review findings');
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.SERPAPI_KEY;
  process.env.SERPAPI_KEY = 'offline-test-key';
  let requests = 0;
  globalThis.fetch = async (url) => {
    requests++;
    if (String(url).includes("locations.json")) return Response.json([{ country_code: "US", name: "10001", canonical_name: "10001,New York,United States" }]);
    return new Response(JSON.stringify({local_results: [], organic_results: [
      {position: 1, title: '247ROI mention', link: 'https://competitor.example/get247roi.com'},
      {position: 2, title: '247ROI spoof', link: 'https://get247roi.com.evil.example'},
      {position: 3, title: 'Automation', link: 'https://www.get247roi.com/services'}
    ]}), {status: 200, headers: {'Content-Type': 'application/json'}});
  };
  try {
    const result = await probeGoogleSearch({businessName: '247ROI', websiteUrl: 'https://www.get247roi.com', zipCode: '10001', servicePhrase: 'AI business automation consultant'});
    const organic = result.blocks.find(b => b.type === 'organic')!;
    assert.deepEqual(organic.results.map(r => r.isClient), [false, false, true]);
    assert.equal(organic.clientPosition, 3);
    assert.equal(organic.source, 'serpapi');
    assert.equal(organic.location, '10001,New York,United States');
    assert.ok(organic.observedAt && !Number.isNaN(Date.parse(organic.observedAt)));
    assert.equal(requests, 4, "Three captures plus one free location lookup");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SERPAPI_KEY;
    else process.env.SERPAPI_KEY = originalKey;
  }
  const oldFetch = globalThis.fetch;
  const keys = ['SERPAPI_KEY', 'GOOGLE_PLACES_API_KEY', 'GOOGLE_PAGESPEED_API_KEY', 'PAGESPEED_API_KEY', 'GOOGLE_MAPS_API_KEY'];
  const saved = keys.map(k => process.env[k]);
  keys.forEach(k => delete process.env[k]);
  globalThis.fetch = async () => new Response('<html><head><title>Acme Consulting</title><meta name="description" content="Business strategy"></head><body><h1>Business strategy consulting</h1><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Acme"}</script></body></html>', { status: 200, headers: { 'Content-Type': 'text/html' } });
  try {
    const pipeline = await runAuditPipeline({businessName: 'Acme Consulting', websiteUrl: 'https://acme.example', zipCode: '10001'});
    assert.equal(pipeline.sections.find(s => s.key === 'ai')?.score, null);
    assert.equal(pipeline.sections.find(s => s.key === 'ai')?.measured, false);
    assert.equal(pipeline.sections.find(s => s.key === 'seo')?.score, null);
    assert.ok(!pipeline.deficits.some(d => /LocalBusiness/.test(d.finding)));
    assert.ok(!pipeline.sitePreview.beforeAnnotations.some(a => /Missing AI Data/.test(a.label)));
    assert.doesNotMatch(pipeline.packages.primary.headline, /Smart Site Foundation/);
    assert.doesNotMatch(buildDefaultAdvisorSteps(pipeline).join(' '), /Phase two|readiness is|Most businesses/);
  } finally {
    globalThis.fetch = oldFetch;
    keys.forEach((k, i) => { if (saved[i] === undefined) delete process.env[k]; else process.env[k] = saved[i]; });
  }
  console.log('PASS: report CTA source contract, industry inference, keyword labels, offline organic host matching and sample provenance. No provider calls.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
