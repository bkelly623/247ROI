import { runAuditPipeline } from "./audit-engine";
import { enrichReportWithLlm } from "./llm-enrich";
import { runAIMirrorProbe } from "./probe-ai-mirror";
import { runGoogleLocalProbe } from "./probe-google";
import { dispatchToAthena } from "./athena";
import type { AuditReport } from "./types";

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
  const athena = await dispatchToAthena({
    sessionId: input.sessionId,
    businessName: input.businessName,
    websiteUrl: input.websiteUrl,
    zipCode: input.zipCode,
    mode: input.mode,
    callbackUrl: input.callbackUrl,
    botId: "athena_bot_bot_bot",
    lead: input.lead,
  });

  const [baseReport, aiMirror, googleLocal] = await Promise.all([
    runAuditPipeline({
      businessName: input.businessName,
      websiteUrl: input.websiteUrl,
      zipCode: input.zipCode,
    }),
    runAIMirrorProbe({
      businessName: input.businessName,
      zipCode: input.zipCode,
    }),
    runGoogleLocalProbe({
      businessName: input.businessName,
      zipCode: input.zipCode,
    }),
  ]);

  const withProbes: AuditReport = {
    ...baseReport,
    aiMirror,
    googleLocal,
    progressEvents: [
      ...baseReport.progressEvents,
      aiMirror.summary.verdict,
      googleLocal.summary,
      athena.dispatched
        ? "Athena deep audit dispatched."
        : "Live AI + Google probes complete.",
    ],
  };

  return enrichReportWithLlm({
    businessName: input.businessName,
    websiteUrl: input.websiteUrl,
    zipCode: input.zipCode,
    baseReport: withProbes,
  });
}
