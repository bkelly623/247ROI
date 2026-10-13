import { readRecurringOffers, type RecurringOffer } from "./offers";
import {
  CHECKOUT_PURPOSE,
  EXPECTED_STRIPE_ACCOUNT_ID,
  LIVE_PORTAL_CONFIGURATION_ID,
} from "@/lib/payments/constants";
import { SITE_URL } from "@/lib/site";

export type StripeMode = "test" | "live";

export type StripeConfig = {
  mode: StripeMode;
  secretKey: string;
  webhookSecret: string;
  expectedAccountId: typeof EXPECTED_STRIPE_ACCOUNT_ID;
  allowedPriceIds: readonly string[];
  recurringOffers?: Record<string, RecurringOffer>;
  capabilitySecret: string;
  portalConfigurationId: string | null;
  appBaseUrl: string;
  checkoutPurpose: typeof CHECKOUT_PURPOSE;
};

const PRICE_ID = /^price_[A-Za-z0-9]+$/;

function allowedPrices(raw: string | undefined): string[] {
  if (!raw) return [];
  const ids = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (ids.length > 50) throw new Error("stripe_allowed_prices_invalid");
  for (const id of ids) {
    if (!PRICE_ID.test(id)) throw new Error("stripe_allowed_prices_invalid");
  }
  return ids;
}

/** Exact preview hostnames from server env. No wildcards and no request-supplied hosts. */
export function trustedPreviewHosts(env: NodeJS.ProcessEnv): string[] {
  const raw = env.PAYMENT_TRUSTED_PREVIEW_HOSTS?.trim() ?? "";
  if (!raw) return [];
  const hosts = raw.split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  if (hosts.length > 10) throw new Error("stripe_preview_hosts_invalid");
  for (const host of hosts) {
    if (host.includes("*") || host.includes("/") || host.includes("@") || host.includes(":")) {
      throw new Error("stripe_preview_hosts_invalid");
    }
    if (!/^[a-z0-9.-]+\.vercel\.app$/.test(host)) throw new Error("stripe_preview_hosts_invalid");
  }
  return hosts;
}

function appBaseUrl(env: NodeJS.ProcessEnv): string {
  const candidate = (env.PAYMENT_APP_BASE_URL || env.NEXT_PUBLIC_SITE_URL || SITE_URL).replace(/\/+$/, "");
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("stripe_app_base_url_invalid");
  }
  if (url.username || url.password || url.search || url.hash) throw new Error("stripe_app_base_url_invalid");
  const host = url.hostname.toLowerCase();
  const production = host === "get247roi.com" || host === "www.get247roi.com";
  const local = host === "localhost" || host === "127.0.0.1";
  const preview = trustedPreviewHosts(env).includes(host);
  if (!production && !local && !preview) throw new Error("stripe_app_base_url_invalid");
  if (!local && url.protocol !== "https:") throw new Error("stripe_app_base_url_invalid");
  if (!local && url.port) throw new Error("stripe_app_base_url_invalid");
  if (local && url.protocol !== "http:" && url.protocol !== "https:") throw new Error("stripe_app_base_url_invalid");
  return url.origin;
}

/**
 * Fail closed. Secrets are read only from server env and are never returned.
 * STRIPE_MODE must agree with the secret key prefix. The expected account is fixed.
 */
export function readStripeConfig(env: NodeJS.ProcessEnv = process.env): StripeConfig {
  const mode = env.STRIPE_MODE;
  if (mode !== "test" && mode !== "live") throw new Error("stripe_mode_invalid");

  const secretKey = env.STRIPE_SECRET_KEY?.trim() ?? "";
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const expectedAccountId = env.STRIPE_EXPECTED_ACCOUNT_ID?.trim() ?? "";
  const capabilitySecret = env.PAYMENT_CAPABILITY_SECRET?.trim() ?? "";

  if (!secretKey || !webhookSecret || !expectedAccountId || !capabilitySecret) {
    throw new Error("stripe_env_incomplete");
  }
  if (expectedAccountId !== EXPECTED_STRIPE_ACCOUNT_ID) throw new Error("stripe_account_not_allowed");
  if (capabilitySecret.length < 32) throw new Error("stripe_capability_secret_weak");
  if (!webhookSecret.startsWith("whsec_")) throw new Error("stripe_webhook_secret_invalid");

  const liveKey = secretKey.startsWith("sk_live_") || secretKey.startsWith("rk_live_");
  const testKey = secretKey.startsWith("sk_test_") || secretKey.startsWith("rk_test_");
  if (mode === "live" && !liveKey) throw new Error("stripe_key_mode_mismatch");
  if (mode === "test" && !testKey) throw new Error("stripe_key_mode_mismatch");
  if (secretKey.startsWith("pk_")) throw new Error("stripe_publishable_key_rejected");

  const portalRaw = env.STRIPE_PORTAL_CONFIGURATION_ID?.trim() || null;
  if (portalRaw && !/^bpc_[A-Za-z0-9]+$/.test(portalRaw)) throw new Error("stripe_portal_config_invalid");
  if (mode === "live" && portalRaw && portalRaw !== LIVE_PORTAL_CONFIGURATION_ID) {
    throw new Error("stripe_portal_config_mismatch");
  }
  if (mode === "test" && portalRaw === LIVE_PORTAL_CONFIGURATION_ID) {
    throw new Error("stripe_portal_config_mode_mismatch");
  }

  return {
    mode,
    secretKey,
    webhookSecret,
    expectedAccountId,
    allowedPriceIds: allowedPrices(env.STRIPE_ALLOWED_PRICE_IDS),
    recurringOffers: readRecurringOffers(env.STRIPE_RECURRING_OFFERS_JSON),
    capabilitySecret,
    portalConfigurationId: portalRaw,
    appBaseUrl: appBaseUrl(env),
    checkoutPurpose: CHECKOUT_PURPOSE,
  };
}

/** Same-origin relative return path. Ignores any caller-supplied URL. */
export function paymentReturnUrl(config: StripeConfig, sessionId: string): string {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) throw new Error("stripe_session_invalid");
  const prefix = config.mode === "test" ? "cs_test_" : "cs_live_";
  if (!sessionId.startsWith(prefix)) throw new Error("stripe_session_mode_mismatch");
  return `${config.appBaseUrl}/payment/confirmation?session_id=${encodeURIComponent(sessionId)}`;
}
