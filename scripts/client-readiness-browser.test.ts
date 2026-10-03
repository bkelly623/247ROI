/* eslint-disable @typescript-eslint/no-explicit-any -- browser acceptance harness */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync,writeFileSync } from "node:fs";
const require=createRequire(import.meta.url);
const {chromium}=require('/home/precision_focused_solutions/.hermes/hermes-agent/node_modules/playwright');
const base=process.env.SITE_BASE||"http://127.0.0.1:3637";
const out=process.env.QA_OUT||"/tmp/247roi-client-ready-qa";mkdirSync(out,{recursive:true});
const forbidden=/target keyword|primary keyword:|search focus|247ROI should position|the article can use|first SEO\/use-case target|keyword and content target|plain buyer language|buyers should be able to inspect|ignore previous instructions|system prompt|TODO\(247ROI\)/i;
async function main(){
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});const records:any[]=[];
 try {
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.route('**/api/events',(r:any)=>r.fulfill({json:{ok:true}}));
  const sitemap=await context.request.get(base+'/sitemap.xml');assert.equal(sitemap.status(),200);
  const paths=[...new Set([...((await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g))].map(m=>new URL(m[1]).pathname))];
  const page=await context.newPage();const errors:string[]=[];page.on('pageerror',(e:any)=>errors.push(e.message));
  for(const path of paths){
   const response=await page.goto(base+path,{waitUntil:"domcontentloaded"});assert.equal(response?.status(),200,path);
   const text=await page.locator('body').innerText();
   const row={path,status:response.status(),editorialLeak:forbidden.test(text),oldPhone:/917\D*572\D*7734/.test(text)};
   records.push(row);writeFileSync(out+'/routes.json',JSON.stringify(records,null,2));
   assert(!row.editorialLeak,path+' editorial leak');assert(!row.oldPhone,path+' stale phone');
  }
  assert.equal(records.length,paths.length);assert(paths.includes('/missed-call-text-back'));assert(paths.includes('/articles/missed-call-text-back-vs-ai-receptionist'));
  for(const width of [360,390,768,1280]){
   await page.setViewportSize({width,height:900});
   for(const path of ['/','/services','/contact?offer=missed-call-text-back','/missed-call-text-back','/ai-employees/ai-receptionist','/demo']){
    await page.goto(base+path);await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,path+' horizontal overflow');
    if(path==='/' || path==='/services'){
     assert.equal(await page.locator('#service-paths article').count(),2);
     await page.locator('#service-paths').scrollIntoViewIfNeeded();
     assert(await page.locator('#service-paths').getByRole('heading',{name:'Lead capture & response'}).isVisible());
     assert(await page.locator('#service-paths').getByRole('heading',{name:'Custom software & AI'}).isVisible());
    }
    if(path==='/'){
     assert.equal(await page.locator('h1').innerText(),'Find the bottleneck worth fixing first. Then build the system that creates ROI.');
     await page.screenshot({path:out+`/lanes-${width}.png`});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:out+`/home-${width}.png`});
     await page.locator('footer').scrollIntoViewIfNeeded();await page.screenshot({path:out+`/footer-${width}.png`});
     const links=await page.locator('footer a[href^="/"]').evaluateAll((els:any[])=>els.map(el=>el.getAttribute('href')));
     for(const href of [...new Set(links)] as string[]){const res=await context.request.get(base+href,{maxRetries:2});assert.equal(res.status(),200,'footer '+href);assert.equal(new URL(res.url()).pathname,href,'footer redirect '+href);}
    }
    if(path==='/demo'){
     await page.getByRole('button',{name:'Prepare handoff',exact:true}).click();await page.getByRole('button',{name:'Approve next step',exact:true}).click();
     assert.equal(await page.getByTestId('metric-Ready').innerText(),'2');
     await page.getByRole('button',{name:'Reset sample'}).click();assert.equal(await page.getByTestId('metric-Ready').innerText(),'1');
     await page.locator('#workflow-demo').scrollIntoViewIfNeeded();await page.screenshot({path:out+`/demo-${width}.png`});
    }
    if(path.startsWith('/contact')) assert.equal(await page.locator('#contact-topic').inputValue(),'missed-call-text-back');
   }
  }
  // Exercise form failures and retry with an explicitly mocked API, no real alerts.
  await page.evaluate(()=>sessionStorage.removeItem('247roi_first_touch'));
  await page.goto(base+'/?utm_source=qa-source&utm_campaign=qa-campaign');
  await page.waitForFunction(()=>sessionStorage.getItem('247roi_first_touch')?.includes('qa-campaign'));
  await page.goto(base+'/contact?offer=dashboard');
  await page.locator('#contact-name').fill('Browser QA fixture');await page.locator('#contact-phone').fill('2025550123');await page.locator('#contact-message').fill('Browser test only, not a lead.');
  assert.equal(await page.locator('#contact-sms-consent').isChecked(),false);
  let calls=0;const ids:string[]=[];
  await page.route('**/api/contact',async(r:any)=>{calls++;const body=r.request().postDataJSON();ids.push(body.submissionId);assert.equal(body.topic,'dashboard');assert.equal(body.smsConsent,false);assert.equal(body.campaign,'qa-source / qa-campaign');await r.fulfill(calls===1?{status:503,json:{error:'Test storage unavailable'}}:{json:{ok:true,saved:true,reference:body.submissionId,notification:'queued'}});});
  await page.getByRole('button',{name:'Send message',exact:true}).click();await page.locator('form [role="alert"]').waitFor();assert.equal(await page.locator('#contact-message').inputValue(),'Browser test only, not a lead.');
  await page.getByRole('button',{name:'Send message',exact:true}).click();await page.getByRole('heading',{name:'Your message is saved.'}).waitFor();assert.equal(ids[0],ids[1]);
  const forbiddenPost=await context.request.post(base+'/api/ops/inquiries');assert.equal(forbiddenPost.status(),401);
  const unsigned=await context.request.post(base+'/api/voice/status',{form:{From:'+12025550123',DialCallStatus:'no-answer'}});assert.equal(unsigned.status(),403);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:'PASS',base,sitemapRoutes:records.length,widths:[360,390,768,1280],editorialLeaks:0,formFailureRecovery:true,interactiveDemo:true,artifacts:out}));
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
