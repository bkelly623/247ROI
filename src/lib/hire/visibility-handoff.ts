import type { ScanSession } from '@/lib/audit/types';
import type { DiscoveryState } from './types';

export function validVisibilityId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
/** Only bounded, structured facts; never copy crawler instructions or contact fields into chat. */
export function attachVisibilityContext(discovery: DiscoveryState, scan: ScanSession): DiscoveryState {
  const a=scan.report?.assessment;
  const notes=[`Saved visibility report: /report/${scan.id}. This is sampled evidence, not a ranking or revenue guarantee.`];
  if(a){
    notes.push(a.seo.incomplete || a.seo.overall===null ? 'Overall SEO not scored: required evidence unresolved.' : `Internal SEO rubric score: ${a.seo.overall}/100.`);
    notes.push(`AI brand mentions: ${a.ai.mentions.count}/${a.ai.mentions.denominator} retained answers. ${a.ai.incomplete?'Overall AI score unresolved.':'Small sample, not national market share.'}`);
    const known=['thin_reputation','ai_absence','search_content_gap','website_defect'];
    const kinds=a.opportunities.filter(o=>known.includes(o.kind)).map(o=>o.kind);
    if(kinds.length) notes.push(`Evidence-backed priorities: ${[...new Set(kinds)].slice(0,3).join(', ')}. Confirm the owner's goals before recommending services.`);
  }else notes.push('Legacy report: no scoped overall assessment. Do not invent missing scores.');
  return {...discovery,businessName:scan.business_name.slice(0,160),notes:[...discovery.notes,...notes]};
}
