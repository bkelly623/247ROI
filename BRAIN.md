# 247ROI Website — Project Brain

**Single source of truth** for the `247ROI` marketing site. Read this first when continuity is lost or a new session starts.

---

## 1) What this project is

| Item | Detail |
|------|--------|
| **Folder** | `247ROI` (GitHub: `bkelly623/247ROI`, branch `main`) |
| **Stack** | Next.js 15 (App Router), React, Tailwind, Framer Motion, shadcn-style UI (`src/components/ui`) |
| **Purpose** | High-conversion marketing site: AI receptionist + automation; revenue / ROI framing |
| **Visual system** | Dark theme, glassmorphism, gradients, glow — **do not simplify or strip** unless explicitly requested |

**Lineage:** Forked / rebranded from **Automagixx** (`automagixx-website`–style codebase + agency-flow showcase roots). Messaging and URLs should be **247ROI-first**; replace leftover Automagixx references where they affect trust or domains.

---

## 2) Canonical contacts & constants

**Source of truth:** `src/app/components/cta.ts`

| Role | Display | Notes |
|------|---------|--------|
| **Primary business** | `(917) 572-7734` | `PRIMARY_PHONE_HREF` — main CTA phone line |
| **Demo line** | `(484) 673-7612` | Demo / `TestDriveLink` mobile dial behavior |
| **Email (UI)** | `contact@247roi.com` | Confirm inbox + FormSubmit when domain is live |

Do **not** swap primary vs demo numbers across components or `/api/chat` fallbacks.

---

## 3) Homepage funnel (current — ground truth)

**File:** `src/app/page.tsx` → `src/components/HomePage.tsx`

**Section order (top → bottom):**

1. **`Navbar`** — links include `/#free-audit`, `/services`, `/#what-it-does`, `/#where-it-works`, `#contact`; primary nav button uses `TestDriveLink` (“Try This On Your Business (Free)”).
2. **`Hero`** — **primary conversion surface** (see §4).
3. **`FreeAuditSection`** — missed-call calculator (`#free-audit`).
4. **`WhatThisDoes`** — five capability cards (`#what-it-does`).
5. **`WhereItWorks`** — channel cards (`#where-it-works`).
6. **`CTA`** — `#contact`; glass card; **“Try This On Your Business (Free)”** via `TestDriveLink` (different from Hero primary — intentional secondary conversion block).
7. **`HomeSetupCallSection`** — **10-minute setup call** booking embed (`#book-call`). **Scroll anchor is on the calendar card wrapper** (top of iframe block), not the headline above it.
8. **`Footer`**

**Intent:** Land → interact with AI in hero → calculator + proof sections → optional `CTA` block → **book call** at `#book-call`.

---

## 4) Hero — behavior & files

**File:** `src/components/Hero.tsx`

| Element | Behavior |
|---------|----------|
| **Primary button** | **“Talk to the AI Receptionist”** — does **not** navigate away; **smooth-scrolls** to `#voice-demo`, temporary **spotlight** on the voice card, **mic pulse** animation on the launcher area, short **“Tap the mic to start”** hint. |
| **Secondary text link** | **“Or book a 10-minute setup call”** — smooth-scroll to `#book-call`. **Centered under the primary button** (grouped in a column with `items-center`). |
| **Voice card** | `#voice-demo`, `scroll-mt-28`; premium dark card + glow (unchanged design language). |
| **GHL script** | Loaded **only in Hero** via `next/script` + constants in `src/lib/ghlVoiceWidget.ts` (`loader.js`, `data-resources-url`, `data-widget-id`). |

**Supporting components:**

- **`src/components/LeadConnectorInHero.tsx`** — After GHL injects its UI (often **fixed bottom-right**, which *reads* like “footer” when scrolled), this **moves** the detected launcher root into **`#gcl-launcher-slot`** inside the hero card so the demo **reads as in-card**. Uses `MutationObserver` + heuristics (skips `[data-247roi-site-chat]`).
- **`src/components/LeadConnectorVoiceLauncher.tsx`** — Fallback **custom** launcher + `tryOpenLeadConnectorVoiceWidget()` if the slot is still empty after ~8s. **Must not** click the 247ROI site chat (`[data-247roi-site-chat]`). Prefer GHL-specific selectors first.

**Site chat (separate product):**

- **`src/app/components/ChatWidget.tsx`** — Global floating chat; root has **`data-247roi-site-chat="true"`** so GHL “open chat” heuristics do not target it.

---

## 5) Booking / hash routing

- **`HomeSetupCallSection.tsx`** — Embeds **GHL/LeadConnector–style** booking via `links.automagixx.com` (iframe + `form_embed.js`). **TODO long-term:** point embeds to 247ROI-branded links when available.
- **`#book-call`** — On the **outer wrapper of the calendar card** (first pixel users should see when scrolling to “book”).
- **`src/components/HashBookingRedirect.tsx`** (imported in `providers.tsx`) — On `/`, **`/#book-call` scrolls** to the element; **does not** redirect to `/calendar` (legacy behavior removed).
- **`src/lib/openBooking.ts`** — `BOOKING_HASH` / comments updated for inline section; `requestOpenBooking()` still exists if something needs full-page `/calendar`.

**Footer:** “Book a call” → **`/#book-call`**.

---

## 6) Services page

- **Route:** `/services` → `src/app/services/page.tsx` → `src/components/ServicesPage.tsx`
- **Content:** AI Receptionist (featured) + Review Generation, Web Design, Automation (cards). Legacy **`Services.tsx`** may still exist on disk; homepage does not import it.

---

## 7) Other notable routes

| Path | Role |
|------|------|
| `/calendar` | Full-page booking (separate from homepage embed) |
| `/missed-call-calculator` | Standalone calculator |
| `/guarantee`, `/privacy-policy`, `/terms-of-service` | Legal |
| `/intake`, `/onboarding` | Forms / flows |
| `/api/chat`, `/api/intake` | Server routes |
| `/dashboard`, `/dashboard/analytics` | Internal |
| `/test-chatbot` | Legacy embed test page |

---

## 8) What’s done (major milestones)

- Homepage funnel: **WhatThisDoes**, **WhereItWorks**; Services/Features **removed from homepage composition** (files not necessarily deleted).
- **`/services`** page with moved service content + featured AI Receptionist.
- **Hero** repositioned as **AI-first**: scroll-based primary CTA, secondary link to **`#book-call`**, voice card + GHL script + **relocate-to-slot** behavior.
- **Home setup call** section at end of homepage with iframe + SMS disclaimer pattern.
- **Vercel build fix:** Lucide icon compatibility (`MessageSquareDot` vs removed `MessageSquareAudio`).
- **Git:** `main` tracks `origin/main` (verify latest commit on GitHub if deploy lags).

---

## 9) What’s left to do (prioritized)

### A) GHL / LeadConnector (highest uncertainty)

1. **Domain allowlist** — In GoHighLevel, ensure **production + preview + localhost** URLs are allowed for the Voice AI / chat widget (if still tied to `automagixx.com`, behavior may fail or look wrong).
2. **True inline embed** — If GHL provides a **dedicated inline** snippet (vs floating loader), replace or supplement `loader.js` so the experience is **officially** inline; our DOM move is a **best-effort** workaround.
3. **Booking URLs** — Replace `links.automagixx.com` embeds with **247ROI** equivalents when the subaccount/links exist.

### B) Content & brand audit

- Sweep user-facing copy for **Automagixx** / wrong domains / wrong emails.
- Align **`TestDriveLink`** / demo behavior with product decisions (Hero vs nav vs bottom `CTA` — three entry points is intentional but should stay coherent).

### C) Ops

- Confirm **`contact@247roi.com`** (or production email) for forms and deliverability.
- Vercel: confirm project ↔ repo ↔ branch; **Redeploy** if webhooks miss.

### D) Optional polish

- If **`LeadConnectorInHero`** ever conflicts with GHL DOM updates (shadow DOM, new class names), adjust selectors or fall back to GHL-supported inline embed only.
- **`test-chatbot`** still references legacy automagixx embed — update or remove when obsolete.

---

## 10) Working rules for future edits

1. **Preserve** glass/gradient/glow/spacing quality — no “simplified” UI unless asked.
2. **Reuse** existing patterns (`BookingSmsDisclaimer`, card shells, `scroll-mt-28` for fixed nav).
3. **Hero primary** = scroll + demo in **`#voice-demo`**; **booking** = **`#book-call`** on the **calendar card**.
4. **Do not** confuse **GHL Voice** launcher with **`ChatWidget`** — exclusion relies on `data-247roi-site-chat`.
5. After material changes: **`npm run lint`** and **`npm run build`**.

---

## 11) Resume checklist (next session)

1. Read this **`BRAIN.md`**.
2. Skim **`HomePage.tsx`**, **`Hero.tsx`**, **`LeadConnectorInHero.tsx`**, **`HomeSetupCallSection.tsx`**, **`HashBookingRedirect.tsx`**.
3. In browser: Hero CTA → voice card; secondary + footer → **`#book-call`** lands on **calendar card**; GHL UI **in hero slot** (not stuck bottom-right).
4. Run **`npm run lint`** && **`npm run build`**.

---

*Last updated: homepage funnel + GHL relocate + `#book-call` anchor on calendar card + brain refresh for session handoff.*
