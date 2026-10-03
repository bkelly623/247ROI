/* eslint-disable @typescript-eslint/no-explicit-any -- external browser acceptance harness */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from '../src/app/components/cta';
import { buildHireSmsHref } from '../src/lib/hire/progress';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/precision_focused_solutions/.hermes/hermes-agent/node_modules/playwright');
const base=process.env.SITE_BASE||'http://127.0.0.1:3617';
const out=process.env.QA_OUT||'/tmp/247roi-site-contact-qa';mkdirSync(out,{recursive:true});
async function main(){
 assert.equal(PRIMARY_PHONE_DISPLAY,'(610) 300-3001');assert.equal(PRIMARY_PHONE_HREF,'tel:+16103003001');
 assert.match(buildHireSmsHref({}),/^sms:\+16103003001\?body=/);
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const records:any[]=[];
 try{
  const context=await browser.newContext();
  const sitemap=await context.request.get(base+'/sitemap.xml');assert.equal(sitemap.status(),200);
  const paths=[...new Set([...((await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g))].map(m=>new URL(m[1]).pathname))];assert(paths.length>20);
  for(let i=0;i<paths.length;i+=5){
   await Promise.all(paths.slice(i,i+5).map(async path=>{
    const response=await context.request.get(base+path);const text=await response.text();
    const row={path,status:response.status(),final:response.url(),oldPhone:/917\D*572\D*7734|19175727734/.test(text),newPhone:text.includes(PRIMARY_PHONE_DISPLAY)||text.includes('+16103003001')};
    records.push(row);writeFileSync(out+'/routes.json',JSON.stringify(records,null,2));
    assert.equal(row.status,200,path);assert.equal(row.oldPhone,false,path+' stale contact');
   }));
  }
  assert.equal(records.length,paths.length);
  for(const width of [390,1280]){
   const ctx=await browser.newContext({viewport:{width,height:844}});const page=await ctx.newPage();const errors:string[]=[];
   page.on('pageerror',(e:any)=>errors.push(e.message));await page.route('**/api/events',(r:any)=>r.fulfill({json:{ok:true}}));
   for(const path of ['/','/contact','/privacy-policy','/terms-of-service']){
    await page.goto(base+path);await page.waitForLoadState('networkidle');
    const phones=await page.locator('a[href^="tel:"]').evaluateAll((els:any[])=>els.map(el=>({href:el.getAttribute('href'),text:el.textContent})));
    assert(phones.length>0,path);assert(phones.every((p:any)=>p.href===PRIMARY_PHONE_HREF),JSON.stringify(phones));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,path+' overflow');
    if(path==='/'){
     const schema=await page.locator('script[type="application/ld+json"]').allTextContents();assert(schema.join('').includes('+16103003001'));
     await page.screenshot({path:out+'/home-'+width+'.png'});await page.locator('footer a[href^="tel:"]').scrollIntoViewIfNeeded();await page.waitForFunction(()=>getComputedStyle(document.querySelector('footer a[href^="tel:"]')!.parentElement!).opacity==='1');await page.screenshot({path:out+'/footer-'+width+'.png'});
     await page.locator('footer a[href="/services"]').click();await page.waitForURL('**/services');await page.getByRole('heading',{level:1}).waitFor();assert.match(await page.locator('h1').innerText(),/Business systems built/);
    }
   }
   assert.deepEqual(errors,[]);await ctx.close();
  }
  console.log(JSON.stringify({result:'PASS',base,sitemapRoutes:records.length,routesWithNewContact:records.filter(r=>r.newPhone).length,stalePhones:records.filter(r=>r.oldPhone).length,browserWidths:[390,1280],artifacts:out}));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
