/* eslint-disable @typescript-eslint/no-explicit-any -- isolated browser fixtures */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/precision_focused_solutions/.hermes/hermes-agent/node_modules/playwright');
const base=process.env.AUDIT_QA_BASE||'http://127.0.0.1:3189';
async function main(){
 const report=JSON.parse(readFileSync(process.env.AUDIT_QA_REPORT!, 'utf8')).result.report;
 // Explicit synthetic expansion: exercises realistic long URLs, not live evidence.
 const long='https://example.com/'+('long-published-service-page-'.repeat(12));
 report.domainResearch={collectedAt:'2026-09-21T00:00:00Z',methodology:'OFFLINE synthetic browser fixture',rankedKeywords:{state:'observed',totalDatabaseItems:20,keywords:Array.from({length:20},(_,i)=>({keyword:'Synthetic consulting keyword '+i,url:long+i,rankGroup:i+1,monthlySearchVolumeEstimate:100,serpUpdatedAt:null,keywordDataUpdatedAt:null}))},relatedCompetitors:{state:'observed',competitors:[{domain:'example.org',intersectingKeywords:5,averagePositionOnIntersectingKeywords:4}]}};
 report.siteReview={coverage:{inspected:3,attempted:3,discovered:10,limit:8},pages:[{url:long,status:'observed',httpStatus:200,title:'Synthetic page'}],errors:[],samplingLimits:['OFFLINE fixture']};
 const metric={total:3,available:3,unavailable:0,mentions:{count:1,denominator:3},citations:{count:1,denominator:3}};
 report.aiSampling={summary:{total:6,available:6},byEngine:{chatgpt:metric,google_ai_mode:metric},methodology:'OFFLINE fixture',samples:['chatgpt','google_ai_mode'].flatMap(engine=>['provider_shortlist','specific_service','comparison_selection'].map(intent=>({key:engine+intent,engine,intent,query:'Synthetic buyer question '+intent,evidence:{state:'observed',observedAt:'2026-09-21',location:'United States',source:'offline fixture',answer:'Synthetic answer '+long,citations:[{url:long,title:long}]}})))};
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{for(const width of [390,1280])for(const scenario of ['saved-present','saved-report','async-success','async-failed']){
  const page=await browser.newPage({viewport:{width,height:900}});let runs=0,reads=0;const id='11111111-1111-4111-8111-111111111111';
  await page.route('**/*',async(route:any)=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();if(!u.pathname.startsWith('/api/'))return route.continue();
   if(u.pathname.endsWith('/run')){runs++;return route.fulfill({status:202,json:{status:'scanning'}});}
   if(u.pathname===`/api/sessions/${id}`){reads++;const ready=scenario.startsWith('saved')||(scenario==='async-success'&&reads>1);return route.fulfill({json:{session:{id,business_name:'OFFLINE browser fixture',website_url:'https://example.com',zip_code:'27401',mode:'organic',status:ready?'complete':scenario==='async-failed'&&reads>1?'failed':'scanning',report:ready?report:null}}});}
   return route.fulfill({json:{ok:true}});
  });
  await page.goto(`${base}/${scenario==='saved-report'?'report':'present'}/${id}`);
  if(scenario==='async-failed'){await page.getByText('The audit stopped before completion.',{exact:false}).waitFor();assert((await page.locator('p[role="alert"]').innerText()).includes('stopped before completion'));assert.equal(runs,1);}
  else{await page.getByText('Existing rankings & search competitors',{exact:true}).waitFor();await page.locator('details').evaluateAll((els:any[])=>els.forEach(e=>e.open=true));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);assert.equal(await page.getByText('Synthetic buyer question provider_shortlist',{exact:true}).count(),2);assert.equal(runs,scenario==='async-success'?1:0);if(scenario.startsWith('saved')){await page.reload();await page.getByText('Existing rankings & search competitors',{exact:true}).waitFor();assert.equal(runs,0);}}
  console.log(`PASS ${width} ${scenario}: expanded evidence, exact viewport width, bounded run/poll behavior (OFFLINE)`);await page.close();
 }}finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
