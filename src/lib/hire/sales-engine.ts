import type { ChatTurn } from './schema';
import { askWhatEatsTime, normalizeIndustryLabel, proposalFallback } from './prompt';
import { applyUserControls, choicesFor, nextDiscoveryStep } from './discovery-policy';
import { primaryPain } from './estimates';
import { emptyDiscovery, type DiscoveryState, type HireMessage, type PainPoint } from './types';

export const OPENING = "Let's find one thing worth taking off your plate. What kind of business do you run? You can also tell me what's eating your time.";

/** A weekly number needs a weekly unit. Never silently assume five working days. */
export function extractWeeklyHours(text: string): number | null {
  const week = text.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?)\s*(?:a|per|each|\/)\s*(?:week|wk)/i);
  if (week) {
    const n = Number(week[1]) / (/min/i.test(week[2]) ? 60 : 1);
    return n >= 0 && n <= 168 ? n : null;
  }
  const day = text.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?)\s*(?:a|per|each|\/)\s*day/i);
  const days = text.match(/(\d+)\s*days?\s*(?:a|per|each|\/)\s*week/i);
  if (day && days && +days[1] <= 7) {
    const n = +day[1] * +days[1] / (/min/i.test(day[2]) ? 60 : 1);
    return n <= 168 ? n : null;
  }
  return null;
}
function titleFrom(text: string) {
  if (/follow|chas.*quote|chas.*estimat/i.test(text)) return 'Quote follow-up';
  if (/estimat|quote|takeoff|bid/i.test(text)) return 'Estimates and quotes';
  if (/schedul|dispatch|appoint|booking/i.test(text)) return 'Scheduling';
  if (/bookkeep|invoice|billing|payroll/i.test(text)) return 'Invoicing and bookkeeping';
  if (/inbox|email|paperwork|document/i.test(text)) return 'Inbox and paperwork';
  if (/lead|missed.call|voicemail/i.test(text)) return 'Lead response';
  if (/report|spreadsheet|dashboard/i.test(text)) return 'Reporting';
  return text.slice(0,70);
}
const unknown = (s: string) => /^(not sure|i don.?t know|idk|skip|unknown|no idea|prefer not)/i.test(s);
function newPain(text: string): PainPoint {
  return { id:'pain1', title:titleFrom(text), rawDescription:text.slice(0,300), tools:[], processSteps:[], whoDoesIt:null, whyItHurts:null,
    time:{label:'This task',minutesPerOccurrence:null,occurrencesPerWeek:null,hiddenMinutesPerOccurrence:null,computedHoursPerWeek:null,statedHoursPerWeek:null,underestimationNote:null}, automatable:null, confidence:.5 };
}

/** Same progression for model and guided fallback; confirmation happens in the UI. */
export function guidedTurn(discovery: DiscoveryState): ChatTurn {
  const d = structuredClone(discovery), p = primaryPain(d), step = nextDiscoveryStep(d);
  d.salesStage = step;
  let reply = OPENING;
  let phase: ChatTurn['phase'] = 'warming';
  if (step === 'task') { reply = askWhatEatsTime(d.businessType!); phase = 'pain1'; }
  if (step === 'process') { reply = `Let's make ${p!.title.toLowerCase()} concrete. Walk me through one recent example—what happens, and which tools do you use?`; phase = 'process'; }
  if (step === 'time') { reply = `Roughly how many hours a week go into ${p!.title.toLowerCase()}? An estimate is fine, or choose “Not sure yet.”`; phase = 'time_verify'; }
  if (step === 'relief') { reply = p?.automatable === false ? 'The judgment or hands-on work stays with you. What would better preparation or fewer interruptions free you to focus on?' : 'The goal is less chasing, not another tool to babysit. What would getting this off your plate make room for?'; phase = 'pain2_probe'; }
  if (step === 'review') { reply = 'Here’s what I’ve understood. Check the summary below, change anything I missed, then see your recommendation—no contact details required.'; phase = 'ready'; }
  return { reply, phase, discovery:d, proposal: step === 'review' ? proposalFallback(d) : null, readyForGate:step === 'review', teaserLine:null, choices:choicesFor(d), inputMode:'both' };
}
export function runSalesTurn(discovery: DiscoveryState, messages: HireMessage[]): ChatTurn {
  const text = messages.filter(m=>m.role==='user').at(-1)?.content.trim() || '';
  const d = structuredClone(discovery), step = nextDiscoveryStep(d);
  if (!text) return guidedTurn(d);
  if (!d.businessType && !unknown(text) && !/^(hi|hello|hey|business owner|owner)[.! ]*$/i.test(text)) {
    const industry = text.match(/\b(roof(?:ing|er)?|plumb(?:ing|er)?|HVAC|electric(?:al|ian)?|landscap(?:ing|er)?|construction|home services|professional services|retail|ecommerce|agency|accounting|dental|clinic|chiropractic|restaurant|salon|consulting)\b/i);
    // Ambiguous task-first answers must not become an industry.
    if (industry) d.businessType=normalizeIndustryLabel(industry[1]);
    else if (text.length < 65 && !/inbox|email|follow|schedul|paperwork|help|not sure|hours|quote/i.test(text)) d.businessType=normalizeIndustryLabel(text);
  }
  let p = primaryPain(d);
  const taskWords = /follow|schedul|dispatch|inbox|email|paperwork|invoice|bookkeep|estimat|quote|lead|missed.call|report|payroll|diagnos|surgery|install|physical|repair/i.test(text);
  if (!p && !unknown(text) && ((step==='task' && text.length>5) || taskWords)) { p=newPain(text); d.pains=[p,...d.pains]; d.activePainId=p.id; }
  if (p) {
    const weekly = extractWeeklyHours(text);
    if (weekly != null) { p.time.statedHoursPerWeek=weekly; p.time.computedHoursPerWeek=weekly; d.notes=d.notes.filter(n=>n!=='hours_unknown'); }
    if (step==='time' && unknown(text)) { p.time.statedHoursPerWeek=null; p.time.computedHoursPerWeek=null; d.notes.push('hours_unknown'); }
    const concrete = /\b(then|copy|send|open|check|enter|search|call|log|review|read|compare|manually|first)\b/i.test(text) && text.length>35;
    if ((step==='process' && !unknown(text) && text.length>20) || concrete) {
      p.processSteps=text.split(/\bthen\b|→|;/i).map(s=>s.trim().slice(0,160)).filter(Boolean).slice(0,5);
      p.rawDescription=text.slice(0,300);
      const tools=text.match(/\b(Excel|Gmail|Outlook|QuickBooks|Jobber|ServiceTitan|Housecall Pro|CRM|spreadsheet|email|paper|calendar)\b/gi);
      p.tools=[...new Set([...p.tools,...(tools||[])])];
      if (/email|copy|spreadsheet|CRM|data entry|reminder|paperwork|inbox|follow.up|bookkeep|quote|estimat/i.test(text)) p.automatable=true;
      if (/diagnos|surgery|physical|install|hands.on|final legal|medical decision/i.test(text)) p.automatable=false;
    }
  }
  if (step==='relief') {
    d.notes.push('relief_asked');
    if (!unknown(text) && !/show my|recommendation|report|skip/i.test(text)) d.notes.push(`impact:${text.slice(0,180)}`);
  }
  d.notes=[...new Set(d.notes)].slice(-30);
  return guidedTurn(applyUserControls(discovery,d,text));
}
export function openingTurn(): ChatTurn { return guidedTurn(emptyDiscovery()); }
