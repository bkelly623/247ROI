import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, explainSupabaseKeyError } from "@/lib/audit/supabase/server";

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
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, skipped: "supabase_unconfigured" });
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

  const { error } = await supabase.from("site_events").insert({
    event_name: eventName,
    path: clean(body.path, 500),
    url: clean(body.url, 1000),
    referrer: clean(body.referrer, 1000),
    source: clean(body.source, 120),
    session_id: clean(body.sessionId, 160),
    visitor_id: clean(body.visitorId, 160),
    ip_hash: hashIp(clientIp(req)),
    user_agent: clean(req.headers.get("user-agent"), 500),
    metadata,
  });

  if (error) {
    console.warn("site_events insert failed:", explainSupabaseKeyError(error.message));
    return NextResponse.json({ ok: false, error: "event_not_recorded" });
  }

  return NextResponse.json({ ok: true });
}
