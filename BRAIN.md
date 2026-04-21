# 247ROI Website — Project Brain

**Single source of truth for the `247ROI` marketing site** (forked from the Automagixx codebase / agency-flow template).

## Positioning

- **Brand:** 247ROI  
- **Angle:** Revenue and ROI **24/7** — including **while you sleep** — not “magic” framing.  
- **Offer:** AI reception, lead capture, follow-up, reviews — same technical stack as the sister site, different story.

## Canonical contacts

- **Primary phone / call-text:** `(917) 572-7734` → `tel:+19175727734` — `src/app/components/cta.ts`  
- **Demo line:** `(484) 673-7612` → `tel:+14846737612`  
- **Email (placeholder):** `contact@247roi.com` — update FormSubmit + inbox when domain is live.  
- **Domain (placeholder):** `https://247roi.com` in legal pages.

## Key paths

- Homepage: `src/components/HomePage.tsx`  
- Calendar: `/calendar` — full-page GHL embed (`BookingEmbed.tsx`)  
- Legal: `/privacy-policy`, `/terms-of-service`  
- Intake posts to FormSubmit `contact@247roi.com` — **confirm** endpoint after email exists.

## Deploy

- New Vercel project recommended; set env vars (`OPENAI_API_KEY`, etc.).  
- `test-chatbot` page may still point at a legacy embed URL — replace when a 247ROI-specific embed exists.
