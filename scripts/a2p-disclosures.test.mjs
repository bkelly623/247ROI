import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const CONSENT_TEXT =
  "(Optional) I agree to receive SMS from 247ROI LLC at the phone number provided about my inquiry and related follow-up. Messages may be automated. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, HELP for help. Consent is not required to submit this form or purchase services. We will not sell or share mobile information with third parties for promotional or marketing purposes.";
const INTRO =
  "Use this form to contact 247ROI LLC. If you want text replies about your inquiry and related follow-up, check the optional SMS box. It starts unchecked, and you can submit without agreeing to texts.";
const PHONE_LINE = "For telephone inquiries, we may send an informational response about your call. Reply STOP to opt out.";
const OLD = "Calling us alone does not provide SMS consent.";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const contact = read("src/app/contact/page.tsx");
const consent = read("src/app/consent/page.tsx");
const privacy = read("src/app/privacy-policy/page.tsx");
const terms = read("src/app/terms-of-service/page.tsx");
const footer = read("src/components/Footer.tsx");
const form = read("src/components/contact/ContactForm.tsx");
const consentSource = read("src/lib/sms-consent.ts");

const between = (source, start, end) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `missing region ${start} .. ${end}`);
  return source.slice(from, to);
};

test("form has exactly one optional, initially unchecked SMS checkbox", () => {
  assert.equal(form.match(/type="checkbox"/g)?.length, 1);
  assert.match(form, /const \[smsConsent, setSmsConsent\] = useState\(false\)/);
  assert.match(form, /checked=\{smsConsent\}/);
  assert.equal(form.includes("defaultChecked"), false);
  const checkbox = form.slice(form.indexOf('id="contact-sms-consent"'), form.indexOf("/>", form.indexOf('id="contact-sms-consent"')));
  assert.doesNotMatch(checkbox, /\brequired\b/);
  assert.doesNotMatch(form, /reviewConsent|REVIEW_CONSENT/);
  assert.doesNotMatch(form, /!smsConsent|smsConsent\s*===\s*false/, "no client-side consent gate");
  assert.match(form, /\{SMS_CONSENT_TEXT\}/);
  assert.match(form, /href="\/terms-of-service"/);
  assert.match(form, /href="\/privacy-policy"/);
});

test("v3 disclosure text, version and inquiry-only scope; legacy versions retained", () => {
  assert.match(consentSource, /export const SMS_CONSENT_VERSION = "247roi-llc-inquiry-v3"/);
  assert.match(consentSource, /export const SMS_SUBJECTS = \["inquiry"\] as const/);
  assert.ok(consentSource.includes(`export const SMS_CONSENT_TEXT = ${JSON.stringify(CONSENT_TEXT)}`));
  assert.match(consentSource, /export const SERVICE_V2_CONSENT_VERSION = "247roi-llc-service-v2"/);
  assert.match(consentSource, /export const REVIEW_CONSENT_VERSION = "247roi-llc-review-v1"/);
});

test("consent intro is simplified and missed-call notices are removed from pages", () => {
  assert.ok(consent.includes(INTRO));
  for (const source of [footer, contact, consent, privacy, terms]) assert.doesNotMatch(source, /MissedCallNotice/);
  assert.match(contact, /Call \{PRIMARY_PHONE_DISPLAY\}/);
  assert.match(footer, /\{PRIMARY_PHONE_DISPLAY\}/);
  assert.match(contact, /mailto:brendan@get247roi.com/);
});

test("terms describe the optional web form inquiry program", () => {
  const region = between(terms, "1. Program Description:", "2. Cancellation Instructions:");
  assert.match(region, /optional website form inquiry confirmations and related inquiry follow-up/);
  assert.match(region, /href="\/contact"/);
  assert.match(region, /starts unchecked/);
  assert.match(region, /not a condition of submitting the form or purchasing services/);
  assert.match(region, /do not send promotional marketing/);
  assert.doesNotMatch(terms, /two paths|review request|version 2|carrier approval|not a promise that every automation/i);
  assert.match(terms, /Reply &quot;STOP&quot;/);
  assert.match(terms, /&quot;HELP&quot;/);
  assert.match(terms, /Carriers are not liable/);
  assert.match(terms, /Message and data rates may apply/);
  assert.match(terms, /Message frequency varies/);
  assert.match(terms, /18 years or older/);
  assert.match(terms, /privacy-policy/);
  assert.match(terms, /General Terms/);
  assert.match(terms, /contact our support team/);
});

test("privacy describes web form enrollment, records, and keeps the phone line separate", () => {
  const region = between(privacy, "3. SMS Messaging", "SMS Data Protection Statement");
  assert.match(region, /optional website form inquiry confirmations and related inquiry follow-up/);
  assert.match(region, /phone number, whether you checked the SMS box, the submission timestamp, and the disclosure version and text/);
  assert.equal(privacy.split(PHONE_LINE).length - 1, 1);
  const smsList = between(privacy, "3. SMS Messaging", PHONE_LINE);
  assert.ok(smsList.lastIndexOf("</div>") > smsList.indexOf("Carrier Disclaimer"), "phone line sits outside the web form program list");
  assert.doesNotMatch(privacy, /review scope|version 2|missed-call-only|not a promise that every automation/i);
  assert.match(privacy, /DOES NOT share customer opt-in information/);
  assert.match(privacy, /No mobile information will be shared with third parties\/affiliates/);
  assert.match(privacy, /SMS providers \(delivery only\)/);
  assert.match(privacy, /Reply HELP or contact/);
  assert.match(privacy, /mailto:brendan@get247roi.com/);
});

test("old call-consent contradiction is absent", () => {
  for (const source of [contact, consent, privacy, terms, footer, form]) assert.equal(source.includes(OLD), false);
  for (const source of [privacy, terms, consent]) assert.doesNotMatch(source, /any call is sufficient|calling constitutes consent|by calling you consent/i);
  for (const source of [privacy, terms]) {
    assert.doesNotMatch(source, /reply START to (enroll|opt|join|subscribe|restart)/i);
    assert.doesNotMatch(source, /text START to/i);
  }
});

test("canonical exports stay on the public pages", () => {
  assert.match(contact, /alternates: \{ canonical: "\/contact" \}/);
  assert.match(consent, /alternates: \{ canonical: "\/consent" \}/);
  assert.match(privacy, /alternates: \{ canonical: "\/privacy-policy" \}/);
  assert.match(terms, /alternates: \{ canonical: "\/terms-of-service" \}/);
});
