import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { permissionKey } from "../src/lib/sms-permission";
import { inquirySchema, saveInquiry, type InquiryStore } from "../src/lib/inquiries";
import { SMS_CONSENT_TEXT, SMS_CONSENT_VERSION, REVIEW_CONSENT_TEXT, REVIEW_CONSENT_VERSION, REVIEW_SUBJECTS } from "../src/lib/sms-consent";
async function main() {
  const objects = new Map<string, unknown>();
  const store: InquiryStore = {
    ensure: async () => undefined,
    get: async <T>(key: string) => (objects.get(key) as T | undefined) ?? null,
    put: async (key, value, upsert = false) => { if (objects.has(key) && !upsert) return false; objects.set(key, structuredClone(value)); return true; },
    remove: async key => { objects.delete(key); }, list: async () => [],
  };
  const base = { name: "Synthetic test", phone: "+12025550123", message: "Offline consent fixture", source: "consent" };
  for (const smsConsent of [false, true]) {
    const input = inquirySchema.parse({ ...base, submissionId: randomUUID(), smsConsent, consentVersion: SMS_CONSENT_VERSION });
    const saved = await saveInquiry(input, "fixture-ip", store);
    assert.equal(saved.consentVersion, SMS_CONSENT_VERSION, "store the disclosure actually presented");
    assert.equal((saved as unknown as {consentText: string}).consentText, SMS_CONSENT_TEXT);
    assert.equal(saved.smsConsent, smsConsent);
    assert.equal(saved.consentBrand, "247ROI LLC");
    assert.deepEqual(saved.consentSubjects, ["inquiry", "missed-call", "appointment", "service-update"]);
    assert.equal(saved.consentPhone, base.phone);
    assert.equal(saved.reviewConsent, false);
    assert.equal(saved.reviewConsentText, undefined);
    assert.deepEqual(await saveInquiry(input, "fixture-ip", store), saved);
  }
  const legacy = inquirySchema.parse({ ...base, submissionId: randomUUID(), smsConsent: true });
  assert.equal((await saveInquiry(legacy, "fixture-ip", store)).consentVersion, "contact-2026-10", "old clients must not gain broader permission");
  assert.equal(inquirySchema.safeParse({ ...legacy, consentVersion: "invented" }).success, false);
  assert.equal(inquirySchema.safeParse({...legacy, reviewConsent:true}).success,false);
  for (const smsConsent of [false,true]) for (const reviewConsent of [false,true]) {
    const input = inquirySchema.parse({...base, submissionId:randomUUID(),smsConsent,reviewConsent,consentVersion:SMS_CONSENT_VERSION,reviewConsentVersion:REVIEW_CONSENT_VERSION});
    const saved = await saveInquiry(input,`fixture-${smsConsent}-${reviewConsent}`,store);
    assert.equal(saved.smsConsent,smsConsent); assert.equal(saved.reviewConsent,reviewConsent);
    assert.equal(saved.reviewConsentVersion,REVIEW_CONSENT_VERSION); assert.equal(saved.reviewConsentText,REVIEW_CONSENT_TEXT);
    assert.equal(saved.reviewConsentPhone,base.phone); assert.equal(saved.reviewConsentBrand,"247ROI LLC");
    assert.deepEqual(saved.reviewConsentSubjects,REVIEW_SUBJECTS);
    assert(!saved.consentSubjects?.includes("service-review-request"));
    assert(!SMS_CONSENT_TEXT.includes("review requests"));
  }
  console.log("PASS new/declined consent persisted, retries stable, legacy scope retained, unknown version rejected; memory store only");
  const interrupted = inquirySchema.parse({...base,submissionId:randomUUID(),smsConsent:false,consentVersion:SMS_CONSENT_VERSION});
  const put = store.put;
  store.put = async (key,value,upsert) => { if (key === `submissions/${interrupted.submissionId}.json`) throw new Error("interrupted"); return put(key,value,upsert); };
  await assert.rejects(()=>saveInquiry(interrupted,"interrupted-ip",store),/interrupted/);
  assert(objects.has(`sms-permissions/${permissionKey(base.phone)}/${interrupted.submissionId}.json`),"an interrupted evidence write must leave a fail-closed index reference, not silently retain old permission");
}
main().catch(e => { console.error(e); process.exitCode = 1; });
