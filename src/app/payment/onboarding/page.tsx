import type { Metadata } from "next";
import OnboardingForm from "./OnboardingForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Implementation onboarding | 247ROI",
  robots: { index: false, follow: false },
};

export default async function PaidOnboardingPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return <OnboardingForm token={params.token ?? ""} />;
}
