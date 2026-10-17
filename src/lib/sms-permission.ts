import { createHash } from "node:crypto";
import type { InquiryStore, SavedInquiry } from "@/lib/inquiries";
import { SMS_BRAND, SMS_CONSENT_VERSION, SERVICE_V2_CONSENT_VERSION, REVIEW_CONSENT_VERSION } from "@/lib/sms-consent";

/** Only explicit international numbers, or unambiguous US/NANP formatting.
 * Other national formats remain saved inquiries but cannot authorize automation. */
export function consentPhone(value: string): string | null {
  if (!/^[+\d\s().-]+$/.test(value)) return null;
  const clean = value.replace(/[\s().-]/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(clean)) return clean;
  if (/^[2-9]\d{2}[2-9]\d{6}$/.test(clean)) return `+1${clean}`;
  if (/^1[2-9]\d{2}[2-9]\d{6}$/.test(clean)) return `+${clean}`;
  return null;
}
export const permissionKey = (phone: string) => createHash("sha256").update(`${SMS_BRAND}:${phone}`).digest("hex");

/** Create-only index references the immutable submission. Retry repairs an
 * interrupted index write; it never rewrites old evidence or clears STOP. */
export async function indexSmsPermission(inquiry: SavedInquiry, store: InquiryStore) {
  // Index independent review choices too, including a decline paired with a
  // legacy inquiry version. The reference never expands that legacy scope;
  // MCTB still requires exact service-v2 evidence and otherwise fails closed;
  // inquiry-v3 evidence carries only its own saved inquiry subjects.
  const phone = inquiry.consentVersion === SMS_CONSENT_VERSION || inquiry.consentVersion === SERVICE_V2_CONSENT_VERSION ? inquiry.consentPhone
    : inquiry.reviewConsentVersion === REVIEW_CONSENT_VERSION ? inquiry.reviewConsentPhone : null;
  if (!phone) return;
  const key = `sms-permissions/${permissionKey(phone)}/${inquiry.submissionId}.json`;
  await store.put(key, { submissionId: inquiry.submissionId });
  const readback = await store.get<{submissionId: string}>(key);
  if (readback?.submissionId !== inquiry.submissionId) throw new Error("sms_permission_index_failed");
}
