"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BOOKING_HASH } from "@/lib/openBooking";
import { VOICE_DEMO_FOCUS_EVENT } from "@/lib/scrollFunnel";

function dispatchVoiceDemoFocusSoon() {
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent(VOICE_DEMO_FOCUS_EVENT));
  }, 0);
}

const VOICE_DEMO_HASH = "voice-demo";

/** On the homepage, booking and voice hashes scroll / focus without leaving the page. */
export default function HashBookingRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    const applyHash = () => {
      if (typeof window === "undefined") return;
      if (pathname !== "/") return;
      const hash = window.location.hash;
      if (hash === `#${BOOKING_HASH}`) {
        const el = document.getElementById(BOOKING_HASH);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }
      if (hash === `#${VOICE_DEMO_HASH}`) {
        dispatchVoiceDemoFocusSoon();
      }
    };

    applyHash();
    const t = window.setTimeout(applyHash, 200);
    window.addEventListener("hashchange", applyHash);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", applyHash);
    };
  }, [pathname]);

  return null;
}
