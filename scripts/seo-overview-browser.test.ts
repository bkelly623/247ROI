import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/precision_focused_solutions/.hermes/hermes-agent/node_modules/playwright');
const base=process.env.AUDIT_BASE ?? 'http://127.0.0.1:3203';
async function main(){
 const saved=JSON.parse(readFileSync(process.env.SEO_REPORT!,'utf8'));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const results=[];
 try{for(const width of [390,1280])for(const scenario of ['present','report','missing-score']){
  const fixture=structuredClone(saved);if(scenario==='missing-score'){fixture.session.report.auditMeta.dataSources.pageSpeed=false;fixture.session.report.auditMeta.apiErrors={pageSpeed:'Measurement timeout'};}
  const page=await browser.newPage({viewport:{width,height:844}});let runs=0;
  await page.route('**/*',async(route:any)=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();if(!u.pathname.startsWith('/api/'))return route.continue();
   if(u.pathname.endsWith('/run')){runs++;throw new Error('Saved report attempted collection');}
   if(u.pathname.startsWith('/api/sessions/'))return route.fulfill({json:fixture});
   return route.fulfill({json:{ok:true}});
  });
  await page.goto(`${base}/${scenario==='present'?'present':'report'}/${fixture.session.id}`);
  const headline=page.getByTestId('headline-seo-score');await headline.waitFor();
  assert.equal(await headline.innerText(),scenario==='missing-score'?'Not measured':'100');
  const seo=page.getByTestId('seo-overview');assert((await seo.innerText()).includes('6 fetched pages inspected'));
  assert((await seo.innerText()).includes('SEO improvement priorities'));
  assert((await seo.innerText()).includes('5 / 6 pages'));
  const seoY=await seo.evaluate((e:Element)=>e.getBoundingClientRect().top);
  const aiY=await page.getByText('AI visibility across buyer questions',{exact:true}).evaluate((e:Element)=>e.getBoundingClientRect().top);
  assert(seoY<aiY,'SEO must precede AI');
  await seo.locator('summary').click();assert((await seo.innerText()).includes('Canonical:'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
  assert.equal(runs,0);await page.reload();await headline.waitFor();assert.equal(runs,0);
  results.push({width,scenario,headline:await headline.innerText(),seoBeforeAI:true,overflow:false,runs});await page.close();
 }}finally{await browser.close();}
 writeFileSync(process.env.SEO_BROWSER_OUTPUT!,JSON.stringify(results,null,2));assert.equal(results.length,6);console.log(results);
}
main().catch(e=>{console.error(e);process.exitCode=1});
