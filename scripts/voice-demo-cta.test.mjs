import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const DEMO_HREF = "tel:+16109987247";
const DEMO_DISPLAY = "(610) 998-7247";
const BUSINESS_HREF = "tel:+16103003001";
const BUSINESS_DISPLAY = "(610) 300-3001";
const TESTING_LINE = "Try a conversation for your business. Demo bookings are for testing only.";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const home = read("src/components/HomePage.tsx");
const offer = read("src/components/LeadOfferPage.tsx");
const journey = read("src/components/LeadJourneyExample.tsx");
const demoRoute = read("src/app/demo/page.tsx");
const demoPage = read("src/components/DemoPage.tsx");
const cta = read("src/app/components/cta.ts");

const between = (source, start, end) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `missing region ${start} .. ${end}`);
  return source.slice(from, to);
};

const demoConstants = (source) => {
  assert.match(source, /const AI_DEMO_PHONE_HREF = "tel:\+16109987247";/);
  assert.match(source, /const AI_DEMO_PHONE_DISPLAY = "\(610\) 998-7247";/);
};

test("homepage hero: primary Call the AI demo with exact tel target and visible number", () => {
  demoConstants(home);
  const hero = between(home, "<h1", "</section>");
  const primary = hero.match(/<a href=\{AI_DEMO_PHONE_HREF\} className=\{button\}[^>]*>[\s\S]*?<\/a>/);
  assert.ok(primary, "primary hero button must be the AI demo tel link");
  assert.match(primary[0], /Call the AI demo/);
  assert.ok(hero.indexOf("Call the AI demo") < hero.indexOf("Talk to Brendan"), "AI demo comes first");
  assert.match(hero, /\{AI_DEMO_PHONE_DISPLAY\}/);
  assert.ok(hero.includes(TESTING_LINE));
});

test("homepage hero keeps Examples nearby and Talk to Brendan uses existing contact CTA", () => {
  const hero = between(home, "<h1", "</section>");
  assert.match(hero, /<Link href="\/contact\?offer=lead-capture&source=homepage-hero"[^>]*>Talk to Brendan<\/Link>/);
  assert.match(hero, /<a href="#examples"[^>]*data-track-label="Explore examples"/);
  assert.match(home, /<section id="examples"/);
  assert.match(home, /<LeadJourneyExample \/>/);
});

test("AI receptionist page only: primary Call the AI demo, visible number, inquiry retained", () => {
  demoConstants(offer);
  const voiceHero = between(offer, "{voice ? <>", "</> : <>");
  const primary = voiceHero.match(/<a href=\{AI_DEMO_PHONE_HREF\} className=\{offerButton\}[^>]*>[\s\S]*?<\/a>/);
  assert.ok(primary, "voice hero primary button must be the AI demo tel link");
  assert.match(primary[0], /Call the AI demo/);
  assert.match(voiceHero, /\{AI_DEMO_PHONE_DISPLAY\}/);
  assert.ok(voiceHero.includes(TESTING_LINE));
  assert.match(voiceHero, /<Link href=\{offerContact\(offer\)\}[^>]*>Discuss AI answering/);
  assert.ok(voiceHero.indexOf("Call the AI demo") < voiceHero.indexOf("Discuss AI answering"));
});

test("missed-call text back (MCTB) hero, invitation and disclosures are unchanged", () => {
  const mctbHero = between(offer, "</> : <>", "</>}");
  assert.ok(!mctbHero.includes("AI_DEMO_PHONE"), "AI demo number must not appear in MCTB hero");
  assert.ok(mctbHero.includes('<Link href={offerContact(offer)} className={offerButton} data-track-event="cta_click" data-track-label={`${offer}_hero_inquiry`} data-track-source={offer}>{voice ? "Discuss AI answering" : "Check my phone setup"}<ArrowRight className="h-4 w-4" aria-hidden /></Link>'));
  assert.ok(mctbHero.includes('<p className="mt-4 text-sm text-zinc-400">Start with one call flow. Expand only if it makes sense.</p>'));
  assert.ok(offer.includes('{!voice && <section className="border-b border-zinc-200 bg-white py-8"><div className="container mx-auto px-5 sm:px-6"><h2 className="font-display text-xl font-bold">See text back on a real phone.</h2><p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600">Call <a href={PRIMARY_PHONE_HREF} data-track-event="demo_phone_click" data-track-lane="lead-capture" className="font-semibold text-orange-700 underline">{PRIMARY_PHONE_DISPLAY}</a> to arrange a text-back demonstration on our business line. This is not an AI voice demo; delivery depends on mobile eligibility, carrier support and opt-out status.</p>'));
  assert.ok(offer.includes("A missed call is not blanket permission for ongoing promotional texts."));
  assert.ok(offer.includes("No checkout or payment required to discuss your options."));
  assert.ok(demoPage.includes("Call to arrange a missed-call text-back demonstration on our business line. This is not an AI voice demo."));
  assert.match(demoPage, /<a href=\{PRIMARY_PHONE_HREF\} data-track-event="demo_phone_click" data-track-lane="lead-capture"/);
});

test("business line stays distinct from the AI voice demo line", () => {
  assert.ok(cta.includes(`export const PRIMARY_PHONE_HREF = "${BUSINESS_HREF}";`));
  assert.ok(cta.includes(`export const PRIMARY_PHONE_DISPLAY = "${BUSINESS_DISPLAY}";`));
  assert.notEqual(BUSINESS_HREF, DEMO_HREF);
  for (const source of [home, offer]) {
    assert.match(source, /href=\{PRIMARY_PHONE_HREF\}/, "business line still linked");
    assert.ok(!source.includes(`"${BUSINESS_HREF}"`), "business line is not hardcoded as the demo");
    assert.ok(!source.includes(`AI_DEMO_PHONE_HREF = "${BUSINESS_HREF}"`));
  }
  const textBackInvite = between(offer, "See text back on a real phone.", "</section>");
  assert.ok(!textBackInvite.includes("AI_DEMO_PHONE") && !textBackInvite.includes(DEMO_DISPLAY));
});

test("illustration keeps honest labels without GHL jargon", () => {
  assert.ok(journey.includes("Interactive illustration · fictional business"));
  assert.ok(journey.includes("Explore the steps. No calls, messages, bookings or reviews are sent."));
  for (const source of [home, offer, journey, demoRoute, demoPage]) {
    assert.doesNotMatch(source, /\bGHL\b|GoHighLevel|HighLevel/i);
  }
});

test("no auto-dial or automatic browser call", () => {
  for (const source of [home, offer, journey, demoRoute, demoPage]) {
    assert.doesNotMatch(source, /location(\.href)?\s*=|location\.(assign|replace)\(|window\.open\(/);
    assert.doesNotMatch(source, /\.click\(\)/);
    assert.doesNotMatch(source, /http-equiv=["']?refresh/i);
  }
  for (const source of [home, offer]) {
    const tels = source.match(/tel:\+1\d{10}/g) ?? [];
    assert.deepEqual([...new Set(tels)], [DEMO_HREF], "only the demo constant is hardcoded");
  }
});

test("demo page live AI voice demo block", () => {
  assert.ok(demoPage.includes(DEMO_HREF));
  assert.ok(demoPage.includes(DEMO_DISPLAY));
  assert.ok(demoPage.indexOf('id="voice-demo"') < demoPage.indexOf('<WorkflowDemo />'));
  assert.ok(demoPage.includes('Demo bookings are for testing only.'));
});
