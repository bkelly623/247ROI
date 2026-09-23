/* eslint-disable @typescript-eslint/no-explicit-any -- external Playwright harness */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/precision_focused_solutions/.hermes/hermes-agent/node_modules/playwright');
const base=process.env.AUDIT_BASE ?? 'http://127.0.0.1:3397';
const out=process.env.STAGE4_OUTPUT_DIR ?? '/tmp/247roi-visual-qa';
async function main(){
 mkdirSync(out,{recursive:true});
 const original=JSON.parse(readFileSync('/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/website-ops/audit-sales-stage3/stage3-final-session.json','utf8')).session;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const results=[];
 try {for(const width of [390,1280])for(const routeName of ['report','present']){
  const page=await browser.newPage({viewport:{width,height:900}});let runs=0;const errors:string[]=[];
  await page.addInitScript('window.__name=(fn)=>fn');
  page.on('pageerror',(e:Error)=>errors.push(e.message));
  await page.route('**/*',async(route:any)=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();if(!u.pathname.startsWith('/api/'))return route.continue();if(u.pathname.endsWith('/run')){runs++;return route.abort();}if(u.pathname.startsWith('/api/sessions/'))return route.fulfill({json:{session:original}});return route.fulfill({json:{ok:true}});});
  await page.goto(`${base}/${routeName}/${original.id}`);await page.getByTestId('report-summary').waitFor();
  assert.equal(await page.getByTestId('report-full-details').count(),0);
  assert.equal(await page.locator('.brief-opportunity').count(),3);
  assert.equal(await page.getByTestId('report-seo-card-value').innerText(),'0 / 8 searches');
  assert.equal(await page.getByTestId('report-ai-card-value').innerText(),'0 / 6 answers');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
  assert.equal(await page.getByTestId('consultation-link').getAttribute('href'),`/ai-opportunity-audit?visibility=${original.id}`);
  for(const mode of ['short','full']){
   if(mode==='full'){await page.getByTestId('full-report-link').click();await page.getByTestId('report-full-details').waitFor();assert.equal(await page.getByTestId('report-summary').count(),0);await page.getByTestId('assessment-summary').waitFor();}
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(t:string)=>{(window as any).__copied=t;}}}));
   await page.getByTestId('copy-report-link').click();assert.equal(await page.evaluate(()=>(window as any).__copied),`${base}/report/${original.id}${mode==='full'?'?view=full':''}`);
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}}));
   await page.getByTestId('copy-report-link').click();assert.equal(await page.getByTestId('copy-fallback-input').inputValue(),`${base}/report/${original.id}${mode==='full'?'?view=full':''}`);
   await page.evaluate(()=>{(window as any).__printed=0;window.print=()=>{(window as any).__printed++;};});await page.getByTestId('print-report').click();assert.equal(await page.evaluate(()=>(window as any).__printed),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);});
   await page.screenshot({path:`${out}/${routeName}-${mode}-${width}.png`,fullPage:true});
   if(width===1280 && routeName==='report'){await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await page.pdf({path:`${out}/${mode}.pdf`,format:'A4',printBackground:true,margin:{top:'10mm',bottom:'10mm',left:'10mm',right:'10mm'}});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));}
   await page.reload();await page.getByTestId(mode==='full'?'report-full-details':'report-summary').waitFor();
  }
  await page.getByTestId('short-report-link').click();await page.getByTestId('report-summary').waitFor();
  assert.equal(runs,0);assert.deepEqual(errors,[]);results.push({width,routeName,copy:true,fallback:true,print:true,reopen:true,runs,errors});await page.close();
 }
 // Legacy and empty evidence remain honest, without invented targets.
 for(const kind of ['legacy','empty']){const session=structuredClone(original);delete session.report.assessment;delete session.report.directRank;if(kind==='empty'){delete session.report.aiSampling;delete session.report.siteReview;delete session.report.chatGPT;delete session.report.googleAIMode;}
 const page=await browser.newPage({viewport:{width:390,height:844}});await page.route('**/api/**',(route:any)=>route.fulfill({json:{session}}));await page.goto(`${base}/report/${session.id}`);await page.getByTestId('report-summary').waitFor();assert.equal(await page.getByTestId('report-seo-card-value').innerText(),'Not measured');assert.equal(await page.locator('.brief-opportunity').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.screenshot({path:`${out}/${kind}-390.png`,fullPage:true});await page.close();}
 }finally{await browser.close();}
 writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log('PASS',JSON.stringify(results));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
