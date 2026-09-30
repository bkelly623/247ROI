/**
 * Minimal Twilio REST client using fetch — no SDK dependency.
 * Sends the exact registered A2P 10DLC message text; do not change wording here
 * without updating the Twilio campaign registration to match.
 */
const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

export async function sendSms(to: string, body: string): Promise<{ ok: boolean; sid?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    console.error("[twilio] missing TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER env vars");
    return { ok: false, error: "SMS sending is not configured." };
  }

  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const res = await fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("[twilio] send failed", { status: res.status, data });
    return { ok: false, error: data?.message || "Failed to send SMS." };
  }

  return { ok: true, sid: data?.sid };
}

type TwilioMessageRow = {
  sid: string;
  from: string;
  to: string;
  body: string;
  date_created: string;
  direction: string;
};

async function fetchMessages(params: URLSearchParams): Promise<TwilioMessageRow[]> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return [];

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const res = await fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}/Messages.json?${params.toString()}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    console.error("[twilio] list messages failed", res.status, await res.text().catch(() => ""));
    return [];
  }
  const data = await res.json().catch(() => ({}));
  return (data?.messages as TwilioMessageRow[]) ?? [];
}

/**
 * Reconstructs a two-way SMS thread between a lead's number and our own number
 * using Twilio's own Messages log as the system of record — no separate DB
 * needed for conversation continuity across serverless invocations.
 */
export async function getConversationHistory(
  leadNumber: string,
  ourNumber: string,
  limit = 20
): Promise<{ role: "user" | "assistant"; content: string; at: string }[]> {
  const [inbound, outbound] = await Promise.all([
    fetchMessages(new URLSearchParams({ From: leadNumber, To: ourNumber, PageSize: String(limit) })),
    fetchMessages(new URLSearchParams({ From: ourNumber, To: leadNumber, PageSize: String(limit) })),
  ]);

  const all = [...inbound, ...outbound]
    .map((m) => ({
      role: (m.from === ourNumber ? "assistant" : "user") as "user" | "assistant",
      content: m.body,
      at: m.date_created,
    }))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return all.slice(-limit);
}

/**
 * Checks whether we've already sent a lead-alert to `ourAlertNumber` about
 * `leadNumber` recently, so we don't spam a second alert for the same thread.
 * Uses Twilio's own message log as the dedupe store — same rationale as above.
 */
export async function alreadyNotifiedAbout(
  leadNumber: string,
  ourNumber: string,
  alertNumber: string,
  sinceHours = 24
): Promise<boolean> {
  const sent = await fetchMessages(
    new URLSearchParams({ From: ourNumber, To: alertNumber, PageSize: "50" })
  );
  const cutoff = Date.now() - sinceHours * 3600 * 1000;
  const digits = leadNumber.replace(/[^\d]/g, "").slice(-10);
  return sent.some((m) => {
    const when = new Date(m.date_created).getTime();
    return when >= cutoff && m.body.replace(/[^\d]/g, "").includes(digits);
  });
}
