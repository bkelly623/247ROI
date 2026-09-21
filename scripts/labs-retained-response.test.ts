import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseDomainResearchResponse,probeDomainResearch} from '../src/lib/audit/probes/domain-research';
async function main(){
 if(process.env.LABS_ARCHIVES){
  const captures=JSON.parse(readFileSync(process.env.LABS_ARCHIVES,'utf8')) as {request_key:string;raw_text:string;raw_sha256:string}[];
  for(const c of captures){
   assert.equal(createHash('sha256').update(c.raw_text).digest('hex'),c.raw_sha256);
   const kind=c.request_key.includes(':competitors_domain:')?'competitors_domain':'ranked_keywords';
   assert.equal(parseDomainResearchResponse({target:'get247roi.com'},kind,c.raw_text).state,'no_data');
  }
  console.log('PASS both real production archived response shapes and immutable hashes');
 }
 const raw=readFileSync(process.env.LABS_CAPTURE!,'utf8');
 const parsed=parseDomainResearchResponse({target:'get247roi.com'},'ranked_keywords',raw);
 assert.equal(parsed.state,'no_data');assert.equal(parsed.totalDatabaseItems,null);
 assert.equal(parsed.receipt?.rawSha256,createHash('sha256').update(raw).digest('hex'));
 assert.equal(parsed.estimatedMonthlyTraffic,null);
 console.log('PASS real retained provider response: valid empty coverage, unknown total preserved, exact raw hash');
 let captured=0;
 const result=await probeDomainResearch({target:'get247roi.com'},{credentials:{authBase64:Buffer.from('synthetic:credentials').toString('base64')},quote:{rankedKeywordsMaxCostMicros:14400,competitorsMaxCostMicros:12360,pricingUrl:'https://dataforseo.com/pricing/dataforseo-labs/dataforseo-google-api',verifiedAt:new Date().toISOString()},authorize:async()=>true,fetcher:async()=>new Response(raw),captureResponse:async()=>{captured++;throw new Error('archive unavailable')}});
 assert.equal(captured,1);assert.equal(result.rankedKeywords.state,'unavailable');assert.equal(result.relatedCompetitors.state,'unavailable');
 console.log('PASS private archive failure halts before parsing or second send');
}
main().catch(e=>{console.error(e);process.exitCode=1});
