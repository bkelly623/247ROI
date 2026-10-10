/** Stripe account that owns both test and live mode for 247ROI. */
export const EXPECTED_STRIPE_ACCOUNT_ID = "acct_1UOPq6QZRAfgWEE0";

/** Existing live Customer Portal configuration. Do not recreate it. */
export const LIVE_PORTAL_CONFIGURATION_ID = "bpc_1UOc2EQZRAfgWEE0fdtzOcgy";

export const PAYMENT_SUPPORT_EMAIL = "brendan@get247roi.com";

/** Metadata purpose for application-created Checkout Sessions. */
export const CHECKOUT_PURPOSE = "247roi_paid_onboarding";

export const ONBOARDING_TOKEN_TTL_SECONDS = 60 * 60 * 2;

/** Inside Stripe's 30-minute to 24-hour Checkout window. */
export const CHECKOUT_SESSION_TTL_SECONDS = 23 * 60 * 60;

/** Same-browser credential. Long enough to finish onboarding after Checkout expires. */
export const BROWSER_CREDENTIAL_TTL_SECONDS = 7 * 24 * 60 * 60;

export const ONBOARDING_TOKEN_PURPOSE = "onboarding";
