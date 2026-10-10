import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TestCheckout from "./TestCheckout";
import { testCheckoutPrice } from "./test-config";

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
  return <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
    <section className="mx-auto max-w-lg">
      <p className="font-semibold text-amber-300">TEST MODE — no real money</p>
      <h1 className="mt-4 text-3xl font-bold">$1 simulated checkout</h1>
      <p className="mt-4">This is a one-time $1.00 USD simulated charge in Stripe test mode. No real money will be charged. Use only Stripe test payment details, never a real card.</p>
      <p className="mt-4">Continue in this same browser so your secure payment confirmation stays connected to this session.</p>
      <TestCheckout priceId={priceId} />
    </section>
  </main>;
}
