import type { Metadata } from "next";
import ConfirmationStatus from "./ConfirmationStatus";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment confirmation | 247ROI",
  robots: { index: false, follow: false },
};

export default async function PaymentConfirmationPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const params = await searchParams;
  return <ConfirmationStatus sessionId={params.session_id ?? ""} />;
}
