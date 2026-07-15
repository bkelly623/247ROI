import type { DiscoveryState } from "./types";

export type ProgressStepId =
  | "industry"
  | "problem"
  | "hours"
  | "fit"
  | "hire";

export type ProgressStep = {
  id: ProgressStepId;
  label: string;
  done: boolean;
  current: boolean;
};

/** Visible checklist: Industry → Problem → Hours → Fit → Hire */
export function getHireProgress(discovery: DiscoveryState): ProgressStep[] {
  const stage = discovery.salesStage || "industry";
  const hasIndustry = Boolean(discovery.businessType);
  const hasTask =
    discovery.notes.includes("task_captured") ||
    discovery.pains.some((p) => p.id === "pain1" && p.title);
  const hasHours =
    discovery.notes.includes("desk_time_captured") ||
    discovery.pains.some(
      (p) =>
        p.time.statedHoursPerWeek != null || p.time.computedHoursPerWeek != null
    );
  const hasFit =
    discovery.notes.includes("mirrored") ||
    discovery.notes.includes("pitched_value") ||
    discovery.notes.includes("second_order") ||
    ["confirm", "second_order", "want_solve", "value", "pitch"].includes(stage);
  const hasHire =
    discovery.notes.includes("pitched_value") ||
    stage === "value" ||
    stage === "pitch";

  let current: ProgressStepId = "industry";
  if (!hasIndustry) current = "industry";
  else if (!hasTask) current = "problem";
  else if (!hasHours) current = "hours";
  else if (!hasFit || (!hasHire && hasFit)) current = hasHire ? "hire" : "fit";
  else current = "hire";

  if (hasHire) current = "hire";
  else if (hasFit) current = "fit";
  else if (hasHours) current = "hours";
  else if (hasTask) current = "problem";
  else if (hasIndustry) current = "problem";

  const order: { id: ProgressStepId; label: string; done: boolean }[] = [
    { id: "industry", label: "Industry", done: hasIndustry },
    { id: "problem", label: "Problem", done: hasTask },
    { id: "hours", label: "Hours", done: hasHours },
    { id: "fit", label: "Fit", done: hasFit },
    { id: "hire", label: "Hire", done: hasHire && stage === "pitch" },
  ];

  return order.map((s) => ({
    ...s,
    current: s.id === current,
  }));
}

export function impactFromNotes(notes: string[]): string | null {
  const raw = notes.find((n) => n.startsWith("impact:"));
  if (!raw) return null;
  const text = raw.slice(7).trim();
  return text.length > 2 ? text : null;
}

export function buildHireSmsHref(input: {
  industry?: string | null;
  pain?: string | null;
  hours?: number | null;
  employeeName?: string | null;
}): string {
  const bits = [
    "AI employee audit",
    input.industry ? `Industry: ${input.industry}` : null,
    input.pain ? `Pain: ${input.pain}` : null,
    input.hours != null ? `Hours/wk: ${input.hours}` : null,
    input.employeeName ? `Hire: ${input.employeeName}` : null,
  ].filter(Boolean);
  const body = encodeURIComponent(bits.join(" · "));
  return `sms:+19175727734?body=${body}`;
}
