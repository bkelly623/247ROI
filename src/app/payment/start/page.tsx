import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readStripeConfig } from "@/lib/payments/config";
import { createStripeGateway } from "@/lib/payments/stripe-server";
import { offerSummary } from "@/lib/payments/offer-summary";
import StartCheckout from "./StartCheckout";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const metadata: Metadata = { title: "Your payment | 247ROI", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function PaymentStart({ searchParams }: { searchParams: Promise<{ offer?: string | string[] }> }) {
  const { offer } = await searchParams;
  let summary = null;
  try { const config = readStripeConfig(); summary = await offerSummary(offer, config, createStripeGateway(config)); } catch { /* Unknown or unconfigured offers stay closed. */ }
  if (!summary || typeof offer !== "string") notFound();
  const usd = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  return <main className="min-h-screen bg-slate-950 px-6 py-16 text-white"><section className="mx-auto max-w-lg">
    {summary.test && <p className="font-semibold text-amber-300">TEST MODE — no real money</p>}
    <h1 className="mt-4 text-3xl font-bold">Your agreed service</h1>
    <p className="mt-4">{usd(summary.monthlyAmount)} USD per month{summary.setupAmount ? ` plus ${usd(summary.setupAmount)} USD one-time setup` : ""}.</p>
    <p className="mt-4">Initial payment: {usd(summary.monthlyAmount + summary.setupAmount)} USD. Then {usd(summary.monthlyAmount)} USD monthly. Review the final payment details on Stripe before subscribing.</p>
    <p className="mt-4">Continue in this browser. No separate onboarding form is required.</p>
    <StartCheckout offerToken={offer} />
    <a className="mt-6 block underline" href="mailto:brendan@get247roi.com">Questions about your agreed terms? Contact us.</a>
  </section></main>;
}
