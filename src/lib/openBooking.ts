import { CALENDAR_PATH } from "@/app/components/cta";

/** Homepage anchor id for inline booking section (`/#book-call` scrolls on `/`). */
export const BOOKING_HASH = "book-call";

export { CALENDAR_PATH } from "@/app/components/cta";

/**
 * Navigate to the full-page booking calendar (replaces modal).
 */
export function requestOpenBooking() {
  if (typeof window === "undefined") return;
  window.location.assign(CALENDAR_PATH);
}
