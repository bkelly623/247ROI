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
