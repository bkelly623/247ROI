import { CALENDAR_PATH } from "@/app/components/cta";

/** Homepage anchor id for inline booking section (`/#contact` scrolls on `/`). */
export const BOOKING_HASH = "contact";

export { CALENDAR_PATH } from "@/app/components/cta";

/** Navigate to the current direct-contact section. */
export function requestOpenBooking() {
  if (typeof window === "undefined") return;
  window.location.assign(CALENDAR_PATH);
}
