import assert from "node:assert/strict";
import { collectAISamples, planAIQuestions, type AISamplingOptions, type AISamplingInput } from "../src/lib/audit/probes/ai-sampling";
import type { ChatGPTEvidence } from "../src/lib/audit/probes/chatgpt-search";
import type { GoogleAIModeEvidence } from "../src/lib/audit/probes/google-ai-mode";

// All provider output below is synthetic OFFLINE test data. No network or paid calls.
const input: AISamplingInput = { businessName: "Example Co", websiteUrl: "https://example.test", servicePhrase: "Example Co workflow automation https://example.test", specificServicePhrase: "invoice processing automation", zipCode: "27401" };
const observedAt = "2026-09-21T00:00:00.000Z";
function chat(query: string): ChatGPTEvidence {
  return { state: "observed", query, location: "United States", observedAt, source: "dataforseo", product: "consumer_chatgpt_scraper", mode: "search", answer: "Example Co and Literal Rival provide services.", mentioned: true, cited: true, citations: [{ title: "Example Co", url: "https://example.test/", hostname: "example.test", relation: "cited_or_relied_on" }], raw: { status_code: 20000, task_status_code: 20000, markdown: "Example Co and Literal Rival provide services.", sources: [{ title: "Example Co", url: "https://example.test/" }] } };
}
function google(query: string): GoogleAIModeEvidence {
  return { state: "observed", query, location: "27401, United States", observedAt, source: "serpapi", answer: "Literal Rival provides this service.", mentioned: false, cited: false, citations: [] };
}
async function main() {
  const questions = planAIQuestions(input);
  assert.equal(questions.length, 3);
  assert.deepEqual(questions.map(q => q.intent), ["provider_shortlist", "specific_service", "comparison_selection"]);
  assert.equal(new Set(questions.map(q => q.query)).size, 3);
  assert(questions.every(q => !/Example Co|example\.test/.test(q.query)));
  assert(questions[1].query.includes("invoice processing automation"));
  assert.throws(() => planAIQuestions({ ...input, servicePhrase: "Example Co" }), /unbranded/);
  assert.throws(() => planAIQuestions({ ...input, zipCode: "invalid" }), /ZIP/);

  let chatCalls = 0; let googleCalls = 0; let budgetCalls = 0;
  let activeChat = 0; let activeGoogle = 0; let peakChat = 0; let peakGoogle = 0;
  const chatQueries: string[] = []; const googleQueries: string[] = [];
  const options: AISamplingOptions = {
    competitorCandidates: ["Literal Rival", "Imaginary Rival", "Example Co"],
    budgetChatGPTQuote: async ({ query }) => {
      budgetCalls++;
      assert(questions.some(q => q.query === query));
      return { quote: { upperCostMicros: 1, pricingUrl: "offline-fixture", verifiedAt: observedAt }, authorize: async () => true };
    },
    collectors: {
      chatgpt: async ({ query }, probeOptions) => {
        chatCalls++; chatQueries.push(query); activeChat++; peakChat = Math.max(peakChat, activeChat);
        assert(probeOptions.quote); assert(probeOptions.authorize); assert(probeOptions.timeoutMs! <= 55_000);
        await new Promise(resolve => setTimeout(resolve, 5)); activeChat--;
        if (query === questions[1].query) throw new Error("SECRET exception must never leak");
        return query === questions[2].query ? { ...chat(query), mentioned: null, cited: null } : chat(query);
      },
      googleAIMode: async ({ query }) => {
        googleCalls++; googleQueries.push(query); activeGoogle++; peakGoogle = Math.max(peakGoogle, activeGoogle);
        await new Promise(resolve => setTimeout(resolve, 5)); activeGoogle--;
        // Failed provider incorrectly reporting false must remain unmeasured.
        return query === questions[2].query ? { ...google(query), state: "unavailable", error: "blocked" } : google(query);
      },
    },
  };
  const report = await collectAISamples(input, options);
  assert.deepEqual([chatCalls, googleCalls, budgetCalls], [3, 3, 3]);
  assert.deepEqual(chatQueries, questions.map(q => q.query));
  assert.deepEqual(googleQueries, chatQueries);
  assert.equal(peakChat, 2); assert.equal(peakGoogle, 2);
  assert.deepEqual(report.summary, { total: 6, available: 4, unavailable: 2, mentions: { count: 1, denominator: 3, rate: 1 / 3 }, citations: { count: 1, denominator: 3, rate: 1 / 3 } });
  assert.equal(report.byEngine.chatgpt.available, 2);
  assert.equal(report.byEngine.google_ai_mode.available, 2);
  assert(report.samples.filter(s => s.evidence.state !== "observed").every(s => s.evidence.mentioned === null && s.evidence.cited === null && s.submittedQuery === null));
  assert(report.samples.filter(s => s.evidence.state === "observed").every(s => s.submittedQuery === s.query && s.competitorNames.join() === "Literal Rival"));
  assert.equal(report.samples[0].evidence.answer, chat(questions[0].query).answer);
  assert.deepEqual(report.samples[0].evidence.citations, chat(questions[0].query).citations);
  assert(!JSON.stringify(report).includes("SECRET"));
  assert(report.methodology.includes("does not prove"));
  const reopened = await collectAISamples(input, { ...options, existingReport: report });
  assert.deepEqual([chatCalls, googleCalls, budgetCalls], [3, 3, 3]);
  assert(reopened.samples.every(s => s.reused));
  assert.deepEqual(reopened.summary, report.summary);

  const denied = await collectAISamples(input, { ...options, budgetChatGPTQuote: async () => null });
  assert.equal(chatCalls, 3, "Denied quotes must never invoke the ChatGPT collector");
  assert.equal(denied.byEngine.chatgpt.available, 0);
  assert.equal(denied.byEngine.chatgpt.mentions.rate, null);
  assert(denied.samples.filter(s => s.engine === "chatgpt").every(s => s.evidence.state === "not_authorized"));

  const mismatched = await collectAISamples(input, { ...options, collectors: { chatgpt: async () => chat("A different legacy question"), googleAIMode: async () => google("Another question") } });
  assert.equal(mismatched.summary.available, 0);
  assert.equal(mismatched.summary.mentions.denominator, 0);
  assert(mismatched.samples.every(s => s.evidence.query !== s.query && s.evidence.error?.includes("different question")));

  const mismatchReplay = await collectAISamples(input, { ...options, existingReport: mismatched, collectors: {
    chatgpt: async () => { throw new Error("Replay must not call collectors"); },
    googleAIMode: async () => { throw new Error("Replay must not call collectors"); },
  } });
  assert(mismatchReplay.samples.every(s => s.reused));
  const empty = await collectAISamples(input, { ...options, collectors: {
    chatgpt: async ({ query }) => ({ ...chat(query), answer: "" }),
    googleAIMode: async ({ query }) => ({ ...google(query), error: "failed despite observed flag" }),
  } });
  assert.equal(empty.summary.available, 0);
  assert.equal(empty.summary.citations.denominator, 0);

  let lateCalls = 0;
  let hangingGoogleCalls = 0;
  const timedOut = await collectAISamples(input, {
    ...options, perSampleTimeoutMs: 5, totalTimeoutMs: 8,
    budgetChatGPTQuote: async () => { await new Promise(resolve => setTimeout(resolve, 25)); return options.budgetChatGPTQuote({ key: "test", query: questions[0].query, intent: "provider_shortlist" }); },
    collectors: { chatgpt: async ({ query }) => { lateCalls++; return chat(query); }, googleAIMode: async () => { hangingGoogleCalls++; return new Promise(() => {}); } },
  });
  assert.equal(timedOut.summary.available, 0);
  assert.equal(timedOut.summary.total, 6);
  assert.equal(hangingGoogleCalls, 2, "Timeout must not start a third transport while the first two are unresolved");
  await new Promise(resolve => setTimeout(resolve, 35));
  assert.equal(lateCalls, 0, "A quote resolving after timeout must not start a paid request");
  const replayTimeout = await collectAISamples(input, { ...options, existingReport: timedOut });
  assert(replayTimeout.samples.every(s => s.reused));
  console.log("PASS: three unbranded questions, same questions across engines, bounded concurrency, observed-only denominators, exact evidence, no invented competitors, stable replay without calls, denied budgets, mismatch rejection, deadlines and no late paid sends (offline).");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
