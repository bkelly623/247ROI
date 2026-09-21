import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {probeSiteReview} from '../src/lib/audit/probes/site-review';
import {queryCorrection} from '../src/lib/audit/query-correction';
import {measurementCoverage,primaryRecommendation} from '../src/lib/audit/measurement-coverage';
import {researchDeficits} from '../src/lib/audit/research-deficits';
import {buildDefaultAdvisorSteps} from '../src/lib/audit/llm-enrich';
import type {AuditReport} from '../src/lib/audit/types';
async function main(){
 for(const variant of ['ok','private','robots','foreign']){
  const calls:string[]=[];
  const result=await probeSiteReview({websiteUrl:'https://example.org'},{resolve:async h=>[{address:variant==='private'&&h.startsWith('www.')?'10.0.0.1':'8.8.8.8',family:4}],request:async u=>{
   calls.push(u.href);
   if(u.pathname==='/robots.txt')return {status:200,text:variant==='robots'&&u.hostname.startsWith('www.')?'User-agent: *\nDisallow: /':'',headers:{}};
   if(u.hostname==='example.org')return {status:308,text:'',headers:{location:variant==='foreign'?'https://evil.org/':'https://www.example.org/'}};
   return {status:200,text:'<html><title>Test</title><h1>Test</h1></html>',headers:{'content-type':'text/html'}};
  }});
  assert.equal(result.coverage.inspected,variant==='ok'?1:0,variant);
  if(variant==='ok')assert(calls.includes('https://www.example.org/robots.txt'));
  if(variant!=='ok')assert(!calls.includes('https://www.example.org/'));
 }
 assert.equal(queryCorrection({search_information:{showing_results_for:'247'}}),'247');
 assert.equal(queryCorrection({}),undefined);
 console.log('PASS canonical redirect, private DNS, canonical robots denial, foreign redirect and query correction');
 if(!process.env.OWNER_REPAIR_DIR)return;
 const dir=process.env.OWNER_REPAIR_DIR;
 const old:AuditReport=JSON.parse(readFileSync(dir+'/owner-failed-test-original.json','utf8')).session.report;
 const report=structuredClone(old);
 assert(report.googleLocal && old.googleLocal);
 const google=report.googleLocal;
 const site=await probeSiteReview({websiteUrl:'https://get247roi.com'});
 writeFileSync(dir+'/owner-repair-live-crawl.json',JSON.stringify(site,null,2),{mode:0o600});
 assert(site.coverage.inspected>0,JSON.stringify(site.errors));
 report.siteReview=site;
 google.blocks=google.blocks.map(b=>{
  const capture=google.captures?.find(c=>c.query===b.query);
  const correction=typeof capture?.raw === "string"?queryCorrection(JSON.parse(capture.raw)):undefined;
  return correction?{...b,queryCorrection:correction}:b;
 });
 assert.equal(google.blocks.find(b=>b.query==='247roi')?.queryCorrection,'247');
 google.summary='Business not matched in the retained unbranded local/organic samples. Google changed the branded query to “247”; brand visibility for the requested spelling is unmeasured. Google AI Overview timed out; the other Google captures succeeded.';
 report.sections=report.sections.map(s=>s.key==='seo'?{...s,summary:google.summary}:s);
 report.coverage={status:'partial',missing:[...old.coverage!.missing.filter(x=>!['Multi-page website inspection','Some live Google search captures'].includes(x)),...measurementCoverage(report,site),'Exact branded query: Google returned corrected-query results']};
 report.deficits=researchDeficits('247roi',report,report.domainResearch!,site);
 report.packages.primary={...report.packages.primary,...primaryRecommendation(report.deficits)};
 report.advisorSteps=buildDefaultAdvisorSteps(report);
 report.opportunityHeadline=`247roi: keyword database result remains unverified; ${site.coverage.inspected} inspected pages and 6 captured AI answers. Scope and unavailable checks are shown below.`;
 const allowed=['siteReview','googleLocal','sections','coverage','deficits','packages','advisorSteps','opportunityHeadline'];
 const changed=Object.keys(report).filter(k=>JSON.stringify(report[k as keyof AuditReport])!==JSON.stringify(old[k as keyof AuditReport]));
 assert(changed.every(k=>allowed.includes(k)));
 assert.deepEqual(report.domainResearch,old.domainResearch);
 assert.deepEqual(report.aiSampling,old.aiSampling);
 assert.deepEqual(google.captures,old.googleLocal.captures);
 writeFileSync(dir+'/owner-repaired-report.json',JSON.stringify(report,null,2),{mode:0o600});
 console.log('LIVE FREE CRAWL',site.coverage,site.errors,'changed',changed);
}
main().catch(e=>{console.error(e);process.exitCode=1});
