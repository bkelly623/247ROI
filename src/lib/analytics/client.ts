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
  const existing = storage.getItem(key);
  if (existing) return existing;
  const next = randomId(prefix);
  storage.setItem(key, next);
  return next;
}

export function getAnalyticsIdentity() {
  if (typeof window === "undefined") {
    return { visitorId: undefined, sessionId: undefined };
  }

  return {
    visitorId: storageId(VISITOR_KEY, "visitor", window.localStorage),
    sessionId: storageId(SESSION_KEY, "session", window.sessionStorage),
  };
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
    navigator.sendBeacon("/api/events", blob);
    return;
  }

  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}
