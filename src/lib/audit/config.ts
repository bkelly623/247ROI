import {
  PRIMARY_PHONE_DISPLAY,
  PRIMARY_PHONE_HREF,
  CALENDAR_PATH,
} from "@/app/components/cta";
import { SITE_URL } from "@/lib/site";

export const BRAND = {
  name: "247ROI",
  tagline: "AI Infrastructure Blueprint",
  fullTitle: "247ROI Infrastructure Blueprint",
  subtitle: "AI Visibility · Google Search · Reputation · Social",
  phone: PRIMARY_PHONE_HREF.replace("tel:", "").replace("+1", ""),
  phoneDisplay: PRIMARY_PHONE_DISPLAY,
  phoneHref: PRIMARY_PHONE_HREF,
  email: "contact@247roi.com",
  siteUrl: SITE_URL,
  schedulingUrl: process.env.NEXT_PUBLIC_SCHEDULING_URL || CALENDAR_PATH,
} as const;

export const AUDIT_LIMITS = {
  maxAuditsPerPhoneDays: 90,
  maxAuditsPerPhone: 1,
} as const;

export const ATHENA = {
  webhookUrl: process.env.ATHENA_WEBHOOK_URL || "",
  callbackSecret: process.env.ATHENA_CALLBACK_SECRET || "",
  botId: "athena_bot_bot_bot",
} as const;

/** API keys for live probes — add to Vercel env */
export const PROBE_KEYS = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY or GOOGLE_AI_API_KEY",
  googleLocal: "SERPAPI_KEY or GOOGLE_PLACES_API_KEY",
  pageSpeed: "GOOGLE_PAGESPEED_API_KEY",
} as const;
