import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TestCheckout from "./TestCheckout";
import { testCheckoutPrice, testRecurringOffer } from "./test-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const metadata: Metadata = {
  title: "TEST checkout | 247ROI",
  robots: { index: false, follow: false },
};

export default async function TestPaymentPage() {
  const priceId = await testCheckoutPrice();
  if (!priceId) notFound();
  const recurringOffer = await testRecurringOffer();
  return <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
    <section className="mx-auto max-w-lg">
      <p className="font-semibold text-amber-300">TEST MODE — no real money</p>
      <h1 className="mt-4 text-3xl font-bold">$1 simulated checkout</h1>
      <p className="mt-4">This is a one-time $1.00 USD simulated charge in Stripe test mode. No real money will be charged. Use only Stripe test payment details, never a real card.</p>
      <p className="mt-4">Continue in this same browser so your secure payment confirmation stays connected to this session.</p>
      <TestCheckout priceId={priceId} />
      {recurringOffer && <section id="recurring" className="mt-10 border-t border-slate-700 pt-6">
        <h2 className="text-2xl font-bold">Recurring TEST only</h2>
        <p className="mt-4">$1.00 USD setup plus $1.00 for the first month ($2.00 initially), then $1.00 USD monthly. Simulated payments only; no real money. No onboarding form.</p>
        <TestCheckout priceId={recurringOffer} recurring />
      </section>}
    </section>
  </main>;
}
