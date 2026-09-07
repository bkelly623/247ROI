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

const INTERNAL_USER_AGENT_PATTERNS = [
  "247ROI-AuditBot",
  "Athena",
  "OpenClaw",
  "HeadlessChrome",
  "Playwright",
  "Puppeteer",
  "curl/",
  "Wget/",
  "python-requests/",
  "node-fetch",
  "undici",
];

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

function listFromEnv(name: string) {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function classifyInternalTraffic(ip: string | null, userAgent: string | null) {
  const internalIps = listFromEnv("ANALYTICS_INTERNAL_IPS");
  const internalIpHashes = listFromEnv("ANALYTICS_INTERNAL_IP_HASHES");
  const userAgentPatterns = [
    ...INTERNAL_USER_AGENT_PATTERNS,
    ...listFromEnv("ANALYTICS_INTERNAL_USER_AGENT_PATTERNS"),
  ];
  const ipHash = hashIp(ip);

  if (ip && internalIps.includes(ip)) {
    return { excludedFromMetrics: true, exclusionReason: "internal_ip", ipHash };
  }

  if (ipHash && internalIpHashes.includes(ipHash)) {
    return { excludedFromMetrics: true, exclusionReason: "internal_ip_hash", ipHash };
  }

  if (userAgent && userAgentPatterns.some((pattern) => userAgent.includes(pattern))) {
    return { excludedFromMetrics: true, exclusionReason: "internal_user_agent", ipHash };
  }

  return { excludedFromMetrics: false, exclusionReason: null, ipHash };
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

  const ip = clientIp(req);
  const userAgent = clean(req.headers.get("user-agent"), 500);
  const trafficClass = classifyInternalTraffic(ip, userAgent);

  const payload = {
    eventName,
    path: clean(body.path, 500),
    url: clean(body.url, 1000),
    referrer: clean(body.referrer, 1000),
    source: clean(body.source, 120),
    sessionId: clean(body.sessionId, 160),
    visitorId: clean(body.visitorId, 160),
    ipHash: trafficClass.ipHash,
    userAgent,
    metadata: {
      ...metadata,
      trafficClass: {
        excludedFromMetrics: trafficClass.excludedFromMetrics,
        exclusionReason: trafficClass.exclusionReason,
      },
    },
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
