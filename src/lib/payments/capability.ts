import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { BROWSER_CREDENTIAL_TTL_SECONDS, ONBOARDING_TOKEN_PURPOSE, ONBOARDING_TOKEN_TTL_SECONDS } from "@/lib/payments/constants";
import type { StripeMode } from "@/lib/payments/config";

export type OnboardingCapability = {
  v: 1;
  purpose: typeof ONBOARDING_TOKEN_PURPOSE;
  mode: StripeMode;
  accountId: string;
  sessionId: string;
  exp: number;
  nonce: string;
};

function b64url(bytes: Buffer): string {
  return bytes.toString("base64url");
}

function sign(secret: string, body: string): string {
  return b64url(createHmac("sha256", secret).update(body).digest());
}

export function signCheckoutIntent(mode: StripeMode, priceId: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`v1|${mode}|247roi_paid_onboarding|${priceId}`)
    .digest("hex");
}

export function newBrowserNonce(): string {
  return randomBytes(32).toString("base64url");
}

export function browserBinding(mode: StripeMode, accountId: string, nonce: string, secret: string): string {
  return createHmac("sha256", secret).update(`v1|browser|${mode}|${accountId}|${nonce}`).digest("hex");
}

export function browserBindingMatches(mode: StripeMode, accountId: string, nonce: string | null, expected: string | null, secret: string): boolean {
  if (!nonce || !expected || !/^[A-Za-z0-9_-]{43}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(expected)) return false;
  const actual = browserBinding(mode, accountId, nonce, secret);
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const CHECKOUT_COOKIE = "roi_checkout_binding";
const BROWSER_CREDENTIAL_PURPOSE = "roi_browser";

type BrowserCredential = { v: 1; purpose: typeof BROWSER_CREDENTIAL_PURPOSE; nonce: string; iat: number; exp: number };

export function issueBrowserCredential(secret: string, now: number, nonce: string): string {
  const payload: BrowserCredential = { v: 1, purpose: BROWSER_CREDENTIAL_PURPOSE, nonce, iat: now, exp: now + BROWSER_CREDENTIAL_TTL_SECONDS };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  return `v1.${body}.${sign(secret, body)}`;
}

export function readBrowserCredential(token: string, secret: string, now: number): BrowserCredential | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1" || !parts[1] || !parts[2]) return null;
  const expected = sign(secret, parts[1]);
  const a = Buffer.from(expected);
  const b = Buffer.from(parts[2]);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload: BrowserCredential;
  try {
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as BrowserCredential;
  } catch {
    return null;
  }
  if (payload.v !== 1 || payload.purpose !== BROWSER_CREDENTIAL_PURPOSE) return null;
  if (!payload.nonce || !/^[A-Za-z0-9_-]{43}$/.test(payload.nonce)) return null;
  if (!Number.isFinite(payload.iat) || !Number.isFinite(payload.exp)) return null;
  if (payload.iat > now || payload.exp <= now) return null;
  if (payload.exp - payload.iat !== BROWSER_CREDENTIAL_TTL_SECONDS) return null;
  return payload;
}

export function browserCredentialForCheckout(secret: string, cookieValue: string | null, now: number): { nonce: string; token: string } {
  const existing = cookieValue ? readBrowserCredential(cookieValue, secret, now) : null;
  const nonce = existing?.nonce ?? newBrowserNonce();
  return { nonce, token: issueBrowserCredential(secret, now, nonce) };
}

export function checkoutCookieHeader(token: string, secure: boolean): string {
  return `${CHECKOUT_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${BROWSER_CREDENTIAL_TTL_SECONDS}${secure ? "; Secure" : ""}`;
}

export function checkoutCookieValue(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === CHECKOUT_COOKIE) return rest.join("=") || null;
  }
  return null;
}

export function browserNonceFromCookie(header: string | null, secret: string, now = Math.floor(Date.now() / 1000)): string | null {
  const value = checkoutCookieValue(header);
  return value ? readBrowserCredential(value, secret, now)?.nonce ?? null : null;
}

export function checkoutIntentMatches(mode: StripeMode, priceId: string, intent: string, secret: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(intent)) return false;
  const expected = signCheckoutIntent(mode, priceId, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(intent);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function issueOnboardingCapability(input: {
  secret: string;
  mode: StripeMode;
  accountId: string;
  sessionId: string;
  now?: number;
  ttlSeconds?: number;
}): string {
  const now = input.now ?? Math.floor(Date.now() / 1000);
  const payload: OnboardingCapability = {
    v: 1,
    purpose: ONBOARDING_TOKEN_PURPOSE,
    mode: input.mode,
    accountId: input.accountId,
    sessionId: input.sessionId,
    exp: now + (input.ttlSeconds ?? ONBOARDING_TOKEN_TTL_SECONDS),
    nonce: randomBytes(16).toString("hex"),
  };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  return `v1.${body}.${sign(input.secret, body)}`;
}

export function readOnboardingCapability(token: string, secret: string, now = Math.floor(Date.now() / 1000)): OnboardingCapability {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1" || !parts[1] || !parts[2]) throw new Error("capability_invalid");
  const expected = sign(secret, parts[1]);
  const a = Buffer.from(expected);
  const b = Buffer.from(parts[2]);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("capability_invalid");
  let payload: OnboardingCapability;
  try {
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as OnboardingCapability;
  } catch {
    throw new Error("capability_invalid");
  }
  if (payload.v !== 1 || payload.purpose !== ONBOARDING_TOKEN_PURPOSE) throw new Error("capability_invalid");
  if (payload.mode !== "test" && payload.mode !== "live") throw new Error("capability_invalid");
  if (!payload.sessionId || !payload.accountId || !payload.nonce) throw new Error("capability_invalid");
  if (!Number.isFinite(payload.exp) || payload.exp <= now) throw new Error("capability_expired");
  return payload;
}
