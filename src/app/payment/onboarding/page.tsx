import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Retire the form without treating an old token or query flag as proof of payment.
// Existing browser credentials and protected backend endpoints remain unchanged.
export default function RetiredOnboardingPage() {
  redirect("/payment/confirmation");
}
