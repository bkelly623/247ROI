import { ContactForm } from "@/components/contact/ContactForm";

export const metadata = {
  title: "SMS Consent | 247ROI LLC",
  description: "Optional SMS consent and service inquiries for 247ROI LLC.",
};

export default function ConsentPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-24 text-foreground">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="font-display text-4xl font-semibold">247ROI LLC SMS consent</h1>
        <p className="leading-relaxed text-muted-foreground">Use this form to contact us and, if you choose, opt in to service-related texts. Service messages and service-related review requests have separate optional checkboxes; both start unchecked. Calling us alone does not provide SMS consent. The listed message types describe the scope of your permission, not a promise that every automation is currently available.</p>
        <ContactForm source="consent" />
      </div>
    </main>
  );
}
