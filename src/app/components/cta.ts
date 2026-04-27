/** Full-page scheduling (LeadConnector embed). */
export const CALENDAR_PATH = "/calendar";

/** @deprecated Old modal hash. Homepage `/#book-call` redirects to `CALENDAR_PATH`. */
export const BOOKING_ANCHOR = "#book-call";

/** Primary business line — navbar, footer, “contact the business”. */
export const PRIMARY_PHONE_HREF = "tel:+19175727734";
export const PRIMARY_PHONE_DISPLAY = "(917) 572-7734";

/** AI receptionist demo line — “Call Our AI Receptionist Now” and Pam CTAs. */
export const AI_RECEPTIONIST_CTA_PHONE_HREF = "tel:+18663602529";
export const AI_RECEPTIONIST_CTA_PHONE_DISPLAY = "(866) 360-2529";

/** Live demo line — every demo reference. */
export const DEMO_PHONE_HREF = "tel:+14846737612";
export const DEMO_PHONE_DISPLAY = "(484) 673-7612";

export const CTA_LABEL_NAV = "Book a Setup Call";
export const HERO_PRIMARY_CTA_LABEL = "Call Our AI Receptionist Now";

/** Under-CTA booking link — must read as a real hyperlink (shared class). */
export const BOOK_SETUP_CALL_LINK_CLASSNAME =
  "inline-block text-sm font-semibold text-primary underline underline-offset-4 decoration-2 decoration-primary/80 hover:decoration-primary hover:text-primary/90 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm";

/** “Your business line” card (e.g. services) — not the AI demo number. */
export const BUSINESS_LINE_CTA_LABEL = "Call Us Now";
export const DEMO_CTA_LABEL = "Try the Live Demo";
export const DEMO_CARD_BUTTON_LABEL = "Try the Demo";

export const CTA_MICRO = "Includes a 30-day performance guarantee.";
export const DEMO_SUBTEXT = "Call and hear the system — about 30 seconds.";

/** Optional scheduling route (same as calendar page). */
export const BOOKING_URL = CALENDAR_PATH;
