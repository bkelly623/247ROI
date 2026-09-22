/* eslint-disable @typescript-eslint/no-explicit-any -- external browser harness */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/precision_focused_solutions/.hermes/hermes-agent/node_modules/playwright');
async function main(){
 const base=process.env.AUDIT_BASE ?? 'http://127.0.0.1:3218';
 const out=process.env.STAGE3_OUTPUT_DIR!;
 const fixture=JSON.parse(readFileSync(out+'/stage3-final-session.json','utf8'));
 assert.equal(fixture.session.report.directRank.checks.length,8);
 assert.equal(fixture.session.report.aiSampling.samples.length,6);
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const results=[];
 try{for(const width of [390,1280])for(const routeName of ['report','present']){
  const page=await browser.newPage({viewport:{width,height:844}});let runs=0;const errors:string[]=[];
  page.on('pageerror',(e:Error)=>errors.push(e.message));
  await page.route('**/*',async(route:any)=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();if(!u.pathname.startsWith('/api/'))return route.continue();if(u.pathname.endsWith('/run')){runs++;return route.abort();}return route.fulfill({json:u.pathname.startsWith('/api/sessions/')?fixture:{ok:true}});});
  await page.goto(`${base}/${routeName}/${fixture.session.id}`);
  const summary=page.getByTestId('assessment-summary');await summary.waitFor();
  const text=await summary.innerText();
  assert.match(text,/Geographic scope warning/);assert.match(text,/Los Angeles/);assert.match(text,/kivolaro.com/);assert.match(text,/Analyst-reviewed/);assert.doesNotMatch(text,/Human-reviewed/);
  assert.match(text,/Owner-confirmed absence of public reviews/);assert.match(text,/not validated recommendations/);
  for(const c of fixture.session.report.directRank.checks)assert(text.includes(c.query));
  assert.equal(await page.getByTestId('assessment-seo-overall').innerText(),'Overall assessment incomplete');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
  assert((await summary.boundingBox())!.y < (await page.getByTestId('seo-overview').boundingBox())!.y);
  await page.screenshot({path:out+`/final-${routeName}-${width}.png`,fullPage:true});
  await page.reload();await summary.waitFor();assert.equal(runs,0);assert.deepEqual(errors,[]);
  results.push({width,routeName,realCaptureCounts:[8,6],geoWarning:true,analystNotHuman:true,reopenCollectionCalls:runs,overflow:false});await page.close();
 }}finally{await browser.close();}
 assert.equal(results.length,4);writeFileSync(out+'/final-browser-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
