/* eslint-disable @typescript-eslint/no-explicit-any -- external Playwright harness */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { emptyDiscovery } from '../src/lib/hire/types';
const require = createRequire(import.meta.url);
const { chromium } = require('/home/precision_focused_solutions/.hermes/hermes-agent/node_modules/playwright');
const base = process.env.AUDIT_BASE ?? 'http://127.0.0.1:3189';
async function main() {
 const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
  for (const width of [390,1280]) {
   const page = await browser.newPage({viewport:{width,height:900}});
   let chatStarts=0, scans=0;
   await page.route('**/*', async (route:any) => {
    const req=route.request(), url=new URL(req.url());
    if(url.origin!==base) return route.abort();
    if(url.pathname.startsWith('/present/')) return route.fulfill({contentType:'text/html',body:'<h1>Visibility handoff</h1>'});
    if(!url.pathname.startsWith('/api/')) return route.continue();
    if(url.pathname==='/api/hire/session') { chatStarts++;return route.fulfill({json:{sessionId:'qa-opportunity',opening:'Describe the workflow.',discovery:emptyDiscovery()}}); }
    if(url.pathname==='/api/sessions') { scans++;assert.deepEqual(req.postDataJSON(),{businessName:'QA Consultancy',websiteUrl:'https://example.com',zipCode:'27401',geography:'national'});return route.fulfill({json:{session:{id:'qa-visibility'}}}); }
    return route.fulfill({json:{ok:true}});
   });
   await page.goto(base+'/ai-opportunity-audit');
   await page.getByLabel('Website',{exact:true}).waitFor();
   assert.equal(await page.locator('textarea').count(),0);
   assert.equal(chatStarts,0,'no chat session before choosing skip');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   await page.getByRole('button',{name:'Skip website — explore operations',exact:true}).click();
   await page.locator('textarea').waitFor();
   await page.getByText('Describe the workflow.',{exact:true}).waitFor();
   assert.equal(scans,0,'skip never starts website scan');
   await page.reload(); await page.locator('textarea').waitFor();
   await page.goto(base+'/ai-opportunity-audit?visibility=qa-visibility');
   await page.locator('textarea').waitFor();
   assert.equal(await page.getByLabel('Website',{exact:true}).count(),0,'report return does not loop to intake');
   await page.goto(base+'/ai-opportunity-audit');
   await page.getByLabel('Website',{exact:true}).fill('example.com');
   await page.getByLabel('Business name',{exact:true}).fill('QA Consultancy');
   await page.getByLabel('ZIP code',{exact:true}).fill('27401');
   await page.getByLabel('Where do you serve customers?').selectOption('national');
   await page.getByRole('button',{name:'Check website visibility',exact:true}).click();
   await page.waitForURL('**/present/qa-visibility');
   assert.equal(scans,1);
   await page.close();
   console.log(`PASS ${width}: visibility first, optional skip to original chat, skip refresh, report return, scan submission/handoff. Offline API fixtures.`);
  }
 } finally {await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
