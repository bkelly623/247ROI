import type { DiscoveryState, HireProposal } from './types';

export type HireEstimate = {
  basis: '247ROI benchmark for suitable repetitive work';
  taskHours: number | null;
  weekly: { low: number; high: number } | null;
  note: string;
};
export function primaryPain(d: DiscoveryState) {
  return d.pains.find(p => p.id === d.activePainId) ?? d.pains.find(p => p.id === 'pain1') ?? d.pains[0];
}
export function requiresHumanJudgment(d: DiscoveryState): boolean {
  const p=primaryPain(d);
  const task=`${p?.title||''} ${p?.processSteps.join(' ')||''}`;
  return /diagnos(?:ing|is|e)|prescrib|choose (?:their )?treatment|treatment decisions?|perform(?:ing)? surgery|final (?:clinical|medical|legal|financial) decisions?|hands.on (?:repair|installation)/i.test(task);
}
const round = (n: number) => Math.round(n * 10) / 10;
export function buildHireEstimate(d: DiscoveryState): HireEstimate {
  const p = primaryPain(d);
  const invalid = [p?.time.statedHoursPerWeek, p?.time.computedHoursPerWeek].some(n => n != null && (!Number.isFinite(n) || n < 0 || n > 168));
  // Only stated task hours or explicit frequency × duration. Never trust invented hidden time.
  const derived = p?.time.minutesPerOccurrence != null && p.time.occurrencesPerWeek != null
    ? p.time.minutesPerOccurrence * p.time.occurrencesPerWeek / 60 : null;
  const hours = p?.time.statedHoursPerWeek ?? derived;
  const taskHours = !invalid && hours != null && Number.isFinite(hours) && hours >= 0 && hours <= 168 ? hours : null;
  const eligible = p?.automatable === true && !requiresHumanJudgment(d) && taskHours != null && taskHours > 0;
  return {
    basis: '247ROI benchmark for suitable repetitive work', taskHours,
    weekly: eligible ? { low: round(taskHours * .7), high: round(taskHours * .9) } : null,
    note: eligible
      ? `Planning range: 70–90% of the ${taskHours} task hours/week you described, not your whole workweek. Actual savings depend on the repeatable portion, tool access and human review. Validate with a small pilot; not a guarantee or measured result.`
      : p?.automatable === false ? 'Keep judgment and hands-on work human. No time-saving estimate for automating this task.'
      : 'Time saving not estimated yet. Confirm the weekly time spent on repeatable steps before assigning a number.',
  };
}
export function applyHireEstimate(p: HireProposal, d: DiscoveryState): HireProposal {
  const estimate = buildHireEstimate(d);
  const weekly = estimate.weekly ?? { low: 0, high: 0 };
  return { ...p, estimate, hoursSavedPerWeek: weekly, monthlyHoursSaved: { low: round(weekly.low * 4), high: round(weekly.high * 4) } };
}
