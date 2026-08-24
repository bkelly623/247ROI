import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

type EventBody = {
  eventName?: string;
  path?: string;
  url?: string;
  referrer?: string;
  source?: string;
  sessionId?: string;
  visitorId?: string;
  metadata?: Record<string, unknown>;
};

function clean(value: unknown, max = 500) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function hashIp(ip: string | null) {
  if (!ip) return null;
  return createHash("sha256")
    .update(`${ip}:${process.env.ANALYTICS_IP_SALT ?? "247roi"}`)
    .digest("hex");
}

function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

export async function POST(req: NextRequest) {
  const ingestUrl = process.env.COMMAND_CENTER_EVENTS_URL;
  const ingestSecret = process.env.COMMAND_CENTER_EVENTS_SECRET;

  if (!ingestUrl || !ingestSecret) {
    return NextResponse.json({ ok: false, skipped: "command_center_events_unconfigured" });
  }

  let body: EventBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const eventName = clean(body.eventName, 80);
  if (!eventName) {
    return NextResponse.json({ ok: false, error: "eventName required" }, { status: 400 });
  }

  const metadata =
    body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata
      : {};

  const payload = {
    eventName,
    path: clean(body.path, 500),
    url: clean(body.url, 1000),
    referrer: clean(body.referrer, 1000),
    source: clean(body.source, 120),
    sessionId: clean(body.sessionId, 160),
    visitorId: clean(body.visitorId, 160),
    ipHash: hashIp(clientIp(req)),
    userAgent: clean(req.headers.get("user-agent"), 500),
    metadata,
  };

  const response = await fetch(ingestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-247roi-events-secret": ingestSecret,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  }).catch((error: unknown) => {
    console.warn("command-center event forward failed:", error);
    return null;
  });

  if (!response?.ok) {
    return NextResponse.json({ ok: false, error: "event_not_recorded" });
  }

  return NextResponse.json({ ok: true });
}
