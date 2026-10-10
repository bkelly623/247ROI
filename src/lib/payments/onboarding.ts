import { z } from "zod";
import { browserBindingMatches, readOnboardingCapability } from "@/lib/payments/capability";
import { PAYMENT_SUPPORT_EMAIL } from "@/lib/payments/constants";
import type { StripeConfig } from "@/lib/payments/config";
import { onboardingDedupeKey, type OnboardingRecord, type PaymentLedger } from "@/lib/payments/ledger";

const website = z.union([
  z.literal(""),
  z.string().trim().max(200).regex(/^(https?:\/\/[^\s]+|[a-z0-9.-]+\.[a-z]{2,})$/i),
]);

export const onboardingSchema = z
  .object({
    token: z.string().min(20).max(4000),
    businessName: z.string().trim().min(2).max(160),
    contactName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(30).refine((value) => /^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 10 && value.replace(/\D/g, "").length <= 15, "Enter a valid phone number."),
    website: website.optional().default(""),
    serviceNotes: z.string().trim().min(10).max(4000),
  })
  .strict();

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export type PublicOnboarding = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  serviceNotes: string;
  updatedAt: string;
};

function publicProfile(record: OnboardingRecord): PublicOnboarding {
  return {
    businessName: record.businessName,
    contactName: record.contactName,
    email: record.email,
    phone: record.phone,
    website: record.website,
    serviceNotes: record.serviceNotes,
    updatedAt: record.updatedAt,
  };
}

async function authorizedRecord(config: StripeConfig, ledger: PaymentLedger, token: string, cookieNonce: string | null, now?: number) {
  const capability = readOnboardingCapability(token, config.capabilitySecret, now);
  if (capability.mode !== config.mode || capability.accountId !== config.expectedAccountId) {
    throw new Error("capability_invalid");
  }
  const fulfillment = await ledger.getBySession(config.expectedAccountId, config.mode, capability.sessionId);
  if (!fulfillment?.recognized || !fulfillment.fulfilledAt || (fulfillment.status !== "paid" && fulfillment.status !== "partially_refunded") || fulfillment.fullRefund) {
    throw new Error("onboarding_not_available");
  }
  if (!browserBindingMatches(config.mode, config.expectedAccountId, cookieNonce, fulfillment.browserBinding, config.capabilitySecret)) {
    throw new Error("browser_binding_required");
  }
  return { capability, fulfillment };
}

const bindingBody = { error: "browser_binding_required", message: `Open this page in the same browser used to pay, or email ${PAYMENT_SUPPORT_EMAIL}. This page does not send an email sign-in code.` };

export async function readPaidOnboarding(input: { token: string | null; cookieNonce?: string | null; config: StripeConfig; ledger: PaymentLedger; now?: number }) {
  if (!input.token) return { status: 401, body: { error: "capability_invalid" } };
  try {
    const { capability } = await authorizedRecord(input.config, input.ledger, input.token, input.cookieNonce ?? null, input.now);
    const saved = await input.ledger.getOnboarding(input.config.expectedAccountId, input.config.mode, capability.sessionId);
    return { status: 200, body: { profile: saved ? publicProfile(saved) : null } };
  } catch (error) {
    const code = error instanceof Error ? error.message : "capability_invalid";
    if (code === "browser_binding_required") return { status: 403, body: bindingBody };
    const status = code === "onboarding_not_available" ? 403 : 401;
    return { status, body: { error: code === "capability_expired" ? "capability_expired" : code === "onboarding_not_available" ? code : "capability_invalid" } };
  }
}

export async function savePaidOnboarding(input: { body: unknown; cookieNonce?: string | null; config: StripeConfig; ledger: PaymentLedger; now?: number; notify?: (record: OnboardingRecord, dedupeKey: string) => Promise<void> }) {
  const parsed = onboardingSchema.safeParse(input.body);
  if (!parsed.success) return { status: 400, body: { error: "invalid_onboarding" } };
  try {
    const { capability } = await authorizedRecord(input.config, input.ledger, parsed.data.token, input.cookieNonce ?? null, input.now);
    const saved = await input.ledger.saveOnboarding({
      accountId: input.config.expectedAccountId,
      sessionId: capability.sessionId,
      mode: input.config.mode,
      businessName: parsed.data.businessName,
      contactName: parsed.data.contactName,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      website: parsed.data.website,
      serviceNotes: parsed.data.serviceNotes,
      updatedAt: new Date(input.now ? input.now * 1000 : Date.now()).toISOString(),
    });
    const dedupeKey = onboardingDedupeKey(saved);
    if (input.notify) await input.notify(saved, dedupeKey).catch(() => undefined);
    return { status: 200, body: { profile: publicProfile(saved), notification: "at_least_once" as const } };
  } catch (error) {
    const code = error instanceof Error ? error.message : "capability_invalid";
    if (code === "browser_binding_required") return { status: 403, body: bindingBody };
    if (code === "onboarding_not_available") return { status: 403, body: { error: code } };
    if (code === "payment_persist_failed") return { status: 500, body: { error: code } };
    return { status: 401, body: { error: code === "capability_expired" ? code : "capability_invalid" } };
  }
}

export async function deliverOnboardingNotice(ledger: PaymentLedger, record: OnboardingRecord, dedupeKey: string, env: NodeJS.ProcessEnv = process.env, send: typeof fetch = fetch) {
  const url = env.PAYMENT_NOTIFY_WEBHOOK_URL?.trim();
  if (!url || !ledger) return;
  try {
    const response = await send(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "onboarding_saved", dedupeKey, mode: record.mode, sessionId: record.sessionId, businessName: record.businessName, email: record.email }),
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error("notification_not_accepted");
  } catch {
    return;
  }
}
