import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {POST} from '../src/app/api/hire/session/route';
import {createSession,updateSession} from '../src/lib/audit/sessions';
import {getHireSession} from '../src/lib/hire/sessions';
import {validVisibilityId} from '../src/lib/hire/visibility-handoff';
async function main(){
 for(const k of ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_URL']) delete process.env[k];
 globalThis.fetch=async()=>{throw new Error('Network forbidden in local handoff test');};
 const fixture=JSON.parse(readFileSync('/home/precision_focused_solutions/.hermes/profiles/robotrevolution/workspace/website-ops/audit-sales-stage3/stage3-final-session.json','utf8')).session;
 const scan=await createSession({businessName:fixture.business_name,websiteUrl:fixture.website_url,zipCode:fixture.zip_code,mode:'organic'});
 await updateSession(scan.id,{report:fixture.report,status:'complete'});
 for(const id of [scan.id,'not-a-uuid','00000000-0000-0000-0000-000000000000',undefined]){
  const res=await POST(new Request('http://localhost/api/hire/session',{method:'POST',body:JSON.stringify({source:'qa',visibilitySessionId:id})}));assert.equal(res.status,200);const body=await res.json();
  const saved=await getHireSession(body.sessionId);assert(saved);
  if(id===scan.id){assert.equal(body.visibilityContextAttached,true);assert.equal(saved.discovery.businessName,fixture.business_name);assert(saved.discovery.notes.some(n=>n.includes('/report/'+scan.id)));assert.match(body.opening,/findings are attached/);assert.deepEqual(body.discovery,saved.discovery);}
  else assert.equal(body.visibilityContextAttached,false);
 }
 assert(!validVisibilityId('https://evil.example'));assert(!validVisibilityId('../../secrets'));
 console.log('PASS real local session-route/storage readback: report context attached, ordinary entry preserved, invalid/missing reference safe; zero network.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
