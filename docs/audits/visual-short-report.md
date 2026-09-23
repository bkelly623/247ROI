# Visual short report — release verification

Release worktree: `/tmp/247roi-visual-release`, branch `release/visual-report`, created from freshly fetched origin/main (8b33247), fast-forwarded through reviewed stage3/stage4 commits, then adopted scoped saved visual changes. Original worktree and untracked lock/task files preserved.

## Scope and known limits
Distinct short/full saved views, view-preserving links and PDF actions. Evidence-led visual shortlist plus separate proposed expansion. First-page goals explicitly are not forecasts. Correct missing/failed evidence, positive ranked results without hits, safe legacy URL parsing, no invented traffic/ROI or ranking guarantees. Chart is a regional benchmark, not business-specific traffic, and includes search referrals rather than proven organic-only visits. SEO precedes AI statically. Email and lazy explanatory generation remain unavailable. New public direct-rank collection remains disabled; existing authorized budgets were not changed. No fresh paid calls during release acceptance.

## Verified on exact release source
- `npm run build`: PASS (compile, source lint, types, all static pages), `/tmp/visual-release-build.log`. Existing unused-variable warnings only.
- Regression PASS: audit-visual-brief, audit-stage3, audit-report-ux, report-presentation, traffic-mix, visibility-handoff, audit-reliability.
- Scoped ESLint and git diff --check: PASS.
- Identified preview: new release worktree, port3497, process proc_cc5e10423dd2. 247ROI HTML confirmed, all 13 referenced script chunks HTTP200 and matched on-disk release build. No stale/shared port3397 reliance; unrelated port3297 untouched.
- `AUDIT_BASE=http://127.0.0.1:3497 STAGE4_OUTPUT_DIR=/tmp/visual-release-qa npx --no-install tsx scripts/audit-stage4-browser.test.ts`: PASS. Four primary route/width combinations, both views, copy/fallback, print action, reload, zero collection requests and page errors; legacy/empty mobile cases included. Actual retained evidence via offline intercepted session API.
- `AUDIT_BASE=http://127.0.0.1:3497 npx --no-install tsx scripts/audit-entry-browser.test.ts`: PASS both widths for visibility-first, optional skip, refresh, report return and scan handoff; offline API fixtures.
- Screenshots and results: `/tmp/visual-release-qa/`. Mobile top visually inspected with no overlap/clipping. Brief remains a long mobile scroll; visual appeal/conversion are owner acceptance, not assertions implied by automated checks.
- Real Chromium exports: short.pdf 4 pages; full.pdf 23 pages, all pages with nonempty extracted text, parsed using PyMuPDF. First-page renders stored alongside PDFs.

## Production prerequisite
Applied only additive migration017: nullable `public.scan_sessions.audit_context jsonb`. Existing approved Supabase project ytdufsxqywkvtnpyetco. Before: column absent; after SQL readback: jsonb, nullable YES. No reports, provider budgets or credentials changed.

## Historical checks not release claims
Prior continuation had overlapping writers/builds and stale-preview uncertainty. This isolated release supersedes that uncertainty. Historical full repository ESLint has nine unrelated script errors; no claim of whole-repo lint success. Measurement-coverage test requires its specific historical timeout fixture and was not included in this release acceptance. Production deployment/readback evidence is recorded separately after push.
