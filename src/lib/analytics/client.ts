"use client";

type SiteEventPayload = {
  eventName: string;
  path?: string;
  url?: string;
  referrer?: string;
  source?: string;
  sessionId?: string;
  visitorId?: string;
  metadata?: Record<string, unknown>;
};

const VISITOR_KEY = "247roi_visitor_id";
const SESSION_KEY = "247roi_session_id";

function randomId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function storageId(key: string, prefix: string, storage: Storage | undefined) {
  if (!storage) return randomId(prefix);
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const next = randomId(prefix);
    storage.setItem(key, next);
    return next;
  } catch { return randomId(prefix); }
}

export function getAnalyticsIdentity() {
  if (typeof window === "undefined") {
    return { visitorId: undefined, sessionId: undefined };
  }

  try { return {
    visitorId: storageId(VISITOR_KEY, "visitor", window.localStorage),
    sessionId: storageId(SESSION_KEY, "session", window.sessionStorage),
  }; } catch { return { visitorId: undefined, sessionId: undefined }; }
}

export function getInquiryAttribution() {
  if (typeof window === "undefined") return { source: "", campaign: "" };
  const key = "247roi_first_touch";
  try {
    const stored = window.sessionStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed.source === "string" && typeof parsed.campaign === "string") return parsed as { source: string; campaign: string };
    }
    const query = new URLSearchParams(window.location.search);
    const referrer = document.referrer ? new URL(document.referrer).origin : "direct";
    const value = { source: `${referrer} → ${window.location.pathname}`.slice(0, 200), campaign: [query.get("utm_source"), query.get("utm_medium"), query.get("utm_campaign")].filter(Boolean).join(" / ").slice(0, 200) };
    window.sessionStorage.setItem(key, JSON.stringify(value));
    return value;
  } catch { return { source: "", campaign: "" }; }
}

export function trackSiteEvent(payload: SiteEventPayload) {
  if (typeof window === "undefined") return;

  const identity = getAnalyticsIdentity();
  const body = JSON.stringify({
    path: window.location.pathname,
    url: window.location.href,
    referrer: document.referrer || undefined,
    ...identity,
    ...payload,
    metadata: payload.metadata ?? {},
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    try { if (navigator.sendBeacon("/api/events", blob)) return; } catch { /* fall back to fetch */ }
  }

  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
