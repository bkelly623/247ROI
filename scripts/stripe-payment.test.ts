import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Stripe from "stripe";
import { browserBinding, browserBindingMatches, browserNonceFromCookie, checkoutCookieValue, issueBrowserCredential, issueOnboardingCapability, readBrowserCredential, readOnboardingCapability, signCheckoutIntent } from "../src/lib/payments/capability";
import { startConfiguredCheckout } from "../src/lib/payments/checkout";
import { drainPaymentNotifications } from "../src/lib/payments/outbox";
import { buildConfirmation } from "../src/lib/payments/confirmation";
import { BROWSER_CREDENTIAL_TTL_SECONDS, CHECKOUT_SESSION_TTL_SECONDS, EXPECTED_STRIPE_ACCOUNT_ID } from "../src/lib/payments/constants";
import { paymentReturnUrl, readStripeConfig, type StripeConfig } from "../src/lib/payments/config";
import { createMemoryLedger, type PaymentLedger } from "../src/lib/payments/ledger";
import { deliverOnboardingNotice, readPaidOnboarding, savePaidOnboarding } from "../src/lib/payments/onboarding";
import { createAuthorizedPortalSession } from "../src/lib/payments/portal";
import { assertExpectedStripeAccount, checkoutSessionCreateParams, type VerifiedStripeEvent } from "../src/lib/payments/stripe-server";
import { handleStripeWebhook } from "../src/lib/payments/webhook";

const stripe = new Stripe("sk_test_unit_only");
const SECRET = "whsec_unit_test_secret_value";
const CAPABILITY = "0123456789abcdef0123456789abcdef";
const SESSION = "cs_test_abc12345";
const EMAIL = "secret.person@example.com";
const RECEIPT = "https://pay.stripe.com/receipts/secret";
const CUSTOMER = "cus_secretperson";
const NONCE = Buffer.alloc(32, 7).toString("base64url");
const BINDING = browserBinding("test", EXPECTED_STRIPE_ACCOUNT_ID, NONCE, CAPABILITY);

function env(extra: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return {
    STRIPE_MODE: "test",
    STRIPE_SECRET_KEY: "sk_test_unit_only",
    STRIPE_WEBHOOK_SECRET: SECRET,
    STRIPE_EXPECTED_ACCOUNT_ID: EXPECTED_STRIPE_ACCOUNT_ID,
    PAYMENT_CAPABILITY_SECRET: CAPABILITY,
    STRIPE_ALLOWED_PRICE_IDS: "price_allowed",
    PAYMENT_APP_BASE_URL: "https://www.get247roi.com",
    ...extra,
  } as unknown as NodeJS.ProcessEnv;
}

function config(extra: Record<string, string | undefined> = {}): StripeConfig {
  return readStripeConfig(env(extra));
}

function checkout(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION,
    object: "checkout.session",
    mode: "payment",
    amount_total: 5000,
    currency: "usd",
    payment_status: "paid",
    status: "complete",
    payment_intent: "pi_123",
    customer: CUSTOMER,
    customer_email: EMAIL,
    receipt_url: RECEIPT,
    metadata: {},
    line_items: { data: [{ price: { id: "price_allowed" }, amount_total: 5000 }] },
    ...overrides,
  };
}

function signedEvent(object: Record<string, unknown>, type = "checkout.session.completed", extra: Record<string, unknown> = {}) {
  const event = {
    id: "evt_paid",
    object: "event",
    type,
    livemode: false,
    api_version: "2024-06-20",
    data: { object },
    ...extra,
  };
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
  return { payload, signature, event };
}

function gateway(retrieve?: (id: string) => Promise<Record<string, unknown>>) {
  return {
    constructEvent(raw: string, signature: string, secret: string) {
      return stripe.webhooks.constructEvent(raw, signature, secret) as unknown as VerifiedStripeEvent;
    },
    async retrieveCheckoutSession(id: string) {
      if (!retrieve) throw new Error(`retrieve ${EMAIL}`);
      return retrieve(id);
    },
    async assertAccount() {},
    async createPortalSession() {
      return { url: "https://billing.stripe.com/p/session/test" };
    },
  };
}

async function post(ledger: PaymentLedger, built = signedEvent(checkout()), cfg = config(), calls = { n: 0 }) {
  const result = await handleStripeWebhook({
    rawBody: built.payload,
    signature: built.signature,
    config: cfg,
    ledger: {
      ...ledger,
      apply: async (action) => {
        calls.n += 1;
        return ledger.apply(action);
      },
    },
    gateway: gateway(),
  });
  return { result, calls };
}

async function main() {
  assert.throws(() => readStripeConfig({} as unknown as NodeJS.ProcessEnv), /stripe_mode_invalid/);
  assert.throws(() => readStripeConfig(env({ STRIPE_MODE: "live" })), /stripe_key_mode_mismatch/);
  assert.throws(() => readStripeConfig(env({ STRIPE_EXPECTED_ACCOUNT_ID: "acct_other" })), /stripe_account_not_allowed/);
  assert.throws(() => readStripeConfig(env({ PAYMENT_APP_BASE_URL: "https://roi-preview.vercel.app" })), /stripe_app_base_url_invalid/);
  assert.throws(() => readStripeConfig(env({ PAYMENT_TRUSTED_PREVIEW_HOSTS: "*.vercel.app" })), /stripe_preview_hosts_invalid/);
  assert.throws(() => readStripeConfig(env({ PAYMENT_APP_BASE_URL: "https://evil.example" })), /stripe_app_base_url_invalid/);
  assert.throws(() => readStripeConfig(env({ PAYMENT_APP_BASE_URL: "https://user:pass@www.get247roi.com" })), /stripe_app_base_url_invalid/);
  const preview = readStripeConfig(env({
    PAYMENT_APP_BASE_URL: "https://roi-preview.vercel.app",
    PAYMENT_TRUSTED_PREVIEW_HOSTS: "roi-preview.vercel.app",
  }));
  assert.equal(preview.appBaseUrl, "https://roi-preview.vercel.app");
  assert.equal(paymentReturnUrl(preview, SESSION), `https://roi-preview.vercel.app/payment/confirmation?session_id=${SESSION}`);
  assert.throws(() => paymentReturnUrl(preview, "https://evil.example"), /stripe_session_invalid/);

  await assert.rejects(assertExpectedStripeAccount(async () => ({ id: "acct_other" }), EXPECTED_STRIPE_ACCOUNT_ID), /stripe_account_mismatch/);
  await assert.rejects(assertExpectedStripeAccount(async () => { throw new Error("down"); }, EXPECTED_STRIPE_ACCOUNT_ID), /stripe_account_unverified/);
  await assertExpectedStripeAccount(async () => ({ id: EXPECTED_STRIPE_ACCOUNT_ID }), EXPECTED_STRIPE_ACCOUNT_ID);

  const bad = signedEvent(checkout());
  const rejected = await handleStripeWebhook({
    rawBody: `${bad.payload} `,
    signature: bad.signature,
    config: config(),
    ledger: createMemoryLedger(),
    gateway: gateway(),
  });
  assert.equal(rejected.status, 400);
  assert.equal(rejected.body.error, "signature_invalid");
  const missing = await handleStripeWebhook({ rawBody: bad.payload, signature: null, config: config(), ledger: createMemoryLedger(), gateway: gateway() });
  assert.equal(missing.status, 400);

  const mismatchLedger = createMemoryLedger();
  let mismatchCalls = 0;
  const liveModeEvent = signedEvent(checkout(), "checkout.session.completed", { livemode: true });
  const modeMismatch = await handleStripeWebhook({
    rawBody: liveModeEvent.payload,
    signature: liveModeEvent.signature,
    config: config(),
    ledger: { ...mismatchLedger, apply: async (action) => { mismatchCalls += 1; return mismatchLedger.apply(action); } },
    gateway: gateway(),
  });
  assert.equal(modeMismatch.status, 400);
  assert.equal(modeMismatch.body.error, "stripe_mode_mismatch");
  assert.equal(mismatchCalls, 0);

  const accountEvent = signedEvent(checkout(), "checkout.session.completed", { account: "acct_other" });
  const accountMismatch = await handleStripeWebhook({
    rawBody: accountEvent.payload,
    signature: accountEvent.signature,
    config: config(),
    ledger: { ...mismatchLedger, apply: async (action) => { mismatchCalls += 1; return mismatchLedger.apply(action); } },
    gateway: gateway(),
  });
  assert.equal(accountMismatch.status, 400);
  assert.equal(accountMismatch.body.error, "stripe_account_mismatch");
  assert.equal(mismatchCalls, 0);

  const paidLedger = createMemoryLedger();
  const paid = await post(paidLedger, signedEvent(checkout({ metadata: { browser_binding: BINDING } }), "checkout.session.completed", { account: EXPECTED_STRIPE_ACCOUNT_ID }));
  assert.equal(paid.result.status, 200);
  assert.equal(paid.result.body.status, "paid");
  assert.equal(JSON.stringify(paid.result.body).includes(EMAIL), false);
  assert.equal(JSON.stringify(paid.result.body).includes(RECEIPT), false);
  const again = await post(paidLedger, signedEvent(checkout({ metadata: { browser_binding: BINDING } }), "checkout.session.completed", { account: EXPECTED_STRIPE_ACCOUNT_ID }));
  assert.equal(again.result.body.duplicate, true);
  const paidRow = await paidLedger.getBySession(EXPECTED_STRIPE_ACCOUNT_ID, "test", SESSION);
  assert.equal(paidRow?.fulfilledAt == null, false);
  assert.equal((await paidLedger.listOutbox()).filter((row) => row.kind === "fulfillment_recorded").length, 1);

  const concurrent = createMemoryLedger();
  const concurrentEvent = signedEvent(checkout(), "checkout.session.completed", { id: "evt_concurrent" });
  const pair = await Promise.all([
    handleStripeWebhook({ rawBody: concurrentEvent.payload, signature: concurrentEvent.signature, config: config(), ledger: concurrent, gateway: gateway() }),
    handleStripeWebhook({ rawBody: concurrentEvent.payload, signature: concurrentEvent.signature, config: config(), ledger: concurrent, gateway: gateway() }),
  ]);
  assert.equal(pair.filter((item) => item.body.duplicate === false && item.body.status === "paid").length, 1);
  assert.equal((await concurrent.listOutbox()).filter((row) => row.kind === "fulfillment_recorded").length, 1);

  let attempts = 0;
  const durable = createMemoryLedger();
  const flaky: PaymentLedger = { ...durable, apply: async (action) => { attempts += 1; if (attempts === 1) throw new Error("payment_persist_failed"); return durable.apply(action); } };
  const retryEvent = signedEvent(checkout(), "checkout.session.completed", { id: "evt_retry" });
  const first = await handleStripeWebhook({ rawBody: retryEvent.payload, signature: retryEvent.signature, config: config(), ledger: flaky, gateway: gateway() });
  const second = await handleStripeWebhook({ rawBody: retryEvent.payload, signature: retryEvent.signature, config: config(), ledger: flaky, gateway: gateway() });
  assert.equal(first.status, 500);
  assert.equal(first.body.error, "payment_persist_failed");
  assert.equal(JSON.stringify(first.body).includes(EMAIL), false);
  assert.equal(second.status, 200);
  assert.equal((await durable.getBySession(EXPECTED_STRIPE_ACCOUNT_ID, "test", SESSION))?.status, "paid");

  const refundFirst = createMemoryLedger();
  const refund = signedEvent({ id: "ch_1", object: "charge", payment_intent: "pi_123", refunded: true, amount: 5000, amount_refunded: 5000, receipt_url: RECEIPT, billing_details: { email: EMAIL } }, "charge.refunded", { id: "evt_refund" });
  const refunded = await handleStripeWebhook({ rawBody: refund.payload, signature: refund.signature, config: config(), ledger: refundFirst, gateway: gateway() });
  assert.equal(refunded.status, 200);
  const latePaid = signedEvent(checkout(), "checkout.session.completed", { id: "evt_late_paid" });
  const late = await handleStripeWebhook({ rawBody: latePaid.payload, signature: latePaid.signature, config: config(), ledger: refundFirst, gateway: gateway() });
  assert.equal(late.body.status, "refunded");
  const refundRow = await refundFirst.getBySession(EXPECTED_STRIPE_ACCOUNT_ID, "test", SESSION);
  assert.equal(refundRow?.fulfilledAt, null);
  assert.equal((await refundFirst.listOutbox()).some((row) => row.kind === "fulfillment_recorded"), false);

  const paidThenRefund = createMemoryLedger();
  await post(paidThenRefund, signedEvent(checkout(), "checkout.session.completed", { id: "evt_before_refund" }));
  const laterRefund = signedEvent({ id: "ch_2", object: "charge", payment_intent: "pi_123", refunded: true, amount: 5000, amount_refunded: 5000 }, "charge.refunded", { id: "evt_later_refund" });
  const after = await handleStripeWebhook({ rawBody: laterRefund.payload, signature: laterRefund.signature, config: config(), ledger: paidThenRefund, gateway: gateway() });
  assert.equal(after.body.status, "refunded");
  assert.equal((await paidThenRefund.listOutbox()).filter((row) => row.kind === "fulfillment_recorded").length, 1);

  const asyncLedger = createMemoryLedger();
  const pending = signedEvent(checkout({ payment_status: "unpaid", status: "complete" }), "checkout.session.completed", { id: "evt_async_open" });
  const pendingResult = await handleStripeWebhook({ rawBody: pending.payload, signature: pending.signature, config: config(), ledger: asyncLedger, gateway: gateway() });
  assert.equal(pendingResult.body.status, "processing");
  assert.equal((await asyncLedger.getBySession(EXPECTED_STRIPE_ACCOUNT_ID, "test", SESSION))?.fulfilledAt, null);
  const succeeded = signedEvent(checkout(), "checkout.session.async_payment_succeeded", { id: "evt_async_ok" });
  const succeededResult = await handleStripeWebhook({ rawBody: succeeded.payload, signature: succeeded.signature, config: config(), ledger: asyncLedger, gateway: gateway() });
  assert.equal(succeededResult.body.status, "paid");

  const failedLedger = createMemoryLedger();
  const open = signedEvent(checkout({ payment_status: "unpaid", status: "complete" }), "checkout.session.completed", { id: "evt_fail_open" });
  await handleStripeWebhook({ rawBody: open.payload, signature: open.signature, config: config(), ledger: failedLedger, gateway: gateway() });
  const failed = signedEvent(checkout({ payment_status: "unpaid", status: "complete" }), "checkout.session.async_payment_failed", { id: "evt_fail" });
  const failedResult = await handleStripeWebhook({ rawBody: failed.payload, signature: failed.signature, config: config(), ledger: failedLedger, gateway: gateway() });
  assert.equal(failedResult.body.status, "failed");
  assert.equal((await failedLedger.getBySession(EXPECTED_STRIPE_ACCOUNT_ID, "test", SESSION))?.fulfilledAt, null);

  const expiredLedger = createMemoryLedger();
  const expired = signedEvent(checkout({ status: "expired", payment_status: "unpaid", amount_total: 5000 }), "checkout.session.expired", { id: "evt_expired" });
  const expiredResult = await handleStripeWebhook({ rawBody: expired.payload, signature: expired.signature, config: config(), ledger: expiredLedger, gateway: gateway() });
  assert.equal(expiredResult.body.status, "expired");
  const expiredPaid = signedEvent(checkout(), "checkout.session.completed", { id: "evt_expired_late" });
  await handleStripeWebhook({ rawBody: expiredPaid.payload, signature: expiredPaid.signature, config: config(), ledger: expiredLedger, gateway: gateway() });
  const keepPaid = await expiredLedger.getBySession(EXPECTED_STRIPE_ACCOUNT_ID, "test", SESSION);
  assert.equal(keepPaid?.status, "paid");
  const lateExpired = signedEvent(checkout({ status: "expired" }), "checkout.session.expired", { id: "evt_expired_after" });
  await handleStripeWebhook({ rawBody: lateExpired.payload, signature: lateExpired.signature, config: config(), ledger: expiredLedger, gateway: gateway() });
  assert.equal((await expiredLedger.getBySession(EXPECTED_STRIPE_ACCOUNT_ID, "test", SESSION))?.status, "paid");

  const free = signedEvent(checkout({ amount_total: 0, payment_status: "no_payment_required" }), "checkout.session.completed", { id: "evt_free" });
  const freeLedger = createMemoryLedger();
  const freeResult = await handleStripeWebhook({ rawBody: free.payload, signature: free.signature, config: config(), ledger: freeLedger, gateway: gateway() });
  assert.equal(freeResult.body.status, "unrecognized");
  assert.equal((await freeLedger.getBySession(EXPECTED_STRIPE_ACCOUNT_ID, "test", SESSION))?.fulfilledAt, null);
  const other = signedEvent(checkout({ line_items: { data: [{ price: { id: "price_other" } }] } }), "checkout.session.completed", { id: "evt_other" });
  const otherLedger = createMemoryLedger();
  const otherResult = await handleStripeWebhook({ rawBody: other.payload, signature: other.signature, config: config(), ledger: otherLedger, gateway: gateway() });
  assert.equal(otherResult.body.status, "unrecognized");

  const intent = signCheckoutIntent("test", "price_signed", CAPABILITY);
  const signed = signedEvent(checkout({
    line_items: { data: [{ price: { id: "price_signed" } }] },
    metadata: { purpose: "247roi_paid_onboarding", price_id: "price_signed", intent },
  }), "checkout.session.completed", { id: "evt_intent" });
  const intentLedger = createMemoryLedger();
  const intentResult = await handleStripeWebhook({
    rawBody: signed.payload,
    signature: signed.signature,
    config: config({ STRIPE_ALLOWED_PRICE_IDS: "" }),
    ledger: intentLedger,
    gateway: gateway(),
  });
  assert.equal(intentResult.body.status, "paid");
  const badIntent = signedEvent(checkout({
    line_items: { data: [{ price: { id: "price_signed" } }] },
    metadata: { purpose: "247roi_paid_onboarding", price_id: "price_signed", intent: "a".repeat(64) },
  }), "checkout.session.completed", { id: "evt_bad_intent" });
  const badIntentResult = await handleStripeWebhook({ rawBody: badIntent.payload, signature: badIntent.signature, config: config({ STRIPE_ALLOWED_PRICE_IDS: "" }), ledger: createMemoryLedger(), gateway: gateway() });
  assert.equal(badIntentResult.body.status, "unrecognized");

  const cfg = config();
  const unpaidView = await buildConfirmation({
    sessionId: SESSION,
    config: cfg,
    ledger: createMemoryLedger(),
    retrieve: async () => checkout({ payment_status: "unpaid", status: "open", customer_email: EMAIL, receipt_url: RECEIPT, customer: CUSTOMER }),
  });
  assert.equal(unpaidView.status, "unpaid");
  assert.equal(unpaidView.testPayment, true);
  assert.equal(unpaidView.onboardingPath, null);
  const unpaidJson = JSON.stringify(unpaidView);
  assert.equal(unpaidJson.includes(EMAIL), false);
  assert.equal(unpaidJson.includes(RECEIPT), false);
  assert.equal(unpaidJson.includes(CUSTOMER), false);
  assert.deepEqual(Object.keys(unpaidView).sort(), ["message", "mode", "onboardingPath", "poll", "status", "testPayment"]);

  const processingView = await buildConfirmation({
    sessionId: SESSION,
    config: cfg,
    ledger: createMemoryLedger(),
    retrieve: async () => checkout({ customer_email: EMAIL, receipt_url: RECEIPT, customer: CUSTOMER }),
  });
  assert.equal(processingView.status, "processing");
  assert.equal(processingView.poll, true);
  assert.equal(processingView.onboardingPath, null);
  assert.equal(JSON.stringify(processingView).includes(EMAIL), false);

  const invalidFlag = await buildConfirmation({ sessionId: "paid", config: cfg, ledger: paidLedger, retrieve: async () => { throw new Error(EMAIL); } });
  assert.equal(invalidFlag.status, "invalid");
  assert.equal(JSON.stringify(invalidFlag).includes(EMAIL), false);
  const leaked = await buildConfirmation({ sessionId: SESSION, config: cfg, ledger: paidLedger, retrieve: async () => checkout(), now: 1_700_000_000 });
  assert.equal(leaked.status, "paid");
  assert.equal(leaked.onboardingPath, null);
  assert.match(leaked.message, /Payment received\. No further action is required\./);
  const wrongCookie = await buildConfirmation({ sessionId: SESSION, config: cfg, ledger: paidLedger, cookieNonce: Buffer.alloc(32, 9).toString("base64url"), retrieve: async () => checkout(), now: 1_700_000_000 });
  assert.equal(wrongCookie.onboardingPath, null);
  const flipped = `${BINDING.slice(0, 63)}${BINDING.endsWith("0") ? "1" : "0"}`;
  assert.equal(browserBindingMatches("test", EXPECTED_STRIPE_ACCOUNT_ID, NONCE, flipped, CAPABILITY), false);
  assert.equal(browserBindingMatches("live", EXPECTED_STRIPE_ACCOUNT_ID, NONCE, BINDING, CAPABILITY), false);
  assert.equal(browserBindingMatches("test", "acct_otheraccount", NONCE, BINDING, CAPABILITY), false);
  const paidView = await buildConfirmation({ sessionId: SESSION, config: cfg, ledger: paidLedger, cookieNonce: NONCE, retrieve: async () => { throw new Error(EMAIL); }, now: 1_700_000_000 });
  assert.equal(paidView.status, "paid");
  assert.match(paidView.message, /^Test payment\./);
  assert.equal(JSON.stringify(paidView).includes(EMAIL), false);
  assert.equal(JSON.stringify(paidView).includes(CUSTOMER), false);
  assert.equal(paidView.onboardingPath, null);
  assert.match(paidView.message, /Payment received\. No further action is required\./);
  const token = issueOnboardingCapability({ secret: CAPABILITY, mode: cfg.mode, accountId: cfg.expectedAccountId, sessionId: SESSION, now: 1_700_000_000 });
  const decoded = readOnboardingCapability(token, CAPABILITY, 1_700_000_000);
  assert.equal(JSON.stringify(decoded).includes(EMAIL), false);
  assert.equal(decoded.sessionId, SESSION);
  assert.throws(() => readOnboardingCapability(token, CAPABILITY, decoded.exp + 1), /capability_expired/);
  assert.throws(() => readOnboardingCapability(`${token}x`, CAPABILITY, 1_700_000_000), /capability_invalid/);

  const live = readStripeConfig(env({ STRIPE_MODE: "live", STRIPE_SECRET_KEY: "sk_live_unit_only", STRIPE_PORTAL_CONFIGURATION_ID: "bpc_1UOc2EQZRAfgWEE0fdtzOcgy" }));
  const liveView = await buildConfirmation({
    sessionId: "cs_live_abc12345",
    config: live,
    ledger: createMemoryLedger(),
    retrieve: async () => ({ ...checkout({ id: "cs_live_abc12345" }), livemode: true, customer_email: EMAIL }),
  });
  assert.equal(liveView.testPayment, false);
  assert.equal(liveView.status, "processing");
  assert.equal(liveView.message.startsWith("Test payment"), false);

  const form = {
    token,
    businessName: "North Side Plumbing",
    contactName: "Ada Owner",
    email: "Ada@Example.com",
    phone: "610-300-3001",
    website: "northside.example",
    serviceNotes: "Missed calls should text the owner back.",
  };
  const stolen = await readPaidOnboarding({ token, config: cfg, ledger: paidLedger, now: 1_700_000_000 });
  assert.equal(stolen.status, 403);
  assert.equal("profile" in stolen.body, false);
  assert.equal(JSON.stringify(stolen.body).includes(EMAIL), false);
  const saved = await savePaidOnboarding({ body: { ...form, package: "gold" }, cookieNonce: NONCE, config: cfg, ledger: paidLedger, now: 1_700_000_000 });
  assert.equal(saved.status, 400);
  const ok = await savePaidOnboarding({ body: form, cookieNonce: NONCE, config: cfg, ledger: paidLedger, now: 1_700_000_000 });
  assert.equal(ok.status, 200);
  assert.ok("profile" in ok.body && ok.body.profile);
  assert.equal("package" in ok.body.profile, false);
  assert.equal(ok.body.profile.email, "ada@example.com");
  const againSave = await savePaidOnboarding({ body: form, cookieNonce: NONCE, config: cfg, ledger: paidLedger, now: 1_700_000_000 });
  assert.equal(againSave.status, 200);
  assert.equal((await paidLedger.listOutbox()).filter((row) => row.kind === "onboarding_saved").length, 1);
  const read = await readPaidOnboarding({ token, cookieNonce: NONCE, config: cfg, ledger: paidLedger, now: 1_700_000_000 });
  assert.ok("profile" in read.body && read.body.profile);
  assert.equal(read.body.profile.businessName, "North Side Plumbing");
  assert.equal(JSON.stringify(read.body).includes(CUSTOMER), false);
  const tampered = await savePaidOnboarding({ body: { ...form, token: `${token}x` }, cookieNonce: NONCE, config: cfg, ledger: paidLedger, now: 1_700_000_000 });
  assert.equal(tampered.status, 401);
  const expiredSave = await savePaidOnboarding({ body: form, cookieNonce: NONCE, config: cfg, ledger: paidLedger, now: decoded.exp + 5 });
  assert.equal(expiredSave.status, 401);
  const blocked = await savePaidOnboarding({ body: { ...form, token }, config: cfg, ledger: refundFirst, now: 1_700_000_000 });
  assert.equal(blocked.status, 403);

  let posts = 0;
  await deliverOnboardingNotice(paidLedger, {
    accountId: EXPECTED_STRIPE_ACCOUNT_ID,
    sessionId: SESSION,
    mode: "test",
    businessName: form.businessName,
    contactName: form.contactName,
    email: "ada@example.com",
    phone: form.phone,
    website: form.website,
    serviceNotes: form.serviceNotes,
    updatedAt: "2026-01-01T00:00:00.000Z",
  }, (await paidLedger.listOutbox()).find((row) => row.kind === "onboarding_saved")?.dedupeKey ?? "", { PAYMENT_NOTIFY_WEBHOOK_URL: "https://notify.example/hook" } as unknown as NodeJS.ProcessEnv, async () => {
    posts += 1;
    return new Response("no", { status: 500 });
  });
  assert.equal(posts, 1);
  const notice = (await paidLedger.listOutbox()).find((row) => row.kind === "onboarding_saved");
  assert.equal(notice?.sentAt, null);
  assert.equal(notice?.attemptCount, 0);

  const portalCalls: Array<{ customer: string; returnUrl: string; configuration: string }> = [];
  const portal = await createAuthorizedPortalSession({
    token,
    config: cfg,
    ledger: paidLedger,
    now: 1_700_000_000,
    gateway: {
      async createPortalSession(input) {
        portalCalls.push(input);
        return { url: "https://billing.stripe.com/p/session/test" };
      },
    },
  });
  assert.equal(portal.status, 503);
  assert.equal(portalCalls.length, 0);
  const withPortal = await createAuthorizedPortalSession({
    token,
    cookieNonce: NONCE,
    config: readStripeConfig(env({ STRIPE_PORTAL_CONFIGURATION_ID: "bpc_testpreview" })),
    ledger: paidLedger,
    now: 1_700_000_000,
    gateway: {
      async createPortalSession(input) {
        portalCalls.push(input);
        return { url: "https://billing.stripe.com/p/session/test" };
      },
    },
  });
  assert.equal(withPortal.status, 200);
  assert.equal(portalCalls[0]?.customer, CUSTOMER);
  assert.equal(portalCalls[0]?.returnUrl, `https://www.get247roi.com/payment/confirmation?session_id=${SESSION}`);
  assert.equal(JSON.stringify(withPortal.body).includes("evil.example"), false);

  const webhookRoute = readFileSync("src/app/api/stripe/webhook/route.ts", "utf8");
  assert.match(webhookRoute, /await req\.text\(\)/);
  assert.doesNotMatch(webhookRoute, /req\.json\(/);
  assert.doesNotMatch(webhookRoute, /createMemoryLedger/);
  const confirmationRoute = readFileSync("src/app/api/stripe/confirmation/route.ts", "utf8");
  assert.doesNotMatch(confirmationRoute, /searchParams\.get\("paid"\)/);
  assert.doesNotMatch(confirmationRoute, /createMemoryLedger/);
  const confirmationUi = readFileSync("src/app/payment/confirmation/ConfirmationStatus.tsx", "utf8");
  assert.doesNotMatch(confirmationUi, /Continue to implementation onboarding|href=\{view.onboardingPath\}|<form/);
  assert.match(confirmationUi, /mailto:brendan@get247roi.com/);
  const retiredPage = readFileSync("src/app/payment/onboarding/page.tsx", "utf8");
  assert.match(retiredPage, /redirect\("\/payment\/confirmation"\)/);
  assert.doesNotMatch(retiredPage, /OnboardingForm|<form|searchParams/);
  assert.match(readFileSync("src/app/payment/confirmation/page.tsx", "utf8"), /This page does not confirm payment status/);
  assert.doesNotMatch(readFileSync("src/app/layout.tsx", "utf8"), /lib\/payments/);
  assert.doesNotMatch(readFileSync("src/app/onboarding/page.tsx", "utf8"), /stripe/i);
  assert.match(readFileSync("supabase/migrations/018_payments_ledger.sql", "utf8"), /payments-account\|/);

  const partial = createMemoryLedger();
  await partial.apply({ kind: "refund", eventId: "evt_p1", eventType: "charge.refunded", accountId: EXPECTED_STRIPE_ACCOUNT_ID, mode: "test", paymentIntentId: "pi_partial", chargeId: "ch_p", fullRefund: false, payload: {} });
  const partialPaid = await partial.apply({ kind: "checkout", eventId: "evt_p2", eventType: "checkout.session.completed", accountId: EXPECTED_STRIPE_ACCOUNT_ID, mode: "test", sessionId: "cs_test_partial1", paymentIntentId: "pi_partial", chargeId: null, customerId: CUSTOMER, amountTotal: 5000, currency: "usd", recognized: true, outcome: "paid", browserBinding: BINDING, payload: {} });
  assert.equal(partialPaid.fulfilledNow, true);
  assert.equal(partialPaid.status, "partially_refunded");
  assert.equal((await partial.getBySession(EXPECTED_STRIPE_ACCOUNT_ID, "test", "cs_test_partial1"))?.fulfilledAt == null, false);
  const partialAgain = await partial.apply({ kind: "checkout", eventId: "evt_p3", eventType: "checkout.session.completed", accountId: EXPECTED_STRIPE_ACCOUNT_ID, mode: "test", sessionId: "cs_test_partial1", paymentIntentId: "pi_partial", chargeId: null, customerId: CUSTOMER, amountTotal: 5000, currency: "usd", recognized: true, outcome: "paid", payload: {} });
  assert.equal(partialAgain.fulfilledNow, false);
  const fullFirst = createMemoryLedger();
  await fullFirst.apply({ kind: "refund", eventId: "evt_f1", eventType: "charge.refunded", accountId: EXPECTED_STRIPE_ACCOUNT_ID, mode: "test", paymentIntentId: "pi_full", chargeId: null, fullRefund: true, payload: {} });
  const fullPaid = await fullFirst.apply({ kind: "checkout", eventId: "evt_f2", eventType: "checkout.session.completed", accountId: EXPECTED_STRIPE_ACCOUNT_ID, mode: "test", sessionId: "cs_test_full111", paymentIntentId: "pi_full", chargeId: null, customerId: null, amountTotal: 5000, currency: "usd", recognized: true, outcome: "paid", payload: {} });
  assert.equal(fullPaid.fulfilledNow, false);
  assert.equal((await fullFirst.getBySession(EXPECTED_STRIPE_ACCOUNT_ID, "test", "cs_test_full111"))?.fulfilledAt, null);
  const sub = signedEvent(checkout({ mode: "subscription" }), "checkout.session.completed", { id: "evt_sub" });
  const subResult = await handleStripeWebhook({ rawBody: sub.payload, signature: sub.signature, config: config(), ledger: createMemoryLedger(), gateway: gateway() });
  assert.equal(subResult.body.status, "unrecognized");

  const calls: Array<Record<string, unknown>> = [];
  const started = await startConfiguredCheckout({
    config: cfg,
    origin: "https://www.get247roi.com",
    priceId: "price_allowed",
    gateway: {
      async assertAccount() {},
      async retrievePrice(id) { return { id, active: true, type: "one_time", livemode: false }; },
      async createCheckoutSession(params) { calls.push(params); return { id: "cs_test_new", url: "https://checkout.stripe.com/c/pay/test" }; },
    },
  });
  assert.equal(started.status, 200);
  assert.match(started.cookie ?? "", /HttpOnly/);
  assert.match(started.cookie ?? "", /Secure/);
  assert.equal(JSON.stringify(calls[0]).includes("unit_amount"), false);
  const closed = await startConfiguredCheckout({ config: config({ STRIPE_ALLOWED_PRICE_IDS: "" }), origin: "https://www.get247roi.com", priceId: "price_allowed", gateway: { async assertAccount() {}, async retrievePrice() { throw new Error("no"); }, async createCheckoutSession() { throw new Error("no"); } } });
  assert.equal(closed.status, 503);
  const foreign = await startConfiguredCheckout({ config: cfg, origin: "https://evil.example", priceId: "price_allowed", gateway: { async assertAccount() {}, async retrievePrice(id) { return { id, active: true, type: "one_time", livemode: false }; }, async createCheckoutSession() { throw new Error("no"); } } });
  assert.equal(foreign.status, 403);

  const queue = createMemoryLedger();
  await queue.enqueue({ dedupeKey: "onboarding:test:queue:1", mode: "test", kind: "onboarding_saved", payload: { sessionId: "cs_test_queue" }, sentAt: null, attemptCount: 0, lastError: null });
  const [firstClaim, secondClaim] = await Promise.all([queue.claimNotifications("worker-one-1234", 5, 30), queue.claimNotifications("worker-two-1234", 5, 30)]);
  assert.equal(firstClaim.length + secondClaim.length, 1);
  const winner = firstClaim[0] ?? secondClaim[0];
  assert.equal(winner?.attemptCount, 1);
  await queue.markOutboxFailed("onboarding:test:queue:1", "notification_not_accepted", winner?.claimToken ?? "");
  assert.equal((await queue.listOutbox()).find((row) => row.dedupeKey === "onboarding:test:queue:1")?.attemptCount, 1);
  assert.equal((await queue.claimNotifications("worker-three-12", 5, 30)).length, 0);
  const held = (await queue.listOutbox()).find((row) => row.dedupeKey === "onboarding:test:queue:1");
  if (held) held.nextAttemptAt = Date.now() - 1000;
  assert.equal((await queue.claimNotifications("worker-four-123", 5, 30)).length, 1);
  const drained = await drainPaymentNotifications({ ledger: queue, env: { NODE_ENV: "test" }, send: async () => new Response("ok") });
  assert.equal(drained.configured, false);

  const fence = createMemoryLedger();
  await fence.enqueue({ dedupeKey: "onboarding:test:fence:1", mode: "test", kind: "onboarding_saved", payload: { sessionId: "cs_test_fence" }, sentAt: null, attemptCount: 0, lastError: null });
  const claimA = (await fence.claimNotifications("worker-aaaa-1234", 1, 30))[0];
  const fenced = (await fence.listOutbox()).find((row) => row.dedupeKey === claimA.dedupeKey);
  if (fenced) fenced.leaseUntil = Date.now() - 1000;
  const claimB = (await fence.claimNotifications("worker-bbbb-1234", 1, 30))[0];
  assert.notEqual(claimA.claimToken, claimB.claimToken);
  assert.equal(await fence.markOutboxSent(claimA.dedupeKey, "2026-01-01T00:00:00.000Z", claimA.claimToken ?? ""), false);
  assert.equal(await fence.markOutboxFailed(claimA.dedupeKey, "stale", claimA.claimToken ?? ""), false);
  const during = (await fence.listOutbox()).find((row) => row.dedupeKey === claimA.dedupeKey);
  assert.equal(during?.sentAt, null);
  assert.equal(during?.lastError, null);
  assert.equal(during?.claimToken, claimB.claimToken);
  assert.equal(during?.attemptCount, 2);
  assert.equal(await fence.markOutboxSent(claimB.dedupeKey, "2026-01-01T00:00:00.000Z", claimB.claimToken ?? ""), true);
  assert.equal((await fence.listOutbox()).find((row) => row.dedupeKey === claimA.dedupeKey)?.attemptCount, 2);
  const capped = createMemoryLedger();
  await capped.enqueue({ dedupeKey: "onboarding:test:cap:01", mode: "test", kind: "onboarding_saved", payload: {}, sentAt: null, attemptCount: 0, lastError: null });
  for (let attempt = 0; attempt < 8; attempt += 1) {
    assert.equal((await capped.claimNotifications(`worker-cap-${attempt}xxxx`, 1, 30)).length, 1);
    const row = (await capped.listOutbox())[0];
    row.leaseUntil = Date.now() - 1;
    row.nextAttemptAt = null;
  }
  assert.equal((await capped.claimNotifications("worker-cap-finalxx", 1, 30)).length, 0);
  assert.equal((await capped.listOutbox())[0]?.attemptCount, 8);
  assert.equal((await capped.listOutbox())[0]?.abandoned, true);

  const identity = createMemoryLedger();
  const known = { kind: "checkout" as const, eventId: "evt_known", eventType: "checkout.session.completed", accountId: EXPECTED_STRIPE_ACCOUNT_ID, mode: "test" as const, sessionId: "cs_test_ident01", paymentIntentId: "pi_known", chargeId: null, customerId: "cus_known", amountTotal: 5000, currency: "usd", recognized: true, outcome: "paid" as const, browserBinding: BINDING, payload: { browserBinding: BINDING } };
  await identity.apply(known);
  const otherBinding = "11".repeat(32);
  const clash = { ...known, eventId: "evt_clash", paymentIntentId: "pi_other", customerId: "cus_other", browserBinding: otherBinding, payload: {} };
  await assert.rejects(() => identity.apply(clash), /payment_identity_conflict/);
  await assert.rejects(() => identity.apply(clash), /payment_identity_conflict/);
  const kept = await identity.getBySession(EXPECTED_STRIPE_ACCOUNT_ID, "test", "cs_test_ident01");
  assert.equal(kept?.paymentIntentId, "pi_known");
  assert.equal(kept?.customerId, "cus_known");
  assert.equal(kept?.browserBinding, BINDING);
  await assert.rejects(() => identity.apply({ ...known, eventId: "evt_intent", paymentIntentId: "pi_other" }), /payment_identity_conflict/);
  await assert.rejects(() => identity.apply({ ...known, eventId: "evt_customer", customerId: "cus_other" }), /payment_identity_conflict/);
  await assert.rejects(() => identity.apply({ ...known, eventId: "evt_binding", browserBinding: otherBinding }), /payment_identity_conflict/);
  await assert.rejects(() => identity.apply({ ...known, eventId: "evt_session", sessionId: "cs_test_ident99" }), /payment_identity_conflict/);
  const filled = createMemoryLedger();
  await filled.apply({ ...known, eventId: "evt_fill_1", sessionId: "cs_test_fill001", paymentIntentId: null, customerId: null, browserBinding: null, recognized: false, outcome: "processing", payload: {} });
  await filled.apply({ ...known, eventId: "evt_fill_2", sessionId: "cs_test_fill001", payload: { browserBinding: BINDING } });
  const fillRow = await filled.getBySession(EXPECTED_STRIPE_ACCOUNT_ID, "test", "cs_test_fill001");
  assert.equal(fillRow?.paymentIntentId, "pi_known");
  assert.equal(fillRow?.customerId, "cus_known");
  assert.equal(fillRow?.browserBinding, BINDING);
  const split = createMemoryLedger();
  await split.apply({ kind: "refund", eventId: "evt_split_r", eventType: "charge.refunded", accountId: EXPECTED_STRIPE_ACCOUNT_ID, mode: "test", paymentIntentId: "pi_splitmem", chargeId: null, fullRefund: false, payload: {} });
  await split.apply({ ...known, eventId: "evt_split_s", sessionId: "cs_test_splitm1", paymentIntentId: null, customerId: null, browserBinding: null, recognized: false, outcome: "processing", payload: {} });
  const linked = await split.apply({ ...known, eventId: "evt_split_l", sessionId: "cs_test_splitm1", paymentIntentId: "pi_splitmem", payload: { browserBinding: BINDING } });
  assert.equal(linked.status, "partially_refunded");
  assert.equal(linked.fulfilledNow, true);

  const checkoutNow = 1_700_000_000;
  const recorded: Array<{ expiresAt?: number; metadata?: Record<string, string> }> = [];
  const firstCheckout = await startConfiguredCheckout({
    config: cfg,
    origin: "https://www.get247roi.com",
    priceId: "price_allowed",
    now: checkoutNow,
    gateway: { async assertAccount() {}, async retrievePrice(id) { return { id, active: true, type: "one_time", livemode: false }; }, async createCheckoutSession(params) { recorded.push(params); return { id: "cs_test_a", url: "https://checkout.stripe.com/c/pay/a" }; } },
  });
  const cookie = `roi_checkout_binding=${checkoutCookieValue(firstCheckout.cookie ?? "")}`;
  const secondCheckout = await startConfiguredCheckout({
    config: cfg,
    origin: "https://www.get247roi.com",
    priceId: "price_allowed",
    cookieHeader: cookie,
    now: checkoutNow + 60,
    gateway: { async assertAccount() {}, async retrievePrice(id) { return { id, active: true, type: "one_time", livemode: false }; }, async createCheckoutSession(params) { recorded.push(params); return { id: "cs_test_b", url: "https://checkout.stripe.com/c/pay/b" }; } },
  });
  assert.equal(recorded[0]?.metadata?.browser_binding, recorded[1]?.metadata?.browser_binding);
  assert.equal(recorded[0]?.expiresAt, checkoutNow + CHECKOUT_SESSION_TTL_SECONDS);
  const sharedNonce = browserNonceFromCookie(cookie, CAPABILITY, checkoutNow + 60);
  assert.ok(sharedNonce);
  assert.equal(browserBinding("test", EXPECTED_STRIPE_ACCOUNT_ID, sharedNonce, CAPABILITY), recorded[0]?.metadata?.browser_binding);
  assert.equal(JSON.stringify(recorded[0]?.metadata).includes(sharedNonce ?? "missing-nonce"), false);
  assert.equal(browserNonceFromCookie(secondCheckout.cookie ?? null, CAPABILITY, checkoutNow + 60), sharedNonce);
  const minted = issueBrowserCredential(CAPABILITY, checkoutNow, NONCE);
  assert.equal(readBrowserCredential(minted, CAPABILITY, checkoutNow + BROWSER_CREDENTIAL_TTL_SECONDS - 1)?.nonce, NONCE);
  assert.equal(readBrowserCredential(minted, CAPABILITY, checkoutNow + BROWSER_CREDENTIAL_TTL_SECONDS), null);
  assert.equal(browserNonceFromCookie(`roi_checkout_binding=${NONCE}`, CAPABILITY, checkoutNow), null);
  const params = checkoutSessionCreateParams({ priceId: "price_allowed", successUrl: "https://www.get247roi.com/payment/confirmation?session_id={CHECKOUT_SESSION_ID}", cancelUrl: "https://www.get247roi.com/payment/confirmation?session_id={CHECKOUT_SESSION_ID}", expiresAt: checkoutNow + CHECKOUT_SESSION_TTL_SECONDS, metadata: { purpose: "247roi_paid_onboarding" } });
  assert.equal(params.customer_creation, "always");
  assert.equal(params.expires_at, checkoutNow + CHECKOUT_SESSION_TTL_SECONDS);
  assert.equal(params.mode, "payment");
  assert.equal(JSON.stringify(params).includes("unit_amount"), false);

  console.log("stripe-payment tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
