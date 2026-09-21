import type { AuditDeficit, AuditReport } from "./types";
import type { DomainResearchEvidence } from "./probes/domain-research";
import type { SiteReviewResult } from "./probes/site-review";
import type { AISamplingReport } from "./probes/ai-sampling";

export function researchDeficits(businessName:string, base:AuditReport, domain:DomainResearchEvidence, site:SiteReviewResult, ai?:AISamplingReport):AuditDeficit[] {
  const findings:AuditDeficit[]=[...base.deficits.map(d=>({...d,evidenceUrl:d.evidenceUrl??base.sitePreview?.websiteUrl,confidence:"high" as const,effort:"medium" as const})),
    ...site.findings.map(f=>({severity:f.severity,finding:f.finding,fix:f.fix,category:"seo" as const,evidenceUrl:f.evidenceUrl,
      confidence:f.category==="suggestion"?"low" as const:"medium" as const,effort:"small" as const,serviceFit:"Targeted technical SEO & website improvements"}))];
  const brand=businessName.toLowerCase().replace(/[^a-z0-9 ]/g,"");
  const candidates=domain.rankedKeywords.keywords.filter(k=>k.rankGroup>=4&&k.rankGroup<=20&&(!brand||!k.keyword.toLowerCase().replace(/[^a-z0-9 ]/g,"").includes(brand))).sort((a,b)=>(b.monthlySearchVolumeEstimate??-1)-(a.monthlySearchVolumeEstimate??-1));
  for (const k of candidates.slice(0,2)) findings.push({severity:"info",category:"seo",finding:`Existing ranking opportunity: “${k.keyword}” at organic position ${k.rankGroup} in the provider database.`,
    fix:`Confirm this search attracts the right customers, then review the existing ranking page's service detail, useful proof and internal links before creating another page.${k.monthlySearchVolumeEstimate!==null?` Approximate US monthly search demand: ${k.monthlySearchVolumeEstimate}; this is not your traffic.`:" Search demand is unavailable."}`,
    evidenceUrl:k.url,confidence:"medium",effort:"medium",serviceFit:"SEO content improvement & internal linking"});
  if (ai && ai.summary.available>0 && ai.summary.mentions.denominator>0 && ai.summary.mentions.count===0) {
    const cited=ai.samples.find(s=>s.evidence.state==="observed"&&s.evidence.citations.length)?.evidence.citations[0];
    findings.push({severity:"info",category:"ai",finding:`No business-name match in ${ai.summary.mentions.denominator} measured AI answers for the selected buyer questions.`,
      fix:"Review the captured answers and cited providers, verify business-name variants, and compare your service information and public proof with the cited pages. Improve demonstrated gaps, then repeat the same questions; this does not establish why an AI selected another provider or prove overall invisibility.",
      evidenceUrl:cited?.url,confidence:"medium",effort:"medium",serviceFit:"AI visibility measurement, service content & business-identity consistency"});
  }
  const seen=new Set<string>();
  return findings.filter(f=>{const key=f.finding+f.evidenceUrl;if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>({critical:0,warning:1,info:2}[a.severity]-{critical:0,warning:1,info:2}[b.severity])).slice(0,16);
}
