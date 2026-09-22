/* eslint-disable @typescript-eslint/no-explicit-any -- external browser harness */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {buildAuditAssessment} from '../src/lib/audit/assessment';
import {collectDirectRanks} from '../src/lib/audit/probes/direct-rank';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/precision_focused_solutions/.hermes/hermes-agent/node_modules/playwright');
async function main(){
 const base=process.env.AUDIT_BASE ?? 'http://127.0.0.1:3217';
 const fixture=JSON.parse(readFileSync(process.env.SEO_REPORT!,'utf8'));
 const report=fixture.session.report;
 // Retained local captures remain local; this is not a fresh national audit.
 const context={version:1 as const,geography:'local' as const,ownerAssertions:{reviews:{status:'none' as const,source:'owner_confirmed' as const}}};
 report.auditContext=context;
 report.directRank=await collectDirectRanks({businessName:'247ROI',websiteUrl:'https://www.get247roi.com',zipCode:'49083',servicePhrase:'AI business automation consultant',auditContext:context},{enableCollection:false,authorize:async()=>false,transport:async()=>{throw new Error('Forbidden paid request');}});
 report.assessment=buildAuditAssessment({report,auditContext:context,directRank:report.directRank,businessHost:'get247roi.com'});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']}); const results=[];
 try{for(const width of [390,1280])for(const routeName of ['report','present']){
  const page=await browser.newPage({viewport:{width,height:844}}); let runs=0;const errors:string[]=[];
  page.on('pageerror',(e:Error)=>errors.push(e.message));
  await page.route('**/*',async(route:any)=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();if(!u.pathname.startsWith('/api/'))return route.continue();if(u.pathname.endsWith('/run')){runs++;return route.abort();}return route.fulfill({json:u.pathname.startsWith('/api/sessions/')?fixture:{ok:true}});});
  await page.goto(`${base}/${routeName}/${fixture.session.id}`);
  const summary=page.getByTestId('assessment-summary'); await summary.waitFor();
  assert.equal(await page.getByTestId('assessment-seo-overall').innerText(),'Overall assessment incomplete');
  assert.match(await summary.innerText(),/Owner-confirmed absence of public reviews/);
  assert.match(await summary.innerText(),/not validated recommendations/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
  assert((await summary.boundingBox())!.y < (await page.getByTestId('seo-overview').boundingBox())!.y);
  await page.reload();await summary.waitFor();assert.equal(runs,0);assert.deepEqual(errors,[]);
  results.push({width,routeName,overallIncomplete:true,ownerProofOpportunity:true,reopenCollectionCalls:runs,overflow:false});await page.close();
 }}finally{await browser.close();}
 assert.equal(results.length,4);writeFileSync(process.env.STAGE3_BROWSER_OUTPUT!,JSON.stringify(results,null,2));console.log(results);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
