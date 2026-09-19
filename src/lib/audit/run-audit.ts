import { runAuditPipeline } from "./audit-engine";
import { enrichReportWithLlm } from "./llm-enrich";
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
  // One owner executes the audit. The old webhook duplicated this work and
  // could hold the request open indefinitely before local collection began.

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
