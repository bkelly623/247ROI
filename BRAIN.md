# 247ROI Website — Project Brain

Single source of truth for the `247ROI` marketing site.  
Use this file first whenever continuity is lost.

---

## 1) What this project is

- Repo folder: `247ROI`
- Stack: Next.js App Router (v15), React, Tailwind, Framer Motion, shadcn-style UI
- Purpose: premium conversion site for AI receptionist + automation services
- Design language: dark/glassmorphism with high-contrast gradients, motion, and card-driven sections

This codebase is a close derivative of `automagixx-website`, but now has independent branding and funnel structure.

---

## 2) Transition history (important)

247ROI started as a rebrand/fork of the Automagixx site (which itself drew visual structure from the agency-flow showcase pattern).  
The transition intent was:

- Keep proven UX patterns, visual system, and technical architecture
- Reframe messaging from "Automagixx" to "247ROI"
- Emphasize "ROI around the clock" over "magic/agency" language
- Tighten homepage into a direct funnel

Current reality:

- 247ROI has diverged significantly in homepage structure and messaging
- A dedicated `/services` page now exists
- Some integration details (notably GHL inline voice widget behavior) are still in-progress

---

## 3) Canonical brand, offer, and voice

### Brand
- Name: **247ROI**
- Promise: captured revenue 24/7 (calls answered, leads captured, follow-up automated)

### Core offer hierarchy
1. **AI Receptionist** (primary)
2. Review Generation
3. Web Design
4. Automation

### Voice guardrails
- Clear, high-conviction, premium
- Revenue-centric but not hypey
- Avoid generic agency filler and mixed-brand references to Automagixx

---

## 4) Canonical contact constants (must stay consistent)

Defined in `src/app/components/cta.ts` and reused across components/routes.

- Primary business phone: `(917) 572-7734` (`tel:+19175727734`)
- Demo line: `(484) 673-7612` (`tel:+14846737612`)
- Email currently used in UI: `contact@247roi.com`

Rule: do not mix primary/demo roles when editing CTAs or chat fallbacks.

---

## 5) Current site map and key files

### Entrypoints
- Home route: `src/app/page.tsx` -> `src/components/HomePage.tsx`
- Services route: `src/app/services/page.tsx` -> `src/components/ServicesPage.tsx`

### Homepage (`HomePage.tsx`) current funnel order
1. `Navbar`
2. `Hero`
3. `FreeAuditSection` (missed-call calculator section directly below hero)
4. `WhatThisDoes`
5. `WhereItWorks`
6. `CTA`
7. `Footer`

### Main conversion/support components
- `src/components/Hero.tsx`
- `src/components/FreeAuditSection.tsx`
- `src/components/WhatThisDoes.tsx`
- `src/components/WhereItWorks.tsx`
- `src/components/CTA.tsx`
- `src/components/TestDriveLink.tsx`
- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`

### Services page
- `src/components/ServicesPage.tsx`
  - Featured "AI Receptionist" block (strong visual emphasis)
  - Other services cards (Review Generation, Web Design, Automation)
  - Reuses global `CTA` + `Footer`

### Other key routes
- `/calendar` (booking embed)
- `/missed-call-calculator`
- `/guarantee`
- `/privacy-policy`
- `/terms-of-service`
- `/intake`, `/onboarding`
- `/dashboard`, `/dashboard/analytics`

---

## 6) What has been completed recently

### Funnel restructure on homepage
- Removed Services/Features sections from homepage composition (files kept on disk)
- Added `WhatThisDoes` card section
- Added `WhereItWorks` channel card section
- Kept premium visual quality and card styling patterns
- Updated nav/footer links to fit new flow
- Updated primary CTA copy to: **"Try This On Your Business (Free)"**

### New services page
- Created `/services` route and dedicated page layout
- Migrated service content off homepage to this page
- AI Receptionist elevated as primary focus with stronger presentation
- Other services remain card-based and stylistically consistent

### Hero right-side voice/chat update (current state)
- Added global `LeadConnectorVoiceScript` (layout) + hero `LeadConnectorVoiceLauncher` for the GHL Voice AI demo card
- Loader script currently used:
  - `https://widgets.leadconnectorhq.com/loader.js`
  - `data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"`
  - `data-widget-id="69e7826129e846f2447559ff"`
- Current behavior is launcher-oriented (opens/targets widget), not guaranteed true inline embed rendering

---

## 7) Known open issues / risks

### A) Inline voice widget in Hero not fully solved
Goal: true embedded inline widget on hero-right while separate floating widget remains global.

Current blocker hypothesis:
- GHL widget domain/website target may still be tied to `automagixx.com`
- Loader snippet may represent floating chat launcher mode, not inline embed mode

Needed resolution:
1. In GHL, update allowed domain(s) to include active 247ROI environment(s)
2. Obtain correct **inline embed** install code (if different from floating loader)
3. Mount inline embed inside hero-right container; keep existing floating widget separate

### B) Potential stale brand traces
- Because 247ROI was forked, verify no remaining "Automagixx" copy/URLs in live-critical flows

### C) Operational validation
- Ensure form/email endpoints and inboxes are fully live for `contact@247roi.com`
- Re-check legal/domain references for final production domain

---

## 8) Working rules for future edits

1. Preserve premium visual language: glass cards, gradients, subtle motion, spacing discipline
2. Reuse existing components/styles before inventing new patterns
3. Keep homepage tight; route secondary detail to `/services` or dedicated pages
4. Maintain CTA consistency:
   - Primary CTA label: "Try This On Your Business (Free)"
   - `TestDriveLink` behavior remains intentional across desktop/mobile
5. Keep nav anchors and route links coherent (`/#...` vs `#...`) across pages

---

## 9) Quick "resume work" checklist

When asked to continue this project, do this first:

1. Read this `BRAIN.md`
2. Read:
   - `src/components/HomePage.tsx`
   - `src/components/Hero.tsx`
   - `src/components/LeadConnectorVoiceScript.tsx`
   - `src/components/LeadConnectorVoiceLauncher.tsx`
   - `src/components/ServicesPage.tsx`
   - `src/components/Navbar.tsx`
   - `src/components/CTA.tsx`
3. Confirm widget behavior in browser:
   - Inline in hero-right?
   - Floating chat still independent?
4. Run quality checks:
   - `npm run lint`
   - `npm run build`

---

## 10) Definition of done (near-term)

Project is in a strong state once:

- Hero-right contains a verified **inline** Voice AI/GHL experience
- Floating chat remains separate/global
- No Automagixx references remain in user-facing 247ROI flows
- CTA/contact/legal/domain details are production-correct
- Lint/build pass cleanly

---

Last updated: 2026-04-21 (post-funnel restructure, `/services` creation, and first-pass LeadConnector hero integration).
