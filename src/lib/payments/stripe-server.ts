import Stripe from "stripe";
import type { StripeConfig } from "@/lib/payments/config";

export type VerifiedStripeEvent = {
  id: string;
  type: string;
  livemode: boolean;
  account?: string | null;
  data: { object: Record<string, unknown> };
};

export type StripeGateway = {
  constructEvent: (rawBody: string, signature: string, secret: string) => VerifiedStripeEvent;
  retrieveCheckoutSession: (sessionId: string) => Promise<Record<string, unknown>>;
  assertAccount: () => Promise<void>;
  createPortalSession: (input: { customer: string; configuration: string; returnUrl: string }) => Promise<{ url: string }>;
  retrievePrice: (priceId: string) => Promise<{ id: string; active: boolean; type: string; livemode: boolean }>;
  createCheckoutSession: (input: { priceId: string; successUrl: string; cancelUrl: string; expiresAt: number; metadata: Record<string, string> }) => Promise<{ id: string; url: string }>;
};

export function checkoutSessionCreateParams(input: { priceId: string; successUrl: string; cancelUrl: string; expiresAt: number; metadata: Record<string, string> }) {
  return {
    mode: "payment" as const,
    customer_creation: "always" as const,
    expires_at: input.expiresAt,
    line_items: [{ price: input.priceId, quantity: 1 }],
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
      return { id: price.id, active: price.active, type: price.type, livemode: price.livemode };
    },
    async createCheckoutSession(input) {
      const session = await stripe.checkout.sessions.create(checkoutSessionCreateParams(input));
      if (!session.url || !session.url.startsWith("https://checkout.stripe.com/")) throw new Error("stripe_checkout_url_rejected");
      return { id: session.id, url: session.url };
    },
  };
}
