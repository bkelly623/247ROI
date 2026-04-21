"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { CALENDAR_PATH } from "@/app/components/cta";
import { BOOKING_HASH } from "@/lib/openBooking";

/** Old links to `/#book-call` redirect to the full calendar page. */
export default function HashBookingRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    const redirectIfLegacyHash = () => {
      if (typeof window === "undefined") return;
      if (pathname === "/" && window.location.hash === `#${BOOKING_HASH}`) {
        window.location.replace(CALENDAR_PATH);
      }
    };

    redirectIfLegacyHash();
    window.addEventListener("hashchange", redirectIfLegacyHash);
    return () => window.removeEventListener("hashchange", redirectIfLegacyHash);
  }, [pathname]);

  return null;
}
