import assert from 'node:assert/strict';
import { probeSearchConsole, parseSearchConsole } from '../src/lib/audit/probes/search-console';
async function main(){
 const fetchOriginal=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;throw new Error('No fixture network');};
 try {
  for(const site of ['https://example.com','https://get247roi.com.evil.example','https://other.get247roi.com'])assert.equal((await probeSearchConsole(site)).state,'not_connected');
  assert.equal(calls,0,'No cross-property disclosure or fetch');
 }finally{globalThis.fetch=fetchOriginal;}
 const r=parseSearchConsole({siteUrl:'sc-domain:get247roi.com',startDate:'2026-08-22',endDate:'2026-09-19',clicks:0,impressions:128,queries:[],queryPages:[{keys:['operations coordinator','https://www.get247roi.com/services'],clicks:0,impressions:4,ctr:0,position:7.5},{keys:['small business','https://www.get247roi.com/'],clicks:0,impressions:70,ctr:0,position:71}]});
 assert.equal(r.state,'observed');assert.equal(r.queries.length,2);assert.equal(r.opportunities[0].query,'operations coordinator');assert(r.opportunities[0].rationale.includes('Small sample'));
 assert.equal(parseSearchConsole({siteUrl:'sc-domain:other.com',queries:[]}).state,'unavailable');
 console.log('PASS offline: property allowlist, no prospect leakage, recorded rows and conservative opportunity ordering.');
 if(process.argv.includes('--live')){const live=await probeSearchConsole('https://get247roi.com');assert.equal(live.state,'observed');assert(live.queries.length>0);console.log(JSON.stringify({source:live.source,property:live.property,window:[live.startDate,live.endDate],queries:live.queries.length,impressions:live.impressions,clicks:live.clicks,topReview:live.opportunities[0]?.query}));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
