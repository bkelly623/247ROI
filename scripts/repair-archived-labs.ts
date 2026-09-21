import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseDomainResearchResponse} from '../src/lib/audit/probes/domain-research';
import type {AuditReport} from '../src/lib/audit/types';
const row=JSON.parse(readFileSync(process.env.REPAIR_ROW!,'utf8'));
const report:AuditReport=row.report;const original=structuredClone(report);
const captures=JSON.parse(readFileSync(process.env.LABS_ARCHIVES!,'utf8')) as {request_key:string;raw_text:string;raw_sha256:string}[];
for(const c of captures){
 assert.equal(createHash('sha256').update(c.raw_text).digest('hex'),c.raw_sha256);
 const kind=c.request_key.includes(':competitors_domain:')?'competitors_domain':'ranked_keywords';
 const field=kind==='ranked_keywords'?'rankedKeywords':'relatedCompetitors';
 const old=report.domainResearch![field];assert.equal(old.receipt!.rawSha256,c.raw_sha256);
 const corrected=parseDomainResearchResponse({target:report.domainResearch!.target},kind,c.raw_text);
 assert.equal(corrected.state,'no_data');
 report.domainResearch![field]={...corrected,receipt:old.receipt};
}
assert.deepEqual(report.aiSampling,original.aiSampling);assert.deepEqual(report.googleLocal,original.googleLocal);
assert.deepEqual(report.deficits,original.deficits);
assert.deepEqual(Object.keys(report).filter(k=>JSON.stringify(report[k as keyof AuditReport])!==JSON.stringify(original[k as keyof AuditReport])),['domainResearch']);
writeFileSync(process.env.REPAIR_OUTPUT!,JSON.stringify(report,null,2),{mode:0o600});
console.log('PASS exact retained raw hashes reparsed; original receipts preserved; domainResearch-only change');
