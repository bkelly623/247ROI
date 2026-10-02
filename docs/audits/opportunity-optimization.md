# Opportunity audit optimization — execution record

Started 2026-10-01. User authorized unattended implementation, repeated review, and completion. Worktree: /tmp/247roi-opportunity-optimized, release/opportunity-optimization. Baseline origin/main 0ff8735 (preserves newer SMS changes). No visibility collection or funnel separation work.

## Ordered stages and acceptance
1. Diagnose and repair discovery: concise opening with answer box immediately visible, optional relevant quick replies, recognize already-supplied facts, bounded provider timeout, preserve draft/retry and resume, grounded 70–90% task benchmark without default hours. Preserve world → burden → relief → confirm → recommendation → next step.
2. Deliver value: confirmation/editable discovery, ungated short visual report, optional full detail, truthful unknowns/no-build outcome, saved link/PDF/email-compose (not falsely claimed sent), clear optional consultation.
3. Review/iterate: unit + HTTP + browser journeys on mobile/desktop, provider error and persistence failure, live model when configured, screenshots visually inspected, actual PDF text/page checks, no overflow/contact leakage; repair all observed regressions.
4. Release after acceptance: scoped build/lint, commit/push, verify remote SHA and Vercel production, live smoke. Record artifacts and remaining uncertainty honestly. Conversion/product perfection cannot be certified without owner/user tests.

## Baseline findings
- Main conversation has multiple duplicate promotional blocks above the input, 6 large triage cards, and long model instructions forcing extra narration every turn.
- Model request has no deadline; malformed schema returns prose without saving new discovery. UI ignores existing choices, discards failed draft, and creates a new session on every refresh.
- Mandatory contact gate before report; gate API trusts client proposals/discovery and unlocked GET leaks contact fields/transcript.
- Persistence silently falls back to volatile memory even in production.
- Default 8 task hours / min 1-hour saving / min +1 high bound fabricates unknown and tiny savings. Report lacks caveat, short view, export, and metric.
- Existing shared entrance retains visibility first per explicit prior scope exclusion. Not separating the audits.

## Implementation checkpoint
Implemented concise discovery and optional quick replies; guided recovery for provider failures; owner-editable confirmation; ungated short/full plan; grounded estimates with explicit unknown/no-build outcomes; local draft + saved-link resumption; request receipts and optimistic revision checks; contact-field redaction; fail-closed production persistence; print/PDF and user-sent email-link actions. Shared visibility-first intake remains unchanged.

Initial `npm run build` compiled/typechecked/generated 81 routes; output `/tmp/opportunity-build.log` (subsequently reused for second build). Scoped ESLint passed. Expanded `npx --no-install tsx scripts/hire-optimization.test.ts` passed 8 groups: estimates, units/no-build, model schema/corrections, guided/rich journeys, provider failure, durable-storage policy/retries/input bounds, server-only finalization/privacy, revision guards. These are local automated checks, NOT browser or live-model acceptance.

Second build/start process: `proc_df203fa77eb3`, requested local 3597 with explicit QA-only volatile storage. Verify process/build provenance before further testing. Browser test source: `scripts/hire-browser.test.ts` (real local HTTP guided flow, not browser-fixture-only); not executed yet. Updated entry regression expectations for inherited SMS fields, not new entry behavior.

Release credential discovery: inherited ops Vercel token returned HTTP 403 and Supabase management token HTTP 401. Existing Vercel CLI authentication DID successfully read project metadata and env metadata; project `prj_jE413jvq73UCZ8XQhLS38pgvoUTN`, team `team_NB981ddsKAGTAJtm4O1A14X1`. Production/preview OPENAI and Supabase service variables exist, type sensitive; no SMTP/Resend/SendGrid metadata found. Metadata does not prove valid live integration. No secret values were printed or committed. Email action explicitly opens the user's email app; no automated email delivery claim.

## Review loop (approval resumed)
Fresh user approval resumed browser verification. The correct 3597 app and all referenced chunks returned 200. First complete real-HTTP guided browser journeys passed on 390px and 1280px, including failed-response-after-server-save replay without duplication, refresh/draft recovery, edited hours, ungated finalization, saved reopen, copy/email-compose/print actions, full detail and new-session creation.

Review found and repaired:
- Test waited for an absent textarea as if it were enabled; now requires the actual enabled element. Entry test exact-text assertion also needed to account for accessible speaker labels.
- Competing site-wide chat widget distracted from the audit; hidden on Opportunity paths only.
- Live gpt-4o-mini returned object-valued notes despite instructions; replaced unconstrained JSON with a strict provider JSON schema. Invalid output still falls back without displaying unsaved facts.
- Actual unknown-hours input caused repeated hours questions. Deterministic owner controls now preserve explicit unknown/skip choices regardless of model omission.
- Actual model labeled clinical diagnosis automatable. Server-side clinical/judgment guard now prevents a savings estimate or autonomous-treatment recommendation even if the model mislabels it.
- Same-origin check rejected legitimate browser requests because Next's internal URL used localhost; validation now compares the actual Host. Regression reproduced with/without browser Origin before repair.
- Print selector escaping discarded the whole nav-hiding rule. Replaced with a valid attribute selector. A separate 100vh body minimum created a blank second PDF page; a direct CSS probe verified the height override produces a single nonblank short PDF. Final built PDF retest pending below.
- Review confirmation now scrolls into view, respecting reduced-motion preferences.

Live-model acceptance: `scripts/hire-model.test.ts` passed short answers (5 turns), rich roofing (1), explicitly unknown hours (1), clinical human-judgment case (1). Latest observed turn durations: 2,729/2,482/2,112/2,390/2,507 ms for short answers; 4,250/2,962/2,309 ms for the other cases. These are synthetic test scenarios with REAL provider responses, not customer outcomes. Artifacts `/tmp/opportunity-model-qa/{short-answers,rich-roofing,unknown-hours,human-judgment}.json`. Provider captures contain synthetic inputs only; no keys/headers.

Vercel CLI authentication refresh via supported `vercel whoami` restored access when its short-lived token expired. Preview is protected; use `vercel curl --deployment` with its supported automatic authentication rather than weakening protection. No automatic email transport is configured; the implemented Email link deliberately uses the owner's email app.

## Local acceptance — passed
- Final production build succeeded (`/tmp/opportunity-build-final.log`); scoped ESLint and `git diff --check` passed. Only unrelated baseline build warnings remain.
- `hire-optimization.test.ts`: all 8 test groups passed; `visibility-handoff.test.ts` passed with retained evidence and zero network.
- `hire-browser.test.ts`: both 390px and 1280px passed against real local Next HTTP routes with explicitly QA-only memory and provider fallback. `audit-entry-browser.test.ts`: both widths passed with mocked visibility intake (no paid scan or SMS sent).
- `/tmp/opportunity-qa/results.json` contains two verified browser results. Screenshots `opening-{390,1280}.png`, `confirmation-{390,1280}.png`, `report-short-{390,1280}.png`, `report-full-{390,1280}.png` were produced. Mobile opening/report and desktop report were visually inspected, not only measured for overflow.
- Actual final PDF exports: `/tmp/opportunity-qa/short.pdf` **1 page**, 1,217 text characters; `/tmp/opportunity-qa/full.pdf` **2 pages**, 1,104/1,029 characters. All pages contain text; range and caveat preserved. Results `/tmp/opportunity-qa/pdf-results.json`. Final short PDF raster visually inspected: readable, no navbar/chat overlay or clipping.
- Latest production source is preserved: fetched origin/main still matches baseline. Shared entry/SMS behavior was not redesigned.

Current state: local acceptance complete; cloud preview/durable production integration and release verification next. No live-completion claim yet. Email means user-sent email-compose, not backend delivery. These tests establish implemented behavior, not conversion improvement or a universal “maximum potential.”
