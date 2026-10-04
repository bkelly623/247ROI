import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { inquirySchema, saveInquiry, notifyInquiry, contactAdminAuthorized, type InquiryStore, type SavedInquiry } from "../src/lib/inquiries";
import { POST as contactPost } from "../src/app/api/contact/route";
import { POST as voicePost } from "../src/app/api/voice/inbound/route";
import { POST as statusPost } from "../src/app/api/voice/status/route";
import { POST as smsPost } from "../src/app/api/sms/inbound/route";
import { validTwilioSignature } from "../src/lib/twilio-signature";

function memoryStore() {
  const objects = new Map<string, unknown>();
  const store: InquiryStore = {
    ensure: async () => undefined,
    get: async <T>(key: string) => (objects.get(key) as T | undefined) ?? null,
    put: async (key, value, upsert=false) => { if (objects.has(key) && !upsert) return false; objects.set(key, structuredClone(value)); return true; },
    remove: async key => { objects.delete(key); },
    list: async () => [],
  };
  return { objects, store };
}
async function main() {
  process.env.CONTACT_ADMIN_SECRET = "test-secret-only";
  process.env.CONTACT_TELEGRAM_BOT_TOKEN = "test-token-only";
  process.env.CONTACT_TELEGRAM_CHAT_ID = "test-chat-only";
  const input = inquirySchema.parse({ submissionId: randomUUID(), name: "QA fixture", phone: "+12025550123", email: "qa@example.com", message: "Test fixture only, not a customer inquiry.", smsConsent: false, topic: "custom-software" });
  assert.equal(inquirySchema.safeParse({...input,phone:"1234567"}).success,false);
  assert.equal(inquirySchema.safeParse({...input,email:"invalid"}).success,false);
  assert.equal(inquirySchema.safeParse({...input,message:"x".repeat(1801)}).success,false);
  const {store,objects} = memoryStore();
  const saved = await saveInquiry(input,"qa-ip",store);
  assert.equal(saved.message,input.message);assert.equal(saved.smsConsent,false);
  assert.equal((await store.get<SavedInquiry>(`submissions/${input.submissionId}.json`))?.message,input.message);
  assert.deepEqual(await saveInquiry(input,"qa-ip",store),saved);
  assert.equal([...objects.keys()].filter(k=>k.startsWith("submissions/")).length,1);
  await assert.rejects(()=>saveInquiry({...input,message:"Changed message content"},"qa-ip",store),/idempotency_conflict/);
  await assert.rejects(()=>saveInquiry({...input,submissionId:randomUUID()},"qa-ip",{...store,ensure:async()=>{throw new Error("store down");}}),/store down/);
  let sends=0;
  const send: typeof fetch = async (_url, init) => { sends++;const body=JSON.parse(String(init?.body));assert(body.text.includes(input.message));assert(body.text.includes("No — do not text"));return Response.json({ok:true,result:{message_id:101}}); };
  assert.equal(await notifyInquiry(saved,store,async()=>{throw new Error("provider unavailable");}),false);
  assert(objects.has(`submissions/${input.submissionId}.json`));assert(!objects.has(`receipts/${input.submissionId}.json`));
  assert.equal(await notifyInquiry(saved,store,send),true);
  assert.equal(await notifyInquiry(saved,store,send),true);assert.equal(sends,1);
  assert(objects.has(`receipts/${input.submissionId}.json`));
  for(let i=0;i<5;i++) await saveInquiry({...input,submissionId:randomUUID()},"qa-ip",store);
  await assert.rejects(()=>saveInquiry({...input,submissionId:randomUUID()},"qa-ip",store),/rate_limited/);
  assert(contactAdminAuthorized("Bearer test-secret-only"));assert(!contactAdminAuthorized("Bearer wrong"));assert(!contactAdminAuthorized(null));
  const req=(data:unknown,origin="http://localhost:3637")=>new NextRequest("http://localhost:3637/api/contact",{method:"POST",headers:{host:"localhost:3637",origin,"content-type":"application/json"},body:JSON.stringify(data)});
  assert.equal((await contactPost(req(input,"https://attacker.example"))).status,403);
  assert.equal((await contactPost(req({...input,website:"bot"}))).status,400);
  assert.equal((await contactPost(req({...input,phone:"bad"}))).status,400);
  assert.equal((await contactPost(req({...input,message:"x".repeat(15000)}))).status,413);
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.equal((await contactPost(req(input))).status,503,"no false success without durable storage");
  process.env.TWILIO_AUTH_TOKEN="fixture-twilio-token";
  process.env.FORWARD_PHONE_NUMBER="+12025550123";
  const form=new URLSearchParams({From:"+12025550124",To:"+16103003001",DialCallStatus:"completed"});
  for(const [path,post] of [["/api/voice/inbound",voicePost],["/api/voice/status",statusPost],["/api/sms/inbound",smsPost]] as const){
    const raw = new NextRequest("http://localhost:3637"+path,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:form.toString()});assert.equal((await post(raw)).status,403);
    let value="https://www.get247roi.com"+path;for(const key of [...form.keys()].sort())value+=key+form.get(key);
    const signature=createHmac("sha1","fixture-twilio-token").update(value).digest("base64");
    const signed = new NextRequest("http://localhost:3637"+path,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded","x-twilio-signature":signature},body:form.toString()});
    assert(validTwilioSignature(signed,await signed.clone().formData()));
    // Voice now requires a real CallSid and durable call state; this legacy
    // auth-only fixture intentionally has no CallSid. SMS still returns TwiML.
    assert.equal((await post(signed)).status,path.startsWith("/api/voice/") ? 400 : 200);
  }
  console.log("PASS: durable save/readback, idempotency, failed notification retention/retry, notification dedupe, rate limiting, optional consent, input/origin/size guards, fail-closed storage, admin auth and signed/unsigned Twilio callbacks. Provider and storage fixtures only; no SMS sent.");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
