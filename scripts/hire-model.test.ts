import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {runHireChatTurn} from '../src/lib/hire/openai';
import {emptyDiscovery,type HireMessage} from '../src/lib/hire/types';
import {buildHireEstimate} from '../src/lib/hire/estimates';
const out='/tmp/opportunity-model-qa';mkdirSync(out,{recursive:true});
async function main(){
 if(!process.env.OPENAI_API_KEY)throw new Error('A configured provider key is required for live-model acceptance.');
 const realFetch=globalThis.fetch;let rawIndex=0;
 globalThis.fetch=async(...args)=>{const res=await realFetch(...args);if(String(args[0]).includes('api.openai.com'))writeFileSync(`${out}/provider-${++rawIndex}.json`,await res.clone().text());return res;};
 const scenarios=[
  {name:'short-answers',answers:['Roofing','Following up on quotes','I open Excel then copy sent estimates then email customers to chase replies.','5 hours/week','More time with family'],expectedHours:5},
  {name:'rich-roofing',answers:['I own a roofing company. I open Excel, copy sent estimates into it, then email customers to chase replies. That follow-up takes me 10 hours per week. I want evenings back with my family.','That is right. Show my plan.'],expectedHours:10},
  {name:'unknown-hours',answers:['I run an accounting practice. I read invoices in Outlook then copy fields to Excel, then our accountant checks them. I do not know how many hours it takes. I want fewer errors, not a replacement for our accountant.','I do not know the hours. Please keep that unknown and show the recommendation.'],expectedHours:null},
  {name:'human-judgment',answers:['I run a dental clinic. The bottleneck is diagnosing patients. I examine each patient, review their X-rays and choose their treatment. I want AI to make the final treatment decisions.','Keep the clinical decisions human. Help me prepare a checklist instead.'],expectedHours:null},
 ];
 for(const s of scenarios){
  let discovery=emptyDiscovery();const messages:HireMessage[]=[];const turns=[];
  for(const answer of s.answers){messages.push({role:'user',content:answer});const started=Date.now();const turn=await runHireChatTurn({messages,discovery});turns.push({...turn,elapsedMs:Date.now()-started});discovery=turn.discovery!;messages.push({role:'assistant',content:turn.reply});writeFileSync(`${out}/${s.name}.json`,JSON.stringify({messages,turns},null,2));assert.equal(turn.mode,'ai','Live provider must respond; fallback is not live-model acceptance.');if(turn.readyForGate)break;}
  const estimate=buildHireEstimate(discovery);assert.equal(estimate.taskHours,s.expectedHours);if(s.name==='human-judgment'){assert.equal(estimate.weekly,null);assert.equal(discovery.pains[0]?.automatable,false);}assert(turns.at(-1)?.readyForGate,'bounded rich-input scenario should be ready');console.log('PASS live model',s.name,turns.length,'turns',turns.map(t=>t.elapsedMs));
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
