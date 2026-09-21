import { runAuditPipeline } from "./audit-engine";
import { enrichReportWithLlm } from "./llm-enrich";
import type { AuditReport } from "./types";
import { probeGoogleAIMode } from "./probes/google-ai-mode";
import { probeChatGPT, CHATGPT_PRICING_URL } from "./probes/chatgpt-search";
import { reservePublicChatGPT, recordPublicChatGPTOutcome } from "./probes/chatgpt-budget";
import { inferServiceContext } from "./service-context";
import { probeSiteCrawl } from "./probes/site-crawl";

// Verified against the official live scraper price page, not refreshed on each
// request. Expiry fails closed; a deploy/review must explicitly renew the quote.
const CHATGPT_QUOTE = { upperCostMicros: 4000, pricingUrl: CHATGPT_PRICING_URL, verifiedAt: "2026-09-21T15:28:02Z" };

export async function executeFullAudit(input: {
  sessionId: string; businessName: string; websiteUrl: string; zipCode: string;
  mode: "organic" | "rep"; callbackUrl: string; previousReport?: AuditReport | null;
  lead?: { firstName: string; lastName: string; phone: string; email: string };
}): Promise<AuditReport> {
  // One owner, one public crawl, one service interpretation for all collectors.
  // No owner-private analytics, duplicate Athena dispatch, or generation proxies.
  const url = input.websiteUrl.startsWith("http") ? input.websiteUrl : `https://${input.websiteUrl}`;
  const site = await probeSiteCrawl(url);
  const serviceContext = inferServiceContext(input.businessName, site);
  const sampleInput = { ...input, servicePhrase: serviceContext.servicePhrase };
  const aiModePromise = probeGoogleAIMode(sampleInput);
  const chatGPTPromise = (async () => {
    if (input.previousReport?.chatGPT?.state === "observed") return input.previousReport.chatGPT;
    let reserved = false;
    const evidence = await probeChatGPT(sampleInput, {
      quote: CHATGPT_QUOTE,
      authorize: async reservation => {
        reserved = await reservePublicChatGPT({ ...reservation, sessionId: input.sessionId });
        return reserved;
      },
    });
    if (reserved) {
      const recorded = await recordPublicChatGPTOutcome(input.sessionId, {
        ...evidence, status: evidence.state === "observed" ? "observed" : "error",
      });
      if (!recorded) evidence.error = `${evidence.error ? evidence.error + "; " : ""}Provider evidence returned but operational receipt persistence is unconfirmed; reservation retained.`;
    }
    return evidence;
  })();
  const [baseReport, googleAIMode, chatGPT] = await Promise.all([
    runAuditPipeline({ businessName: input.businessName, websiteUrl: url, zipCode: input.zipCode, site, servicePhrase: serviceContext.servicePhrase }),
    aiModePromise, chatGPTPromise,
  ]);
  const missing = ["Email report delivery"];
  if (chatGPT.state !== "observed") missing.push("Consumer ChatGPT measurement");
  else if (chatGPT.error) missing.push("ChatGPT receipt reconciliation");
  if (googleAIMode.state !== "observed") missing.push("Google AI Mode answer");
  const overviews = baseReport.googleLocal?.aiOverviews ?? [];
  // A successful sample without an Overview is a measured feature non-return,
  // not a collection failure and not evidence of overall brand absence.
  if (!overviews.length || overviews.some(s => s.state === "unavailable")) missing.push("Google AI Overview collection");
  if (baseReport.googleLocal?.rawError) missing.push("Some Google search captures");
  if (!site.fetched) missing.push("Public website crawl");
  if (serviceContext.source === "unconfirmed") missing.push("Confirmed service context");
  const measured = chatGPT.state === "observed" || googleAIMode.state === "observed";
  const describe = (name: string, sample: {state: string; mentioned: boolean | null; cited: boolean | null}) => sample.state === "observed"
    ? `${name}: business mentioned ${sample.mentioned === null ? "unknown" : sample.mentioned ? "yes" : "no"}; website cited ${sample.cited === null ? "unknown" : sample.cited ? "yes" : "no"} in this sample.`
    : `${name}: unmeasured (not proof of absence).`;
  return enrichReportWithLlm({
    businessName: input.businessName, websiteUrl: url, zipCode: input.zipCode,
    baseReport: {
      ...baseReport, serviceContext, googleAIMode, chatGPT,
      coverage: { status: missing.length ? "partial" : "complete", missing },
      sections: baseReport.sections.map(s => s.key === "ai" ? {
        ...s, measured, plainQuestion: "Did AI answers mention or cite your business?",
        summary: `${describe("ChatGPT", chatGPT)} ${describe("Google AI Mode", googleAIMode)}`,
        dataSource: "Consumer ChatGPT via DataForSEO; Google AI Mode via SerpAPI; see dated answers and sources",
        topFix: measured ? "Review which relevant providers and sources appeared, then improve evidenced service-content and business-identity gaps." : "Collect usable AI answers before drawing visibility conclusions.",
      } : s),
    },
  });
}
