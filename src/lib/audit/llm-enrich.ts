import type { AuditReport } from "./types";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

interface EnrichInput {
  businessName: string;
  websiteUrl: string;
  zipCode: string;
  baseReport: AuditReport;
}

export async function enrichReportWithLlm(
  input: EnrichInput
): Promise<AuditReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return withDefaultAdvisorScript(input.baseReport, input.businessName);
  }

  try {
    const prompt = buildPrompt(input);
    const res = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("LLM enrich failed:", res.status, await res.text());
      return withDefaultAdvisorScript(input.baseReport, input.businessName);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";
    const parsed = parseLlmJson(text);
    if (!parsed) {
      return withDefaultAdvisorScript(input.baseReport, input.businessName);
    }

    return mergeEnrichment(input.baseReport, parsed);
  } catch (e) {
    console.error("LLM enrich error:", e);
    return withDefaultAdvisorScript(input.baseReport, input.businessName);
  }
}

function buildPrompt(input: EnrichInput): string {
  const { businessName, websiteUrl, zipCode, baseReport } = input;
  const sections = baseReport.sections
    .map((s) => `${s.label}: ${s.score}/100 — ${s.summary}`)
    .join("\n");

  const aiMirror = baseReport.aiMirror
    ? `AI Mirror: ${baseReport.aiMirror.summary.verdict} (${baseReport.aiMirror.summary.mentionRate}% mention rate)`
    : "";
  const googleLocal = baseReport.googleLocal
    ? `Google Local: ${baseReport.googleLocal.summary}`
    : "";

  return `You are the 247ROI Infrastructure Advisor — an expert who explains audit results to local service business owners (construction, trades, home services) in plain English. No jargon. No fear-mongering. First-mover opportunity framing.

Business: ${businessName}
Website: ${websiteUrl}
Zip: ${zipCode}

${aiMirror}
${googleLocal}

Technical scan results:
${sections}

Deficits:
${baseReport.deficits.map((d) => `- ${d.finding}`).join("\n")}

247ROI product ladder:
1. Smart Site Foundation (~$99/mo) — AI-ready website infrastructure. ALWAYS package #1.
2. AI Visibility Growth Program (custom) — umbrella service: AI citation layer, schema, entity optimization, PLUS the weakest supporting pillar (SEO indexing, reputation/reviews, or social entity linking). NEVER pitch social posting as primary for contractors — frame as AI entity consistency.

Return ONLY valid JSON (no markdown):
{
  "opportunityHeadline": "one compelling sentence about first-mover opportunity in their zip",
  "executiveSummary": "2-3 sentences plain English what the scan found",
  "guideSteps": ["5-7 steps for a sales walkthrough, each 1-2 sentences, building desire for Foundation then AI Visibility Program"],
  "advisorSteps": ["6-8 steps for a floating advisor bot — conversational, covert sales, end with soft CTA to call for fix plan"],
  "secondaryPackageDescription": "AI Visibility Growth Program description tailored to their gaps — mention SEO/reviews/social only as components of AI visibility strategy",
  "secondaryEmphasis": "one phrase e.g. SEO indexing layer or reputation trust signals",
  "salesHook": "one sentence for the rep to open a Google Meet with"
}`;
}

function parseLlmJson(text: string): Record<string, unknown> | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function mergeEnrichment(
  base: AuditReport,
  parsed: Record<string, unknown>
): AuditReport {
  const guideSteps = Array.isArray(parsed.guideSteps)
    ? (parsed.guideSteps as string[])
    : base.guideSteps;
  const advisorSteps = Array.isArray(parsed.advisorSteps)
    ? (parsed.advisorSteps as string[])
    : buildDefaultAdvisorSteps(base);

  return {
    ...base,
    opportunityHeadline:
      (parsed.opportunityHeadline as string) || base.opportunityHeadline,
    executiveSummary:
      (parsed.executiveSummary as string) || base.executiveSummary,
    salesHook: (parsed.salesHook as string) || base.salesHook,
    guideSteps,
    advisorSteps,
    packages: {
      ...base.packages,
      secondary: {
        ...base.packages.secondary,
        headline: "AI Visibility Growth Program",
        description:
          (parsed.secondaryPackageDescription as string) ||
          base.packages.secondary.description,
        ctaLabel: "See If You Qualify for AI Visibility",
      },
    },
    progressEvents: [
      ...base.progressEvents,
      "LLM analysis: personalized blueprint generated.",
    ],
  };
}

export function buildDefaultAdvisorSteps(report: AuditReport): string[] {
  const ai = report.sections.find((s) => s.key === "ai");
  const weakest = [...report.sections]
    .filter((s) => s.measured && s.score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];

  return [
    `I've reviewed your infrastructure blueprint. Most businesses in your area aren't AI-ready yet — that's actually good news for you.`,
    `Your overall readiness is ${report.opportunityIndex}%. That means there's real upside if you move before this becomes standard.`,
    ai
      ? `On AI readiness: ${ai.score !== null ? `${ai.score}%` : "pending"}. ${ai.summary}`
      : `Your biggest gap is in how AI systems understand your business.`,
    `Here's the play: Smart Site Foundation gets you the infrastructure AI and Google need — starting around $99/mo.`,
    `Phase two is our AI Visibility Growth Program — this covers citation layers, schema, and your ${weakest?.label?.toLowerCase() ?? "search"} gaps as part of one strategy.`,
    `This isn't about posting more on Instagram. It's about making sure ChatGPT and Google AI can find and recommend you.`,
    `Want the fastest path? Book a free fix plan call — we'll show you exactly what to fix first. No pressure.`,
  ];
}

function withDefaultAdvisorScript(
  report: AuditReport,
  _businessName: string
): AuditReport {
  return {
    ...report,
    advisorSteps: buildDefaultAdvisorSteps(report),
    packages: {
      ...report.packages,
      secondary: {
        ...report.packages.secondary,
        headline: "AI Visibility Growth Program",
        description:
          report.packages.secondary.description.includes("AI Visibility")
            ? report.packages.secondary.description
            : `Complete AI visibility strategy for your market — citation layers, structured data, and ${report.packages.secondary.headline.toLowerCase()} optimization bundled into one program.`,
        ctaLabel: "See If You Qualify for AI Visibility",
      },
    },
  };
}
