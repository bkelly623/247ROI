# Report email access check and honest fallback

## Outcome
No authorized/configured report-email transport was discoverable in the inspected source or inherited deployment configuration. No mail was sent, queued, or claimed delivered. No provider was purchased, auth broadened, environment copied, deployment made, or commit created.

## Read-only evidence
- Inherited `VERCEL_TOKEN` successfully authenticated GET `/v9/projects/247-roi` and GET `/v9/projects/247-roi/env` against api.vercel.com. Confirmed project `247-roi` / `prj_jE413jvq73UCZ8XQhLS38pgvoUTN`. Only environment key names, targets and types were printed; no values were printed or written.
- Returned deployment metadata covered analytics/events, OpenAI/Anthropic, SerpAPI, PageSpeed, public app/scheduling URLs and Supabase server/public keys. No SMTP, Resend, SendGrid, Postmark, report-mail sender, or transactional-mail credential/configuration appeared in returned project environment metadata.
- Local `~/247ROI/.env` key names cover OpenAI, XAI and Supabase public access; `.env.local` names cover DataForSEO and Vercel OIDC. Approved `~/.config/hermes/247-ops-dashboard.env` contains Vercel and Supabase management-token names only. Values were not printed/copied. This is bounded inspected-configuration evidence, not proof that the owner has no email account elsewhere.
- Existing `src/lib/hire/notify.ts` posts `hire_unlock` to an internal lead/Slack/Athena webhook. It is NOT a report-email transport and was not called or repurposed.
- Existing legacy `src/app/api/sessions/[id]/route.ts` reads reports by ID without checking an owner cookie/token. `getSession` likewise selects by ID. Therefore an ID alone cannot safely authorize a new arbitrary-recipient mail endpoint. No security scope was changed.

## Useful fallback supplied
`src/components/audit/ReportEmail.tsx` exports `ReportEmail({ sessionId })` for the parent to mount only after a report has loaded. It honestly says email delivery is unavailable; provides browser Print / Save as PDF; copies a same-origin `/report/{encoded ID}` URL with a native saved-report link fallback; warns that the link should remain private. It collects no email and requests no marketing consent. Print-dialog invocation is never reported as a saved PDF or email success. UI/browser errors are sanitized. It is hidden in print output. Existing report/presentation components were deliberately NOT edited by this task.

## Verification
- `npm run lint -- src/components/audit/ReportEmail.tsx`: passed.
- `node scripts/report-email.test.cjs`: passed. Exercises actual compiled component handlers using offline mocked React state and clipboard/print APIs: unavailable labeling, saved link, clipboard success/failure, private-link notice, print invocation/failure and no email collection. It is not a real-browser/PDF-layout, network, provider, or delivery test.
- `git diff --check`: passed at verification. Other agents' working-tree changes were not edited.

## Exact requirements to enable real requested email
1. Explicit owner-approved existing transactional provider or documented email-delivery webhook contract; verified sender/from/reply-to; server-only provisioned credentials; delivery receipt/readback or authenticated signed event contract. Existing management tokens are not mail-sending credentials.
2. Existing-report ownership verification or scoped short-lived signed report capability before sending. Server must retrieve the stored report and generate its allowlisted canonical saved-report URL; never accept arbitrary HTML/subject/sender/URL from clients. Current legacy ID-only GET access is insufficient to authorize a mail relay.
3. Explicit user email request, separate from marketing; recipient validation; durable per-IP/report/recipient admission limits/cooldown and idempotent outbox; bounded transport timeout; no blind retry after an uncertain send.
4. Distinguish queued, provider accepted, delivered and bounced with verified receipt/readback. An authorized test recipient and real delivery readback for each audit type are still required. No arbitrary real recipients may be used for testing.

No placeholder sending endpoint or speculative transport backend was added. Rate limiting and receipt verification are prerequisites, not falsely reported as implemented when there is no transport.
