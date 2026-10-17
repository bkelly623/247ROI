/** Versioned disclosures, not evidence that an automation is enabled or approved. */
export const SMS_BRAND = "247ROI LLC" as const;
export const SMS_CONSENT_VERSION = "247roi-llc-inquiry-v3" as const;
export const SMS_SUBJECTS = ["inquiry"] as const;
export const SMS_CONSENT_TEXT = "(Optional) I agree to receive SMS from 247ROI LLC at the phone number provided about my inquiry and related follow-up. Messages may be automated. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, HELP for help. Consent is not required to submit this form or purchase services. We will not sell or share mobile information with third parties for promotional or marketing purposes.";
// Legacy disclosures stay so older submissions keep their original text and scope.
export const SERVICE_V2_CONSENT_VERSION = "247roi-llc-service-v2" as const;
export const SERVICE_V2_SUBJECTS = ["inquiry", "missed-call", "appointment", "service-update"] as const;
export const SERVICE_V2_CONSENT_TEXT = "(Optional) I agree to receive SMS from 247ROI LLC at the number provided about my inquiries and follow-up, missed-call replies when I have opted in, appointments, service updates, and service-related follow-up. Messages may be automated. This does not include promotional marketing. Consent is not required to submit or purchase. Message frequency varies; message and data rates may apply. Reply STOP to cancel, HELP for help.";
export const REVIEW_CONSENT_VERSION = "247roi-llc-review-v1" as const;
export const REVIEW_SUBJECTS = ["service-review-request"] as const;
export const REVIEW_CONSENT_TEXT = "(Optional, separate permission) I agree to receive automated SMS from 247ROI LLC at the number provided with review requests related to services I receive. This does not include promotional marketing. Consent is not required to submit or purchase. Message frequency varies; message and data rates may apply. Reply STOP to cancel, HELP for help.";
