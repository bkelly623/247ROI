import Stripe from "stripe";
import { discoverSubscriptionId, retrieveBillingSnapshot, type BillingSnapshot } from "./recurring";
import type { StripeConfig } from "@/lib/payments/config";

export type VerifiedStripeEvent = {
  id: string;
  type: string;
  livemode: boolean;
  account?: string | null;
  data: { object: Record<string, unknown> };
};

export type StripeGateway = {
  discoverSubscriptionId?: (event: VerifiedStripeEvent) => Promise<string | null>;
  readBilling?: (event: VerifiedStripeEvent, subscriptionId: string) => Promise<BillingSnapshot | null>;
  constructEvent: (rawBody: string, signature: string, secret: string) => VerifiedStripeEvent;
  retrieveCheckoutSession: (sessionId: string) => Promise<Record<string, unknown>>;
  assertAccount: () => Promise<void>;
  createPortalSession: (input: { customer: string; configuration: string; returnUrl: string }) => Promise<{ url: string }>;
  retrievePrice: (priceId: string) => Promise<{ id: string; active: boolean; type: string; livemode: boolean; currency?: string; unitAmount?: number | null; interval?: string; intervalCount?: number }>;
  createCheckoutSession: (input: { priceId: string; setupPriceId?: string; recurring?: boolean; successUrl: string; cancelUrl: string; expiresAt: number; metadata: Record<string, string> }) => Promise<{ id: string; url: string }>;
};

export function checkoutSessionCreateParams(input: { priceId: string; setupPriceId?: string; recurring?: boolean; successUrl: string; cancelUrl: string; expiresAt: number; metadata: Record<string, string> }) {
  return {
    mode: input.recurring ? "subscription" as const : "payment" as const,
    ...(input.recurring ? { subscription_data: { metadata: input.metadata } } : { customer_creation: "always" as const }),
    expires_at: input.expiresAt,
    // Checkout subscription mode bills a one-time price on the first invoice only. Renewal invoices are checked separately.
    line_items: [{ price: input.priceId, quantity: 1 }, ...(input.setupPriceId ? [{ price: input.setupPriceId, quantity: 1 }] : [])],
    allow_promotion_codes: false,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: input.metadata,
  };
}

export async function assertExpectedStripeAccount(retrieve: () => Promise<{ id?: string | null }>, expectedAccountId: string) {
  let account: { id?: string | null };
  try {
    account = await retrieve();
  } catch {
    throw new Error("stripe_account_unverified");
  }
  if (!account?.id || account.id !== expectedAccountId) throw new Error("stripe_account_mismatch");
}

export function createStripeGateway(config: StripeConfig): StripeGateway {
  const stripe = new Stripe(config.secretKey);
  return {
    discoverSubscriptionId: event => discoverSubscriptionId(stripe, event),
    readBilling: (event, subscriptionId) => retrieveBillingSnapshot(stripe, config, event, subscriptionId),
    constructEvent(rawBody, signature, secret) {
      const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
      return event as unknown as VerifiedStripeEvent;
    },
    async retrieveCheckoutSession(sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
      return session as unknown as Record<string, unknown>;
    },
    assertAccount() {
      return assertExpectedStripeAccount(() => stripe.accounts.retrieve(null), config.expectedAccountId);
    },
    async createPortalSession(input) {
      const session = await stripe.billingPortal.sessions.create({
        customer: input.customer,
        configuration: input.configuration,
        return_url: input.returnUrl,
      });
      if (!session.url || !session.url.startsWith("https://billing.stripe.com/")) {
        throw new Error("stripe_portal_url_rejected");
      }
      return { url: session.url };
    },
    async retrievePrice(priceId) {
      const price = await stripe.prices.retrieve(priceId);
      return { id: price.id, active: price.active, type: price.type, livemode: price.livemode, currency: price.currency, unitAmount: price.unit_amount, interval: price.recurring?.interval, intervalCount: price.recurring?.interval_count };
    },
    async createCheckoutSession(input) {
      const session = await stripe.checkout.sessions.create(checkoutSessionCreateParams(input));
      if (!session.url || !session.url.startsWith("https://checkout.stripe.com/")) throw new Error("stripe_checkout_url_rejected");
      return { id: session.id, url: session.url };
    },
  };
}
