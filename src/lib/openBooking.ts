import { CALENDAR_PATH } from "@/app/components/cta";

/** Legacy hash for `HashBookingRedirect` (`/#book-call` → `/calendar`). */
export const BOOKING_HASH = "book-call";

export { CALENDAR_PATH } from "@/app/components/cta";

/**
 * Navigate to the full-page booking calendar (replaces modal).
 */
export function requestOpenBooking() {
  if (typeof window === "undefined") return;
  window.location.assign(CALENDAR_PATH);
}
