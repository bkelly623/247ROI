# Client-readiness release

## Scope
Owner authorized implementing the site-readiness recommendations: reliable inquiries, clean published copy, two balanced service lanes, useful demonstrations and a 3001 text-back demo path. Preserve established navbar, homepage H1 and overall identity. No audit collection or audit optimization.

## Implemented
- Contact: validate → save full inquiry/consent/attribution in private Supabase Storage → read back → notify owner via Telegram → save provider receipt. Stable submission IDs avoid duplicate records/notifications on ordinary retries. Failed alerts remain in the outbox. Failed saves return 503, never a success screen. Optional SMS consent stays optional; contact submission does not automatically send a text.
- Protected `/api/ops/inquiries`: health, exact-reference owner readback and pending-alert retry. Owner secret is server-only. Five-minute retry worker uses a user systemd timer, not another agent. Active Hermes profile stores private credentials outside the repository. Owner user has lingering enabled.
- Legacy `/intake` now redirects to the complete contact form; legacy API fails explicitly instead of claiming delivery of a contact-less intake.
- Removed published keyword briefs and internal editorial instructions; rewrote contractor bid-intake guidance for customers. Calculator results and examples are explicitly hypothetical. Removed unconfirmed receptionist trial copy and absolute answering claims.
- Equal lead-capture/custom-software service paths; missed-call text-back page; expanded receptionist page; direct contact paths rather than obligatory audit detours. Navbar and main headline retained.
- Working browser-only sample dashboard and approval flow, explicitly fictional and not an AI/CRM integration or client case study. Practical text-back versus AI-receptionist guide.
- Shorter, readable footer; corrected marketing-button contrast; checked footer destinations. Preserved existing page URLs.
- First-touch campaign/source retention, lane/demo events and saved-inquiry tracking; blocked browser storage must not break submissions.
- Twilio voice/SMS callbacks now require valid provider signatures. Forwarding destination is validated before generating XML. Existing approved messaging campaign/content was not changed.

## Verification before publication
- Production build and scoped ESLint passed during review. Final acceptance rerun required for final revision.
- 53 sitemap URLs passed rendered-copy checks; browser journeys checked at 360/390/768/1280px, including both lanes, footer links, interactive demo, form failure/retry and attribution.
- Main/footer axe WCAG A/AA checks passed on five key pages (not a full-site accessibility certification; preserved navbar excluded).
- Real cloud preview inquiry saved and read back, including full message and consent. Telegram exact content verified via provider; retry reused the same receipt and did not send again. QA fixture only, not a customer lead.
- Provider/storage failure, rate limiting, idempotency and signed/unsigned webhook behavior exercised with explicit unit fixtures. No test SMS sent.
- First cloud save test failed on a missing-object read. Replaced ambiguous SDK missing-object handling with an explicit existence check; real save/readback then passed.

## Remaining external verification
- 3001 has verified Twilio campaign registration and a later delivered outbound message. The historical missed-call reply was undelivered before registration. A fresh missed-call-to-handset test remains unverified. Public copy offers arranging a demonstration, not a falsely verified automated demo. Registration use-case coverage for missed-call replies must not be assumed from a VERIFIED status alone.
- No special price/usage/commitment terms invented. No claim of client outcomes or a winning acquisition lane.
- Real public and valid-anonymous-key storage reads of the saved QA inquiry were denied. Production deployment and retry timer activation/readback are pending publication at this checkpoint.

## Operations
Worktree: `/tmp/247roi-client-ready`, branch `release/site-client-readiness`.
QA: `/tmp/247roi-client-ready-qa/`.
Verified functional preview: `https://247-bbh7t0wqo-b-kellys-projects.vercel.app` (final marketing microcopy/attribution follows in release).
Private worker config and script: active profile `workspace/website-ops/contact-delivery.env` (0600), `retry-inquiries.py`.
Timer: `247roi-inquiry-retry.timer`; immediate notification does not depend on VM availability, retry does.
Storage: private `website-inquiries` bucket, `submissions/`, `receipts/`, short-lived `locks/`, hourly `limits/`. At-least-once notification semantics: a crash after provider acceptance but before receipt persistence may cause a repeated alert with the same reference. No claim of exactly-once delivery.
