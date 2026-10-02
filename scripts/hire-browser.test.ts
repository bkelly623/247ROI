/* eslint-disable @typescript-eslint/no-explicit-any -- external browser test harness */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/precision_focused_solutions/.hermes/hermes-agent/node_modules/playwright');
const base=process.env.AUDIT_BASE||'http://127.0.0.1:3597';
const out=process.env.QA_OUT||'/tmp/opportunity-qa';mkdirSync(out,{recursive:true});
const results:any[]=[];
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const ctx=await browser.newContext({viewport:{width,height:844},permissions:['clipboard-read','clipboard-write']});
   const page=await ctx.newPage();const errors:string[]=[];page.on('pageerror',(e:any)=>errors.push(e.message));
   await page.route('**/api/events', (r:any)=>r.fulfill({json:{ok:true}}));
   await page.goto(base+'/ai-opportunity-audit?step=opportunity&new=1');
   await page.getByRole('button',{name:'Home services / trades',exact:true}).waitFor();
   await page.waitForFunction(()=>{const el=document.querySelector('#hire-answer') as HTMLTextAreaElement|null;return Boolean(el&&!el.disabled);});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   const input=page.getByLabel('Your answer',{exact:true});const box=await input.boundingBox();assert(box&&box.y+box.height<844,'answer box in first viewport');
   await page.waitForFunction(()=>Math.abs(document.querySelector('nav')!.getBoundingClientRect().y)<1);
   await page.screenshot({path:`${out}/opening-${width}.png`,fullPage:true});
   async function send(text:string){await input.fill(text);await page.getByRole('button',{name:'Send answer',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('[role="status"]')?.textContent?.includes('Working on'));await page.waitForFunction(()=>{const el=document.querySelector('#hire-answer') as HTMLTextAreaElement|null;return Boolean(el&&!el.disabled);});}
   await send('Roofing');
   // Draft survives refresh and uses same session.
   const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('247roi:opportunity:v2:direct')||'{}').id);
   await input.fill('Following up on quotes');await page.reload();await page.getByText('Your saved conversation is back.',{exact:false}).waitFor();assert.equal(await input.inputValue(),'Following up on quotes');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('247roi:opportunity:v2:direct')||'{}').id),before);
   await send('Following up on quotes');
   // Response dropped AFTER the server commits: retry must not duplicate it.
   let intercepted=false;
   await page.route('**/api/hire/chat',async(r:any)=>{if(!intercepted){intercepted=true;await r.fetch();await r.abort();}else await r.continue();});
   const process='I open Excel then copy sent estimates then send follow-up emails.';
   await input.fill(process);await page.getByRole('button',{name:'Send answer',exact:true}).click();await page.getByRole('button',{name:'Retry answer',exact:true}).waitFor();assert.equal(await input.inputValue(),process);
   await page.getByRole('button',{name:'Retry answer',exact:true}).click();await page.waitForFunction(()=>{const el=document.querySelector('#hire-answer') as HTMLTextAreaElement|null;return Boolean(el&&!el.disabled);});
   await page.unroute('**/api/hire/chat');
   assert.equal(await page.getByRole('log').getByText(process,{exact:false}).count(),1,'replay does not duplicate user message');
   await send('10 hours/week');
   await input.fill('More time with family');await page.getByRole('button',{name:'Send answer',exact:true}).click();
   await page.getByRole('heading',{name:'Did we get this right?'}).waitFor();
   await page.getByLabel('Hours/week on this task (optional)').fill('8');
   await page.screenshot({path:`${out}/confirmation-${width}.png`,fullPage:true});
   await page.getByRole('button',{name:'That’s right — show my plan'}).click();await page.waitForURL(/\/ai-opportunity-audit\/[0-9a-f-]+$/);
   await page.getByRole('heading',{name:'Quote follow-up without the chasing'}).waitFor();
   assert.equal(await page.locator('input[type="tel"]').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   assert.match(await page.locator('.hire-report').innerText(),/5\.6–7\.2/);
   const reportUrl=page.url();await page.reload();await page.getByRole('heading',{name:'Quote follow-up without the chasing'}).waitFor();
   await page.getByRole('button',{name:'Copy saved link',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),reportUrl);
   assert.match(await page.getByRole('link',{name:'Email link',exact:true}).getAttribute('href'),/^mailto:\?/);
   let printed=false;await page.exposeFunction('qaPrint',()=>{printed=true;});await page.evaluate(()=>{window.print=()=>{(window as any).qaPrint();};});await page.getByRole('button',{name:'Print / Save PDF'}).click();assert(printed);
   await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);});await page.waitForFunction(()=>window.scrollY===0);
   await page.screenshot({path:`${out}/report-short-${width}.png`,fullPage:true});
   if(width===1280)await page.pdf({path:`${out}/short.pdf`,format:'A4',printBackground:true});
   await page.getByRole('button',{name:'Show full detail'}).click();await page.getByRole('heading',{name:'The practical details'}).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   await page.evaluate(()=>window.scrollTo(0,0));await page.waitForFunction(()=>window.scrollY===0);
   await page.screenshot({path:`${out}/report-full-${width}.png`,fullPage:true});if(width===1280)await page.pdf({path:`${out}/full.pdf`,format:'A4',printBackground:true});
   const data=await (await ctx.request.get(base+`/api/hire/${before}`)).json();assert.equal(data.session.discovery.pains[0].time.statedHoursPerWeek,8);assert.equal(data.session.messages.length,0);assert(!('phone' in data.session));
   await page.getByRole('link',{name:'Explore another workflow'}).click();await page.waitForFunction(()=>{const el=document.querySelector('#hire-answer') as HTMLTextAreaElement|null;return Boolean(el&&!el.disabled);});const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('247roi:opportunity:v2:direct')||'{}').id);assert.notEqual(after,before);
   assert.deepEqual(errors,[]);results.push({width,reportUrl,errors,passed:true});writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await ctx.close();
   console.log(`PASS ${width}: first-viewport input, five answers, refresh/draft, lost-response retry, editable confirmation, ungated report, saved reopen, links, print, full detail, new audit, no overflow/errors.`);
  }
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);writeFileSync(`${out}/failure.txt`,String(e));process.exitCode=1;});
