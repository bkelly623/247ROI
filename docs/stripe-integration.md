# Stripe payment confirmation and onboarding

Server-only Stripe wiring for get247roi.com. Checkout is one-time payment mode only. Recurring subscriptions are rejected until terms and the first invoice are implemented. The public checkout start accepts only a server-configured price id, never a caller amount. Production products are not created here.

Account: `acct_1UOPq6QZRAfgWEE0` (test and live). Support: `brendan@get247roi.com`. Live Customer Portal configuration already exists: `bpc_1UOc2EQZRAfgWEE0fdtzOcgy`. Do not recreate it.

The pre-call page remains `/onboarding`. Paid implementation onboarding is `/payment/onboarding`.

## Environment

Set these on the server only. None of the secrets use a `NEXT_PUBLIC_` name. The site build does not require them; payment routes return 503 until they are present.

| Name | Required | Notes |
| --- | --- | --- |
| `STRIPE_MODE` | yes | `test` or `live` |
| `STRIPE_SECRET_KEY` | yes | `sk_test_`/`rk_test_` in test, `sk_live_`/`rk_live_` in live |
| `STRIPE_WEBHOOK_SECRET` | yes | `whsec_...` for that mode's endpoint |
| `STRIPE_EXPECTED_ACCOUNT_ID` | yes | Must be `acct_1UOPq6QZRAfgWEE0` |
| `PAYMENT_CAPABILITY_SECRET` | yes | At least 32 characters. Signs onboarding tokens and checkout intents |
| `STRIPE_ALLOWED_PRICE_IDS` | no | Comma-separated `price_...` ids. Empty until a price is approved |
| `STRIPE_PORTAL_CONFIGURATION_ID` | no | Live must be `bpc_1UOc2EQZRAfgWEE0fdtzOcgy`. Omit in test, or set a test configuration that is not the live id |
| `PAYMENT_APP_BASE_URL` | no | Defaults to the site URL. Portal return URLs use only this origin |
| `PAYMENT_TRUSTED_PREVIEW_HOSTS` | no | Comma-separated exact `*.vercel.app` hostnames. No wildcards |
| `PAYMENT_NOTIFY_WEBHOOK_URL` | no | Optional notice target. If unset, `CONTACT_TELEGRAM_BOT_TOKEN` and `CONTACT_TELEGRAM_CHAT_ID` may be used by the ops drain. Neither is called from fixtures |
| `NEXT_PUBLIC_SUPABASE_URL` | yes for ledger | Existing project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes for ledger | Or `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_KEY`. Never public |

`PAYMENT_APP_BASE_URL` is read from server env. A preview origin is accepted only when its hostname is listed in `PAYMENT_TRUSTED_PREVIEW_HOSTS`. Request host headers and caller-supplied return URLs are ignored.

There is no in-memory production fallback. If Supabase is not configured, payment routes return 503.

## Migration

File: `supabase/migrations/018_payments_ledger.sql`.

Apply it in the Supabase SQL editor as postgres. It creates the private `payments` schema, fulfillment and event tables, onboarding profiles, and a notification outbox. Webhook dedupe is unique on account, mode, and event id. Fulfillment is unique per checkout session and per payment intent. Session-only and intent-only rows for the same purchase merge under one account-and-mode advisory lock. Contradictory customer, session, intent, or browser-binding pairs are rejected. A recognized payment that is not fully refunded is fulfilled once, including a partial refund that arrives before the paid event. A full refund before payment does not grant fulfillment. Public RPC wrappers are `security invoker` and executable only by `service_role`. Definer functions stay in `payments`.

This migration was not applied to the remote Supabase database. A disposable local PostgreSQL 17 container was used for the regression harness only.

## What the app does

- `POST /api/stripe/webhook` reads the raw body, verifies the Stripe signature, rejects livemode or `event.account` mismatches, and persists through `apply_payment_transition`. Persistence failure returns 500. Duplicate signed deliveries return 200 without a second fulfillment.
- `POST /api/stripe/checkout` starts Checkout only when `STRIPE_ALLOWED_PRICE_IDS` is set, the `Origin` matches `PAYMENT_APP_BASE_URL`, and Stripe reports that price as active, one-time, and in the current mode. The Stripe payload sets `customer_creation` to `always`, `mode` to `payment`, and `expires_at` to 23 hours. Metadata stores an HMAC browser binding, not the nonce. The HttpOnly cookie is a signed credential that reuses the same nonce for later checkouts until it expires (7 days). An empty allowlist returns 503. A different browser still has to email support; there is no email sign-in code.
- Recognized payments are allowlisted one-time line-item prices, or line items whose price matches a server-signed `247roi_paid_onboarding` intent. Subscription checkout is stored as unrecognized with reason `subscription_not_enabled`. Zero-amount, setup, and unknown prices do not onboard.
- `GET /api/stripe/confirmation?session_id=` shows status, mode, test flag, message, and poll. A valid session id alone does not mint an onboarding token. The token is added only when the checkout cookie matches the stored binding. Another browser sees a support message for `brendan@get247roi.com`. There is no email sign-in code.
- `/payment/onboarding` and `POST /api/stripe/portal` check that cookie again. A copied token without the cookie returns 403 and no profile. The form stores business, contact, and implementation notes. Saving writes an outbox row and does not send a notice in the request.
- `POST /api/ops/payments/notify` is the outbox consumer. It requires the existing contact admin bearer secret. Claim returns an unguessable token, increments the attempt, and completion must present that token. A stale worker cannot mark the current lease sent or failed. Eight expired claims abandon the row. It sends only when a webhook URL or the existing Telegram contact env is set. It is not on a scheduler and was not deployed.
- A known session, payment intent, customer, or browser binding is never replaced by a different value. Missing values can be filled. Contradictory events raise `payment_identity_conflict` and are not stored.

## Sandbox

1. Apply the migration to the test database.
2. Set `STRIPE_MODE=test` and the test secret, webhook secret, account id, and capability secret.
3. Add an approved one-time price id to `STRIPE_ALLOWED_PRICE_IDS`. Checkout start writes `purpose`, `price_id`, `intent`, and `browser_binding`.
4. Point a test webhook endpoint at `/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, and `charge.refunded`.
5. Open `/payment/confirmation?session_id=cs_test_...` after a parent-run Checkout. Closing the browser does not skip the webhook write.

## Live promotion

1. Use a live key and a new live webhook secret. Keep `STRIPE_EXPECTED_ACCOUNT_ID=acct_1UOPq6QZRAfgWEE0`.
2. Set `STRIPE_MODE=live` and `STRIPE_PORTAL_CONFIGURATION_ID=bpc_1UOc2EQZRAfgWEE0fdtzOcgy`.
3. Deploy with George. Do not reuse the test webhook secret or the test ledger rows.
4. Confirm a live confirmation page does not show the test-payment banner.

## Rollback

Unset `STRIPE_MODE` or remove the webhook endpoint in Stripe so new events stop. Existing rows stay in `payments`. Dropping `schema payments cascade` deletes the ledger; do that only after an explicit decision to discard payment records. Revert the application deploy to the previous build. No prices were created by this change.

## Verification

In-memory tests cover signatures, account and mode mismatch, browser-cookie binding, leaked session ids, subscription rejection, partial-versus-full refund order, checkout start, and outbox claim. They do not open Stripe or Supabase.

`python3 scripts/stripe-db-regression.py` applies the migration to a throwaway PostgreSQL 17 container with `--network none`, no published ports, and a tmpfs data directory, then removes that container. It does not use the remote database or a Stripe key. The latest local run passed all 11 groups. See the checkpoint for the command result.

Blocked: remote migration, Stripe API calls, an end-to-end card payment, and scheduling the notice drain. A buyer who changes browsers or devices cannot open onboarding from the session id; they need the original browser or email support. Production currently has no Stripe environment variables.
