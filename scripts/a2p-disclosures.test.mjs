import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const NOTICE =
  "If you call 247ROI LLC and we miss your call, you may receive one automated text acknowledging your inquiry. If you do not reply, no further inquiry texts are sent from that call. Calling does not enroll you in ongoing service updates, review requests, or marketing. Reply STOP to opt out, HELP for help. Msg & data rates may apply.";
const OLD = "Calling us alone does not provide SMS consent.";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const notice = read("src/components/contact/MissedCallNotice.tsx");
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

test("shared notice text is exact and inherits readable small type", () => {
  assert.equal(notice.split(NOTICE).length - 1, 1);
  assert.match(notice, /className\?: string/);
  assert.match(notice, /text-sm/);
  assert.match(notice, /text-inherit/);
  assert.doesNotMatch(notice, /opacity-0|text-transparent|\binvisible\b|\bhidden\b/);
  assert.doesNotMatch(notice, /privacy-policy|terms-of-service|<Link|href=/);
});

test("notice sits immediately below the contact call button", () => {
  const region = between(contact, "Call {PRIMARY_PHONE_DISPLAY}", "mailto:brendan@get247roi.com");
  assert.match(region, /<MissedCallNotice\b/);
  assert.equal(contact.includes(NOTICE), false);
});

test("consent shows the missed-call heading and notice above the form", () => {
  const region = between(consent, "Missed-call replies", "<ContactForm");
  assert.match(region, /<MissedCallNotice\b/);
  assert.ok(consent.indexOf("Missed-call replies") < consent.indexOf("<ContactForm"));
  assert.match(consent, /not a promise that every automation is currently available/);
});

test("footer notice is beside the phone contact", () => {
  const region = between(footer, "PRIMARY_PHONE_HREF", "columns.map");
  assert.match(region, /flex flex-wrap/);
  assert.match(region, /\{PRIMARY_PHONE_DISPLAY\}/);
  assert.match(region, /<MissedCallNotice\b/);
  assert.ok(region.indexOf("{PRIMARY_PHONE_DISPLAY}") < region.indexOf("<MissedCallNotice"));
});

test("privacy SMS section includes the notice and call-record list", () => {
  const region = between(privacy, "3. SMS Messaging", "SMS Data Protection Statement");
  assert.match(region, /<MissedCallNotice\b/);
  assert.match(region, /Explicit website checkbox enrollment is required for ongoing service notifications and for the separate review scope/);
  assert.match(region, /separate inbound call record covers a single missed-call inquiry/);
  assert.match(region, /caller number, the call timestamp and outcome, and the related response record/);
  assert.match(region, /missed-call-only inquiry does not send an enrollment confirmation/);
  assert.match(region, /not a promise that every automation is currently available/);
  assert.match(privacy, /DOES NOT share customer opt-in information/);
  assert.match(privacy, /No mobile information will be shared with third parties\/affiliates/);
  assert.match(privacy, /Reply HELP or contact/);
  assert.match(privacy, /mailto:brendan@get247roi.com/);
});

test("terms program section enumerates both paths and keeps the carrier caveat", () => {
  const region = between(terms, "1. Program Description:", "2. Cancellation Instructions:");
  assert.match(region, /<MissedCallNotice\b/);
  assert.match(region, /\(1\) Customer-initiated missed-call inquiry: one acknowledgment, then a reply-gated inquiry conversation, as described in the public notice/);
  assert.match(region, /missed-call-only inquiry does not send an enrollment confirmation/);
  assert.match(region, /\(2\) Optional website form enrollment/);
  assert.match(region, /ongoing service notifications and independently selected service-related feedback/);
  assert.match(region, /This does not include promotional marketing/);
  assert.match(region, /not a promise that every automation is currently available/);
  assert.match(terms, /subject to applicable consent requirements and carrier approval/);
});

test("old call-consent contradiction is absent", () => {
  for (const source of [notice, contact, consent, privacy, terms, footer, form]) {
    assert.equal(source.includes(OLD), false);
  }
  assert.doesNotMatch(privacy, /any call is sufficient|calling constitutes consent|by calling you consent/i);
  assert.doesNotMatch(terms, /any call is sufficient|calling constitutes consent|by calling you consent/i);
  assert.doesNotMatch(consent, /any call is sufficient|calling constitutes consent|by calling you consent/i);
});

test("STOP persists through later calls and START does not auto-restart", () => {
  for (const source of [privacy, terms]) {
    assert.match(source, /Subsequent calls, submitting another form, or/);
    assert.match(source, /do not automatically restart messages/);
    assert.match(source, /START/);
    assert.match(source, /scope-specific consent/);
    assert.match(source, /provider and application/);
    assert.match(source, /support/);
    assert.match(source, /Reply (?:&quot;)?STOP/);
    assert.doesNotMatch(source, /reply START to (enroll|opt|join|subscribe|restart)/i);
    assert.doesNotMatch(source, /text START to/i);
  }
});

test("legal disclosure is version 2 and checkbox versions stay put", () => {
  for (const source of [privacy, terms]) {
    assert.match(source, /LLC missed-call inquiry disclosure, version 2\. Applies upon publication\./);
    assert.equal(source.includes("version 1"), false);
    assert.equal(source.includes("247roi-llc-service-v2"), false);
    assert.equal(source.includes("247roi-llc-review-v1"), false);
  }
  assert.match(consentSource, /export const SMS_CONSENT_VERSION = "247roi-llc-service-v2"/);
  assert.match(consentSource, /export const REVIEW_CONSENT_VERSION = "247roi-llc-review-v1"/);
});

test("optional service and review checkboxes are unchanged", () => {
  assert.match(form, /const \[smsConsent, setSmsConsent\] = useState\(false\)/);
  assert.match(form, /const \[reviewConsent, setReviewConsent\] = useState\(false\)/);
  assert.match(form, /checked=\{smsConsent\}/);
  assert.match(form, /checked=\{reviewConsent\}/);
  assert.equal(form.includes("defaultChecked"), false);
  assert.match(form, /\{SMS_CONSENT_TEXT\}/);
  assert.match(form, /\{REVIEW_CONSENT_TEXT\}/);
  assert.match(consentSource, /export const SMS_CONSENT_TEXT = "\(Optional\) I agree to receive SMS from 247ROI LLC at the number provided about my inquiries and follow-up, missed-call replies when I have opted in, appointments, service updates, and service-related follow-up\. Messages may be automated\. This does not include promotional marketing\. Consent is not required to submit or purchase\. Message frequency varies; message and data rates may apply\. Reply STOP to cancel, HELP for help\."/);
  assert.match(consentSource, /export const REVIEW_CONSENT_TEXT = "\(Optional, separate permission\) I agree to receive automated SMS from 247ROI LLC at the number provided with review requests related to services I receive\. This does not include promotional marketing\. Consent is not required to submit or purchase\. Message frequency varies; message and data rates may apply\. Reply STOP to cancel, HELP for help\."/);
  assert.match(consent, /separate optional checkboxes; both start unchecked/);
  assert.match(privacy, /both start unchecked/);
  assert.match(terms, /both checkboxes start unchecked/);
});

test("canonical exports stay on the public pages", () => {
  assert.match(contact, /alternates: \{ canonical: "\/contact" \}/);
  assert.match(consent, /alternates: \{ canonical: "\/consent" \}/);
  assert.match(privacy, /alternates: \{ canonical: "\/privacy-policy" \}/);
  assert.match(terms, /alternates: \{ canonical: "\/terms-of-service" \}/);
});
