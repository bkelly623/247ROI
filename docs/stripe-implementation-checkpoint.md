# Stripe implementation checkpoint

Session: `f6156e97-e3f5-4754-9e92-16ecf6453801`

Worktree: `/tmp/247roi-stripe-payment`. No deploy, push, remote database write, secret, or host-listening server.

## Fixes in this pass

- Outbox completion requires the claim token returned by `claim_payment_notifications`. Attempts increment on claim, not again on completion. A stale token does not change the current lease or sent status. The unfenced `(text, timestamptz, text)` mark function is dropped on migration apply. Eight expired claims abandon the row.
- Incoming session, payment intent, customer, and browser binding values cannot replace a different known value. Missing values can be filled. Conflicts raise `payment_identity_conflict` and do not store the event. The memory ledger uses the same rule, including a split-row merge.
- The checkout cookie is a signed browser credential. A valid cookie reuses its nonce for another checkout and is refreshed without rotating that nonce. Unsigned or expired cookies are rejected. Lifetime is 7 days. Checkout `expires_at` is explicit at 23 hours, inside Stripe's 24-hour maximum. The nonce is not in Checkout metadata; the HMAC binding is.
- One-time Checkout creation sets `customer_creation: "always"`. Tests assert that payload. No Stripe API call was made.

Same-browser onboarding works until the credential expires. A different browser or device still has to email `brendan@get247roi.com`. There is no email sign-in code.

## Executed

- `/tmp/247roi-vercel-cache/_npx/83bd54333fc77407/node_modules/.bin/tsx scripts/stripe-payment.test.ts` — passed (`stripe-payment tests passed`). In-memory fixtures only.
- `npx eslint src/lib/payments src/app/api/stripe src/app/api/ops/payments src/app/payment scripts/stripe-payment.test.ts` — exit 0.
- `npx next build` — first run failed typecheck on a stale `ignore` comparison in `ledger.ts` (exit 1). After that comparison was removed, the rerun exited 0. Existing unused-var warnings in audit files were unchanged. The server was not started.
- `python3 scripts/stripe-db-regression.py` — disposable PostgreSQL 17.11 (`postgres:17-alpine`, `--network none`, no published ports, tmpfs). All 13 groups passed, including `notification_lease_fence` and `incoming_identity_conflict`. Container `george-stripe-db-3d282c28c902` was removed (`docker inspect` exit 1, no such object). Migration SHA-256 `a884ba0d76c09e69acd1adace2ae0060386651436ad95c632294de7f1eba9426`. This was not the remote database and not Stripe.

## Still blocked

- No Stripe server key in this worktree, so Checkout creation, webhooks, and the portal were not executed against Stripe.
- Migration `018_payments_ledger.sql` is not applied to the remote Supabase project.
- `POST /api/ops/payments/notify` is not scheduled and was not deployed.
- Cross-device recovery is support email only.
