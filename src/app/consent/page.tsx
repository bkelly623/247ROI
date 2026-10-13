import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { MissedCallNotice } from "@/components/contact/MissedCallNotice";

export const metadata: Metadata = {
  title: "SMS Consent | 247ROI LLC",
  description: "Optional SMS consent and service inquiries for 247ROI LLC.",
  alternates: { canonical: "/consent" },
};

export default function ConsentPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-24 text-foreground">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="font-display text-4xl font-semibold">247ROI LLC SMS consent</h1>
        <p className="leading-relaxed text-muted-foreground">Use this form to contact us and, if you choose, opt in to service-related texts. Service messages and service-related review requests have separate optional checkboxes; both start unchecked. Calling does not enroll you in ongoing service updates, review requests, or marketing. The listed message types describe the scope of your permission, not a promise that every automation is currently available.</p>
        <div className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Missed-call replies</h2>
          <MissedCallNotice />
        </div>
        <ContactForm source="consent" />
      </div>
    </main>
  );
}
