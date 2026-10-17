import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";

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
        <p className="leading-relaxed text-muted-foreground">Use this form to contact 247ROI LLC. If you want text replies about your inquiry and related follow-up, check the optional SMS box. It starts unchecked, and you can submit without agreeing to texts.</p>
        <ContactForm source="consent" />
      </div>
    </main>
  );
}
