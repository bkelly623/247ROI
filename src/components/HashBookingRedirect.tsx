"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BOOKING_HASH } from "@/lib/openBooking";

/** On the homepage, `/#book-call` scrolls to the inline booking section (no redirect). */
export default function HashBookingRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    const scrollIfHash = () => {
      if (typeof window === "undefined") return;
      if (pathname !== "/") return;
      if (window.location.hash !== `#${BOOKING_HASH}`) return;
      const el = document.getElementById(BOOKING_HASH);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    scrollIfHash();
    const t = window.setTimeout(scrollIfHash, 200);
    window.addEventListener("hashchange", scrollIfHash);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", scrollIfHash);
    };
  }, [pathname]);

  return null;
}
