import type { Metadata } from "next";
import ConfirmationStatus from "./ConfirmationStatus";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment confirmation | 247ROI",
  robots: { index: false, follow: false },
};

export default async function PaymentConfirmationPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const params = await searchParams;
  if (!params.session_id) {
    return <main className="min-h-screen bg-white px-6 py-20"><div className="max-w-3xl mx-auto"><h1 className="text-[38px] font-semibold text-gray-900">Payment information</h1><p className="mt-6 text-[18px] text-gray-700">No additional form is required. This page does not confirm payment status.</p><p className="mt-8 text-[16px] text-gray-600">Questions? <a className="text-emerald-700 underline" href="mailto:brendan@get247roi.com">Email brendan@get247roi.com</a>.</p></div></main>;
  }
  return <ConfirmationStatus sessionId={params.session_id ?? ""} />;
}
