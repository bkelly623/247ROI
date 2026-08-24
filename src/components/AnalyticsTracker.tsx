"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackSiteEvent } from "@/lib/analytics/client";

function datasetMetadata(element: HTMLElement) {
  const metadata: Record<string, string> = {};

  for (const [key, value] of Object.entries(element.dataset)) {
    if (!key.startsWith("track") || key === "trackEvent") continue;
    if (typeof value === "undefined") continue;
    const normalized = key.replace(/^track/, "");
    const field = normalized.charAt(0).toLowerCase() + normalized.slice(1);
    metadata[field] = value;
  }

  return metadata;
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const search = window.location.search.replace(/^\?/, "");
    trackSiteEvent({
      eventName: "page_view",
      path: search ? `${pathname}?${search}` : pathname,
      metadata: {
        title: document.title,
      },
    });
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const tracked = target?.closest<HTMLElement>("[data-track-event]");
      if (!tracked?.dataset.trackEvent) return;

      trackSiteEvent({
        eventName: tracked.dataset.trackEvent,
        source: tracked.dataset.trackSource,
        metadata: {
          text: tracked.innerText?.trim().slice(0, 160),
          href:
            tracked instanceof HTMLAnchorElement
              ? tracked.href
              : tracked.querySelector("a")?.href,
          ...datasetMetadata(tracked),
        },
      });
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
