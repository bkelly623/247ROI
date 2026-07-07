import { runAuditPipeline } from "./audit-engine";
import { enrichReportWithLlm } from "./llm-enrich";
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
  await dispatchToAthena({
    sessionId: input.sessionId,
    businessName: input.businessName,
    websiteUrl: input.websiteUrl,
    zipCode: input.zipCode,
    mode: input.mode,
    callbackUrl: input.callbackUrl,
    botId: "athena_bot_bot_bot",
    lead: input.lead,
  });

  const baseReport = await runAuditPipeline({
    businessName: input.businessName,
    websiteUrl: input.websiteUrl,
    zipCode: input.zipCode,
  });

  return enrichReportWithLlm({
    businessName: input.businessName,
    websiteUrl: input.websiteUrl,
    zipCode: input.zipCode,
    baseReport,
  });
}
