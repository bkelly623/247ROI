import { ATHENA } from "./config";
import type { AuditReport } from "./types";

export interface AthenaJobPayload {
  sessionId: string;
  businessName: string;
  websiteUrl: string;
  zipCode: string;
  mode: "organic" | "rep";
  callbackUrl: string;
  botId: string;
}

export async function dispatchToAthena(
  payload: AthenaJobPayload
): Promise<{ dispatched: boolean; jobId?: string; error?: string }> {
  if (!ATHENA.webhookUrl) {
    return { dispatched: false, error: "ATHENA_WEBHOOK_URL not configured" };
  }

  try {
    const res = await fetch(ATHENA.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ATHENA.callbackSecret
          ? { Authorization: `Bearer ${ATHENA.callbackSecret}` }
          : {}),
      },
      body: JSON.stringify({
        action: "run_infrastructure_blueprint",
        bot: ATHENA.botId,
        ...payload,
      }),
    });

    if (!res.ok) {
      return { dispatched: false, error: `Athena returned ${res.status}` };
    }

    const data = (await res.json()) as { jobId?: string };
    return { dispatched: true, jobId: data.jobId ?? payload.sessionId };
  } catch (e) {
    return {
      dispatched: false,
      error: e instanceof Error ? e.message : "Athena dispatch failed",
    };
  }
}

export function mergeAthenaReport(
  base: AuditReport,
  athenaReport: Partial<AuditReport>
): AuditReport {
  return {
    ...base,
    ...athenaReport,
    sections: athenaReport.sections ?? base.sections,
    deficits: athenaReport.deficits ?? base.deficits,
    packages: athenaReport.packages ?? base.packages,
    guideSteps: athenaReport.guideSteps ?? base.guideSteps,
    advisorSteps: athenaReport.advisorSteps ?? base.advisorSteps,
    executiveSummary: athenaReport.executiveSummary ?? base.executiveSummary,
    salesHook: athenaReport.salesHook ?? base.salesHook,
    sitePreview: athenaReport.sitePreview ?? base.sitePreview,
    progressEvents: [
      ...base.progressEvents,
      ...(athenaReport.progressEvents ?? []),
    ],
  };
}
