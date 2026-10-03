import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
/** Twilio signs its externally configured URL, not Next's internal proxy URL. */
export function validTwilioSignature(req: NextRequest, form: FormData) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  const provided = req.headers.get("x-twilio-signature");
  if (!token || !provided) return false;
  const external = new URL(req.nextUrl.pathname + req.nextUrl.search, "https://www.get247roi.com").toString();
  let payload = external;
  for (const key of Array.from(new Set(form.keys())).sort()) {
    const values = [...new Set(form.getAll(key).map(String))].sort();
    for (const value of values) payload += key + value;
  }
  const expected = createHmac("sha1", token).update(payload).digest("base64");
  const a = Buffer.from(provided), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
