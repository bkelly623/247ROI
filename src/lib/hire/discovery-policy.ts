import type { DiscoveryState } from './types';
import { buildHireEstimate, primaryPain, requiresHumanJudgment } from './estimates';

export type HireChoice = { id: string; label: string; value: string };
export function canProduceBrief(d: DiscoveryState) {
  const p = primaryPain(d);
  return Boolean(d.businessType?.trim() && p?.title?.trim() && p.rawDescription?.trim() && p.processSteps?.length);
}
export function discoverySummary(d: DiscoveryState) {
  const p = primaryPain(d), e = buildHireEstimate(d);
  return [
    { label: 'First priority', value: p?.title || 'Still finding it' },
    { label: 'Business', value: d.businessType || 'Not yet shared' },
    { label: 'Time on this task', value: e.taskHours == null ? 'Not estimated' : `${e.taskHours} hours/week` },
    { label: 'Tools', value: p?.tools.join(', ') || 'Not yet confirmed' },
    { label: 'Today', value: p?.processSteps.join(' → ') || 'Not yet mapped' },
  ];
}
export function nextDiscoveryStep(d: DiscoveryState): 'industry' | 'task' | 'process' | 'time' | 'relief' | 'review' {
  const p = primaryPain(d);
  if (!d.businessType) return 'industry';
  if (!p?.title) return 'task';
  if (!p.processSteps.length) return 'process';
  if (buildHireEstimate(d).taskHours == null && !d.notes.includes('hours_unknown') && p.automatable !== false) return 'time';
  if (!d.notes.some(n => n.startsWith('impact:')) && !d.notes.includes('relief_asked')) return 'relief';
  return 'review';
}
export function applyUserControls(prior: DiscoveryState, next: DiscoveryState, text: string): DiscoveryState {
  const d=structuredClone(next), p=primaryPain(d);
  if(p && requiresHumanJudgment(d))p.automatable=false;
  const unsure=/not sure|do(?:n['’]?t| not) know|unknown|prefer not|skip/i.test(text);
  const asksForPlan=/show (?:me )?(?:my |the )?(?:plan|recommendation|report)|keep that unknown/i.test(text);
  if(p && ((unsure && (/hours|how long|time it takes/i.test(text)||nextDiscoveryStep(prior)==='time')) || (asksForPlan && buildHireEstimate(d).taskHours==null))){
    p.time={...p.time,statedHoursPerWeek:null,computedHoursPerWeek:null,minutesPerOccurrence:null,occurrencesPerWeek:null,hiddenMinutesPerOccurrence:null};
    d.notes.push('hours_unknown');
  }
  if(asksForPlan || nextDiscoveryStep(prior)==='relief')d.notes.push('relief_asked');
  d.notes=[...new Set(d.notes)];return d;
}
export function choicesFor(d: DiscoveryState): HireChoice[] {
  const step = nextDiscoveryStep(d);
  const values = step === 'industry' ? ['Home services / trades', 'Professional services', 'Retail / ecommerce']
    : step === 'task' ? ['Following up on quotes', 'Scheduling and reminders', 'Inbox and paperwork', 'Not sure — help me choose']
    : step === 'time' ? ['2 hours/week', '5 hours/week', '10 hours/week', 'Not sure yet']
    : step === 'relief' ? ['More time with family', 'Room for more jobs', 'Less stress and chasing', 'Show my recommendation'] : [];
  return values.map((value, i) => ({ id: `${step}-${i}`, label: value, value }));
}
