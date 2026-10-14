/* eslint-disable @typescript-eslint/no-explicit-any -- browser test */
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {mkdirSync,writeFileSync,readFileSync} from "node:fs";
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.SITE_BASE||'http://127.0.0.1:3657';
const out='/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/outcome-first-live-qa';mkdirSync(out,{recursive:true});
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const rows:any[]=[];const errors:string[]=[];
 try{
  const context=await browser.newContext();await context.route('**/api/events', (r:any)=>r.fulfill({json:{ok:true}}));
  const page=await context.newPage();page.on('pageerror',(e:any)=>errors.push(e.message));
  let sideEffects=0;await context.route('**/api/contact',(r:any)=>{sideEffects++;return r.abort();});
  for(const width of [360,390,768,1280]){
   await page.setViewportSize({width,height:900});
   assert.equal((await page.goto(base))?.status(),200);await page.waitForTimeout(800);
   await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,'horizontal overflow');
   assert.equal(await page.locator('h1').count(),1);
   assert((await page.locator('h1').innerText()).includes('Respond faster.'));
   assert.equal(await page.locator('#solutions article').count(),4);
   assert(await page.locator('#custom-software').getByRole('heading',{name:'When your business needs more than a standard setup.'}).count());
   const demo=page.getByTestId('lead-journey');
   for(const name of ['Missed call','New inquiry','AI receptionist','Booking & reminders','Review requests']){
    await demo.getByRole('button',{name,exact:true}).click();
    assert(await demo.getByText('Step 1 of 4',{exact:true}).isVisible());
    for(let step=2;step<=4;step++){await demo.getByRole('button',{name:'Next step'}).click();assert(await demo.getByText(`Step ${step} of 4`,{exact:true}).isVisible());}
    assert(await demo.getByRole('button',{name:'Next step'}).isDisabled());
    await demo.getByRole('button',{name:'Restart example'}).click();
    assert(await demo.getByText('Step 1 of 4',{exact:true}).isVisible());
    rows.push({width,example:name,steps:4,reset:true});writeFileSync(out+'/checks.json',JSON.stringify(rows,null,2));
   }
   assert((await demo.innerText()).includes('not a live GHL demonstration'));
   if(width<1024){
    await page.getByRole('button',{name:'Open menu'}).click();
    await page.getByRole('link',{name:'Custom software & AI',exact:true}).click();
    await page.getByRole('button',{name:'Close menu'}).waitFor({state:'hidden'});
    assert.equal(new URL(page.url()).hash,'#custom-software');
   }
   await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(200);
   await page.screenshot({path:out+`/home-${width}.png`});
   if(width===390||width===1280){await page.screenshot({path:out+`/full-${width}.png`,fullPage:true});await page.locator('#solutions').scrollIntoViewIfNeeded();await page.screenshot({path:out+`/offers-${width}.png`});}
  }
  // Test every distinct observed local link; keep exact original destinations.
  await page.goto(base);const hrefs=await page.locator('main a, nav a').evaluateAll((els:any[])=>[...new Set(els.map(el=>el.getAttribute('href')))].filter((h:any)=>typeof h==='string'&&h.startsWith('/')));
  for(const href of hrefs){const res=await context.request.get(base+href);assert.equal(res.status(),200,href);}
  const collected=JSON.parse(readFileSync(out+'/checks.json','utf8'));assert.equal(collected.length,20);
  assert.deepEqual(errors,[]);assert.equal(sideEffects,0);
  console.log(JSON.stringify({result:'PASS',exampleChecks:collected.length,widths:[360,390,768,1280],distinctLinks:hrefs.length,sideEffects,artifacts:out}));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
