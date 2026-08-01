import { CALENDAR_PATH } from "@/app/components/cta";

/** Legacy homepage anchor id. New conversion path is `/hire`. */
export const BOOKING_HASH = "contact";

export { CALENDAR_PATH } from "@/app/components/cta";

/** Navigate to the primary AI Employee Audit flow. */
export function requestOpenBooking() {
  if (typeof window === "undefined") return;
  window.location.assign(CALENDAR_PATH);
}
