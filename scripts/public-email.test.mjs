import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join,relative} from 'node:path';
import test from 'node:test';
const root=process.cwd();
const expected='brendan@get247roi.com';
const visitorExamples=new Map([
 ['src/app/dashboard/page.tsx','your@email.com'],
 ['src/components/hire/HireGate.tsx','you@company.com'],
]);
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);}
test('public source/content contains only the authorized business email',()=>{
 const bad=[];
 for(const dir of ['src','public','content']) for(const file of walk(join(root,dir))){
  if(!/\.(tsx?|jsx?|json|md|txt|html|svg)$/i.test(file))continue;
  const text=readFileSync(file,'utf8');
  for(const match of text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)){
   if(match[0]!==expected && visitorExamples.get(relative(root,file))!==match[0])bad.push({file:relative(root,file),email:match[0]});
  }
 }
 assert.deepEqual(bad,[]);
});
test('both shared email buttons have matching label and destination',()=>{
 for(const f of ['src/components/CTA.tsx','src/components/HomeSetupCallSection.tsx']){
  const text=readFileSync(join(root,f),'utf8');
  assert(text.includes(`href="mailto:${expected}"`));
  assert.equal(text.split(expected).length-1,2);
 }
});
test('chat instructions/fallback and audit report contact use authorized email',()=>{
 const chat=readFileSync(join(root,'src/app/api/chat/route.ts'),'utf8');
 assert.equal(chat.split(expected).length-1,2);
 assert(readFileSync(join(root,'src/lib/audit/config.ts'),'utf8').includes(`email: "${expected}"`));
});
