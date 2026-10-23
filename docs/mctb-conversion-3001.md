# Conversion-focused SMS assistant — (610) 300-3001

Scope: the existing Twilio MCTB line only (`/api/sms/inbound`). Not touched: Telnyx/Vapi (610) 998-7247, provider config, first missed-call text, opt-out wording, voice handling, eligibility, timers, website positioning.

Blueprint: `docs/client-onboarding/mctb-conversion-blueprint.md`.

## What changed
- `src/lib/sms-lead/prompt.ts` (new): pure, exported prompt. `runSmsTurn` sends `buildSmsMessages(history)` exactly, so tests check the real prompt.
  - Knowledge base now matches current public copy: lead capture and follow-up (missed-call text back, new-inquiry response, follow-up and notifications), AI receptionist, booking and reminders, review requests, past-customer follow-up, and custom dashboards, tools, integrations and AI workflows. No audit-first funnel, no prices, guarantees, timelines or results. Public contact is brendan@get247roi.com.
  - Removed the contradiction "anything customer-facing requires human approval". The owner keeps control of binding commercial decisions.
  - Intent map: new inquiry, pricing, ready, objection, support, scheduling, urgent, AI identity, wrong number/withdrawal, unclear. The removed rules were the two-question cap, the forced wrap-up and "Brendan will personally follow up shortly".
  - The only supported sales action is a **callback request** recorded in `summary` (prefixed `CALLBACK REQUEST:`) and sent through the existing `leadReady` owner alert. There is no calendar tool, `/calendar` is the audit page and is not a scheduler, and no links are sent.
- `src/lib/sms-lead/engine.ts`: same exports and contract (`reply`, `leadReady`, `summary`, `urgent`), plus an optional validated `intent`.
  - Deterministic pre-model guard: STOP/HELP keywords get an empty reply. Clear wrong-number and withdrawal messages get a short apology with no question, no sales content and `leadReady=false`.
  - The model call times out after 9 s via AbortController. Configured model env and the `gpt-4o` default are preserved. Upstream error bodies and secrets are never logged.
  - Strict runtime validation: booleans accept only `true` or `"true"`, so `"false"` is false. Intent must be in the enum. The summary is dropped unless `leadReady` is true. A model-labelled withdrawal or wrong number cannot raise an alert.
  - Reply policy filter: replies containing URLs, booking/confirmed claims, "will call you shortly/today…" or "has been notified" are replaced with the fallback.
  - Length: whitespace is normalized, and replies are cut at a sentence end, else a word boundary, never above 480 characters.
  - Fallback is truthful. It identifies the automated assistant, says the message is saved in the thread for review, and makes no callback promise or completion claim. It keeps `leadReady=true` so the existing owner alert still flags the failure for manual review.
- `src/app/api/sms/inbound/route.ts`: unchanged.

## Known limitations
- Opt-out is not durable here. The engine guard covers only the current message, and Twilio's standalone STOP handling remains the actual opt-out mechanism.
- The withdrawal/wrong-number regexes are deliberately narrow. Anything else relies on the model following the prompt.
- Agent/operator collision control and duplicate-inbound protection are unchanged from before.
- Tests use mocked model responses. They prove wiring and contract, not real-model sales quality or conversion.
