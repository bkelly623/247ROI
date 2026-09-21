import { runAuditPipeline } from "./audit-engine";
import { enrichReportWithLlm } from "./llm-enrich";
import type { AuditReport } from "./types";
import { probeGoogleAIMode } from "./probes/google-ai-mode";
import { inferServiceFromName } from "./infer-service";

export async function executeFullAudit(input: {
  sessionId: string;
  businessName: string;
  websiteUrl: string;
  zipCode: string;
  mode: "organic" | "rep";
  callbackUrl: string;
  lead?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
}): Promise<AuditReport> {
  // One owner executes the audit. The old webhook duplicated this work and
  // could hold the request open indefinitely before local collection began.

  const aiModePromise = probeGoogleAIMode({ ...input, servicePhrase: inferServiceFromName(input.businessName).servicePhrase });
  const baseReport = await runAuditPipeline({
    businessName: input.businessName,
    websiteUrl: input.websiteUrl,
    zipCode: input.zipCode,
  });

  const googleAIMode = await aiModePromise;
  const missing = ["Consumer ChatGPT measurement", "Email report delivery"];
  if (googleAIMode.state !== "observed") missing.push("Google AI Mode answer");
  if (!baseReport.googleLocal?.aiOverviews?.some(s => s.state === "observed")) missing.push("Google AI Overview answer");
  if (baseReport.googleLocal?.rawError) missing.push("Some Google search captures");
  return enrichReportWithLlm({
    businessName: input.businessName,
    websiteUrl: input.websiteUrl,
    zipCode: input.zipCode,
    baseReport: { ...baseReport, googleAIMode, coverage: { status: missing.length ? "partial" : "complete", missing }, sections: baseReport.sections.map(s => s.key === "ai" ? { ...s, measured: googleAIMode.state === "observed", summary: googleAIMode.state === "observed" ? `Google AI Mode answer captured. Brand mentioned: ${googleAIMode.mentioned ? "yes" : "no"}; website cited: ${googleAIMode.cited ? "yes" : "no"} in this sample. ChatGPT remains unmeasured.` : "No usable Google AI Mode answer collected. This is not proof of brand absence.", dataSource: "Google AI Mode via SerpAPI; see retained answer and sources" } : s) },
  });
}
