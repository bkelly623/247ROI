import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { permissionKey, indexSmsPermission } from "../src/lib/sms-permission";
import { inquirySchema, saveInquiry, type InquiryStore, type SavedInquiry } from "../src/lib/inquiries";
import { SMS_CONSENT_TEXT, SMS_CONSENT_VERSION, SERVICE_V2_CONSENT_TEXT, SERVICE_V2_CONSENT_VERSION, REVIEW_CONSENT_TEXT, REVIEW_CONSENT_VERSION, REVIEW_SUBJECTS } from "../src/lib/sms-consent";
async function main() {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (() => { throw new Error("network access is forbidden in offline consent tests"); }) as typeof fetch;
  const objects = new Map<string, unknown>();
  const store: InquiryStore = {
    ensure: async () => undefined,
    get: async <T>(key: string) => (objects.get(key) as T | undefined) ?? null,
    put: async (key, value, upsert = false) => { if (objects.has(key) && !upsert) return false; objects.set(key, structuredClone(value)); return true; },
    remove: async key => { objects.delete(key); }, list: async () => [],
  };
  const base = { name: "Synthetic test", phone: "+12025550123", message: "Offline consent fixture", source: "consent" };
  const index = (id: string) => `sms-permissions/${permissionKey(base.phone)}/${id}.json`;

  assert.equal(SMS_CONSENT_VERSION, "247roi-llc-inquiry-v3");
  // Current single-checkbox payload: no review fields, consent optional.
  for (const smsConsent of [false, true]) {
    const input = inquirySchema.parse({ ...base, submissionId: randomUUID(), smsConsent, consentVersion: SMS_CONSENT_VERSION });
    const saved = await saveInquiry(input, `v3-${smsConsent}`, store);
    assert.equal(saved.consentVersion, SMS_CONSENT_VERSION, "store the disclosure actually presented");
    assert.equal(saved.consentText, SMS_CONSENT_TEXT);
    assert.equal(saved.smsConsent, smsConsent);
    assert.equal(saved.consentBrand, "247ROI LLC");
    assert.deepEqual(saved.consentSubjects, ["inquiry"], "v3 scope is inquiry only");
    assert.equal(saved.consentPhone, base.phone);
    assert.equal(saved.reviewConsent, false);
    assert.equal(saved.reviewConsentText, undefined);
    assert.equal(saved.reviewConsentVersion, undefined);
    assert(objects.has(index(input.submissionId)), "v3 choice is indexed for the permission consumer");
    assert.deepEqual(await saveInquiry(input, `v3-${smsConsent}`, store), saved, "retry returns the identical record");
    assert.equal([...objects.keys()].filter(k => k.startsWith("submissions/") && k.includes(input.submissionId)).length, 1);
  }

  // Previously accepted v2 submissions keep their original text and scope.
  for (const smsConsent of [false, true]) {
    const input = inquirySchema.parse({ ...base, submissionId: randomUUID(), smsConsent, consentVersion: SERVICE_V2_CONSENT_VERSION });
    const saved = await saveInquiry(input, `v2-${smsConsent}`, store);
    assert.equal(saved.consentVersion, SERVICE_V2_CONSENT_VERSION, "never relabel v2 to v3");
    assert.equal(saved.consentText, SERVICE_V2_CONSENT_TEXT);
    assert.deepEqual(saved.consentSubjects, ["inquiry", "missed-call", "appointment", "service-update"]);
    assert.deepEqual(await saveInquiry(input, `v2-${smsConsent}`, store), saved);
  }
  // A v2 record already in storage (written before this change) is returned unchanged on retry.
  const oldId = randomUUID();
  const oldInput = inquirySchema.parse({ ...base, submissionId: oldId, smsConsent: true, consentVersion: SERVICE_V2_CONSENT_VERSION });
  const firstOld = await saveInquiry(oldInput, "old", store);
  const storedOld = structuredClone(objects.get(`submissions/${oldId}.json`)) as SavedInquiry;
  await indexSmsPermission(storedOld, store);
  assert.deepEqual(objects.get(`submissions/${oldId}.json`), storedOld);
  assert.deepEqual(firstOld.consentSubjects, ["inquiry", "missed-call", "appointment", "service-update"]);
  assert.notEqual(firstOld.consentText, SMS_CONSENT_TEXT);

  const legacy = inquirySchema.parse({ ...base, submissionId: randomUUID(), smsConsent: true });
  assert.equal((await saveInquiry(legacy, "fixture-ip", store)).consentVersion, "contact-2026-10", "old clients must not gain broader permission");
  assert.equal(inquirySchema.safeParse({ ...legacy, consentVersion: "invented" }).success, false, "unknown version denied");
  assert.equal(inquirySchema.safeParse({ ...legacy, consentVersion: "247roi-llc-inquiry-v4" }).success, false, "unknown version denied");
  assert.equal(inquirySchema.safeParse({ ...legacy, reviewConsent: true }).success, false);

  // Legacy review backend support retained for older clients.
  for (const smsConsent of [false, true]) for (const reviewConsent of [false, true]) {
    const input = inquirySchema.parse({ ...base, submissionId: randomUUID(), smsConsent, reviewConsent, consentVersion: SERVICE_V2_CONSENT_VERSION, reviewConsentVersion: REVIEW_CONSENT_VERSION });
    const saved = await saveInquiry(input, `fixture-${smsConsent}-${reviewConsent}`, store);
    assert.equal(saved.smsConsent, smsConsent); assert.equal(saved.reviewConsent, reviewConsent);
    assert.equal(saved.reviewConsentVersion, REVIEW_CONSENT_VERSION); assert.equal(saved.reviewConsentText, REVIEW_CONSENT_TEXT);
    assert.equal(saved.reviewConsentPhone, base.phone); assert.equal(saved.reviewConsentBrand, "247ROI LLC");
    assert.deepEqual(saved.reviewConsentSubjects, REVIEW_SUBJECTS);
    assert(!saved.consentSubjects?.includes("service-review-request"));
  }
  assert(!SMS_CONSENT_TEXT.includes("review"));
  console.log("PASS v3 inquiry-only scope saved, no-consent accepted, v2 original scope retained, legacy review kept, unknown versions denied, retries stable; memory store only");
  const interrupted = inquirySchema.parse({ ...base, submissionId: randomUUID(), smsConsent: false, consentVersion: SMS_CONSENT_VERSION });
  const put = store.put;
  store.put = async (key, value, upsert) => { if (key === `submissions/${interrupted.submissionId}.json`) throw new Error("interrupted"); return put(key, value, upsert); };
  await assert.rejects(() => saveInquiry(interrupted, "interrupted-ip", store), /interrupted/);
  assert(objects.has(index(interrupted.submissionId)), "an interrupted evidence write must leave a fail-closed index reference, not silently retain old permission");
  globalThis.fetch = realFetch;
}
main().catch(e => { console.error(e); process.exitCode = 1; });
