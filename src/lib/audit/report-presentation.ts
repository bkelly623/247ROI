import type { AuditReport, ScanSession } from "@/lib/audit/types";
import { seoOverview } from "@/lib/audit/seo-overview";

export type PresentationCard = {
  label: string;
  /** Human display — never invent a score; unmeasured stays unmeasured (not "0"). */
  value: string;
  tag: string;
  detail: string;
  supporting: string[];
};

export type PresentationOpportunity = {
  id: string;
  title: string;
  summary: string;
  evidence: string;
};

export type ReportPresentation = {
  businessName: string;
  headline: string;
  intro: string;
  seoCard: PresentationCard;
  aiCard: PresentationCard;
  findings: string[];
  opportunities: PresentationOpportunity[];
  consultationHref: string;
  consultationLabel: string;
  reportPath: string;
  isLegacy: boolean;
  geographyNote: string;
  provenanceNotes: string[];
};

/** Canonical saved-report path on the current origin — no search/referrer PII. */
export function canonicalReportPath(sessionId: string): string {
  return `/report/${encodeURIComponent(sessionId)}`;
}

export function canonicalReportUrl(origin: string, sessionId: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${canonicalReportPath(sessionId)}`;
}

/** Established handoff; AuditEntryFlow reads `visibility` and does not re-intake. */
export function consultationHref(sessionId: string): string {
  return `/ai-opportunity-audit?visibility=${encodeURIComponent(sessionId)}`;
}

function seoCardFromReport(report: AuditReport): PresentationCard {
  const assessment = report.assessment?.seo;
  const supporting: string[] = [];

  if (!assessment) {
    return {
      label: "Overall SEO",
      value: "Not measured",
      tag: "Legacy report · assessment unavailable",
      detail:
        "This saved report does not include a scoped overall SEO assessment. Available page and search evidence remains below. Missing assessment is not a zero score.",
      supporting,
    };
  }

  if (assessment.incomplete || assessment.overall === null) {
    return {
      label: "Overall SEO",
      value: "Incomplete",
      tag: "Required evidence unresolved",
      detail:
        "We are withholding the total because required evidence is incomplete. This does not mean zero rankings or poor SEO.",
      supporting,
    };
  }

  return {
    label: "Overall SEO",
    value: `${assessment.overall} / 100`,
    tag: `Rubric ${assessment.rubricVersion}`,
    detail: "Scoped overall SEO from verified measurement dimensions — not a Lighthouse technical score.",
    supporting,
  };
}

function aiCardFromReport(report: AuditReport): PresentationCard {
  const ai = report.assessment?.ai;
  const sampling = report.aiSampling;
  const geography = report.auditContext?.geography;

  if (ai) {
    const mentions = ai.mentions;
    const value =
      mentions.denominator > 0
        ? `${mentions.count} / ${mentions.denominator} mentions`
        : "Not measured";
    const incomplete = ai.incomplete || ai.overall === null;
    return {
      label: "AI visibility",
      value: incomplete ? value : `${ai.overall} / 100`,
      tag: incomplete
        ? "Small-sample snapshot · overall incomplete"
        : "Small-sample snapshot",
      detail: incomplete
        ? ((ai.scopeWarnings?.length ?? 0)>0 ? "The US-wide request included local results. These counts are a snapshot, not a national visibility score." : "Counts apply only to retained buyer questions. An overall AI score is not established.")
        : `Mentions ${mentions.count}/${mentions.denominator}; own-domain citations ${ai.citations.count}/${ai.citations.denominator}.`,
      supporting: [
        ...(geography ? [`Geography context: ${geography}`] : []),
      ],
    };
  }

  // Legacy / partial: surface retained summary counts; never invent an overall score.
  const summary = sampling?.summary;
  if (summary && summary.mentions.denominator > 0) {
    return {
      label: "AI visibility",
      value: `${summary.mentions.count} / ${summary.mentions.denominator} mentions`,
      tag: "Legacy retained samples · overall not scored",
      detail:
        "Retained AI answer samples without a scoped overall AI assessment. Counts apply only to these questions — not national standing.",
      supporting: [
        ...(sampling?.scopeWarnings ?? []).map((w) => `Scope: ${w}`),
        ...(geography ? [`Geography context: ${geography}`] : []),
      ],
    };
  }

  if (report.chatGPT || report.googleAIMode) {
    const samples = [report.chatGPT, report.googleAIMode].filter(s => s?.state === "observed" && !s.error && typeof s.mentioned === "boolean");
    const mentioned = samples.filter(s => s?.mentioned === true).length;
    const denom = samples.length;
    return {
      label: "AI visibility",
      value: denom > 0 ? `${mentioned} / ${denom} mentions` : "Not measured",
      tag: "Legacy single-sample evidence",
      detail:
        "Older single-sample AI evidence without a scoped overall assessment. Unmeasured dimensions remain unmeasured.",
      supporting: [],
    };
  }

  return {
    label: "AI visibility",
    value: "Not measured",
    tag: "No usable AI sample retained",
    detail:
      "Consumer AI visibility was not measured in this report. Unmeasured is not absence and is not scored as zero.",
    supporting: [],
  };
}

function opportunitiesFromReport(report: AuditReport): PresentationOpportunity[] {
  const fromAssessment = (report.assessment?.opportunities ?? [])
    .filter((o) => o.kind !== "measurement_gap" && o.kind !== "positive_monitor")
    .slice(0, 3)
    .map((o) => ({
      id: o.id,
      title: o.kind === "thin_reputation" ? "Build credible public proof" : o.kind === "ai_absence" ? "Improve search and AI discoverability" : o.recommendedService,
      summary: o.deliverables.slice(0, 2).join(". "),
      evidence: o.evidence.slice(0, 2).map(e => e.replace("owner_assertion:reviews=none", "Owner-confirmed: no public reviews").replace("ai.mentions ", "Brand mentions: ").replace("proof.gap owner/case", "Public proof gap")).join(" · ") || `${o.kind.replace(/_/g, " ")} · ${o.confidence} confidence`,
    }));

  if (fromAssessment.length > 0) return fromAssessment;

  return []; // Older deficits remain in detailed evidence, not new unvalidated upsells.
}

function findingsFromReport(report: AuditReport, isLegacy: boolean): string[] {
  const findings: string[] = [];
  const checks=(report.directRank?.checks ?? []).filter(c=>c.hits.length>0 && ["ranked","not_found_top20","unknown_incomplete"].includes(c.outcome));
  if(checks.length){
    const found=checks.filter(c=>c.position!==null).length;
    findings.push(`${checks.length} buyer searches sampled; your site appeared in ${found} returned result sets. ${checks.some(c=>!c.completeTop20Window)?"Incomplete windows do not establish top-20 absence.":"Positions apply only to these sampled searches."}`);
  }
  const content=report.assessment?.seo.dimensions.find(d=>d.key==="content");
  if(content?.score!==null && content?.score!==undefined) findings.push(`Service/content relevance: ${content.score}/100 under our internal rubric. This is not an overall SEO or Google score.`);
  const verified=report.assessment?.competitors.filter(c=>c.status==="verified") ?? [];
  if(verified.length) findings.push(`Published service and market overlap confirmed: ${verified.slice(0,3).map(c=>c.domain).join(", ")}. Delivery quality is not independently verified.`);
  if(!findings.length) findings.push(isLegacy ? "Older saved evidence is available below; a newer overall assessment has not been retroactively invented." : "Available measurements are preserved below. Missing evidence is not a negative finding about the business.");
  return findings.slice(0,3);
}

function headlineFor(report: AuditReport, opportunities: PresentationOpportunity[]): string {
  const kinds = new Set(
    (report.assessment?.opportunities ?? [])
      .filter((o) => o.kind !== "measurement_gap")
      .map((o) => o.kind)
  );
  if (kinds.has("thin_reputation") && kinds.has("ai_absence")) {
    return "Public proof is your next opportunity.";
  }
  if (kinds.has("thin_reputation")) {
    return "Stronger public proof would clarify your standing.";
  }
  if (kinds.has("ai_absence")) {
    return "AI answers did not mention you in this sample.";
  }
  if (kinds.has("search_content_gap") || kinds.has("website_defect")) {
    return "Focused fixes can improve what buyers see.";
  }
  if (opportunities.length > 0) {
    return "Here is a focused plan from the evidence collected.";
  }
  if (!report.assessment) {
    return "Here is what this saved audit measured.";
  }
  // Do not force good/unknown into weakness.
  return "Evidence collected — review the findings below.";
}

function introFor(report: AuditReport, isLegacy: boolean): string {
  const tech = seoOverview(report);
  const parts: string[] = [];
  if (tech.score !== null && tech.score >= 90) {
    parts.push("Strong technical checks.");
  } else if (tech.score !== null) {
    parts.push("Technical page checks are available.");
  }
  if (report.assessment?.opportunities?.some((o) => o.kind === "thin_reputation")) {
    parts.push("Limited public proof.");
  }
  if (isLegacy) {
    parts.push("Legacy report format — overall scores may be unavailable.");
  } else {
    parts.push("A focused plan from retained evidence — not a compulsory rebuild.");
  }
  return parts.join(" ");
}

/**
 * Pure presentation model for condensed report UI.
 * Never publishes technical Lighthouse as overall, invented ranks/revenue,
 * math bounds on the headline, or measurement gaps as service upsells.
 */
export function buildReportPresentation(
  session: Pick<ScanSession, "business_name" | "website_url" | "zip_code"> & { id?: string },
  report: AuditReport,
  sessionId: string
): ReportPresentation {
  const isLegacy = !report.assessment;
  const captureDates=[...new Set((report.directRank?.checks ?? []).map(c=>c.observedAt?.slice(0,10)).filter((d):d is string=>Boolean(d && /^\d{4}-\d{2}-\d{2}$/.test(d))))].sort();
  const dateNote=captureDates.length ? ` · Buyer-search snapshot: ${[captureDates[0],captureDates[captureDates.length-1]].filter((d,i,arr)=>arr.indexOf(d)===i).join(" to ")}` : "";
  const opportunities = opportunitiesFromReport(report);
  const provenanceNotes: string[] = [];
  const meta = report.auditMeta;
  if (meta?.pageSpeed) {
    provenanceNotes.push('Supporting Lighthouse results and measurement dates are retained in the detailed evidence.');
  }
  if (report.coverage?.status === "partial" && report.coverage.missing.length) {
    provenanceNotes.push(`Partial coverage: ${report.coverage.missing.join("; ")}.`);
  }
  if (report.aiSampling?.summary) {
    provenanceNotes.push(
      `AI sample size ${report.aiSampling.summary.available}/${report.aiSampling.summary.total} usable retained.`
    );
  }

  return {
    businessName: session.business_name,
    headline: headlineFor(report, opportunities),
    intro: introFor(report, isLegacy),
    seoCard: seoCardFromReport(report),
    aiCard: aiCardFromReport(report),
    findings: findingsFromReport(report, isLegacy),
    opportunities,
    consultationHref: consultationHref(sessionId),
    consultationLabel: "Discuss my priorities",
    reportPath: canonicalReportPath(sessionId),
    isLegacy,
    geographyNote:
      (report.auditContext?.geography === "national" ? "US-wide request" : report.auditContext?.geography ?? (session.zip_code ? `ZIP ${session.zip_code} sampling context` : "Geography not retained")) + dateNote,
    provenanceNotes,
  };
}
