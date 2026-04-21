import Script from "next/script";

export const metadata = {
  title: "Consent | 247ROI",
  description: "SMS and service consent form for 247ROI.",
};

export default function ConsentPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[32px] lg:text-[40px] font-semibold text-gray-900 tracking-tight leading-tight mb-8 text-center">
          Consent
        </h1>

        <div className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden shadow-sm">
          <iframe
            src="https://api.leadconnectorhq.com/widget/form/SzaVYAYj1ztvwK1cfw8h"
            className="block w-full min-h-[773px] border-0 rounded-[3px]"
            id="inline-SzaVYAYj1ztvwK1cfw8h"
            data-layout="{'id':'INLINE'}"
            data-trigger-type="alwaysShow"
            data-trigger-value=""
            data-activation-type="alwaysActivated"
            data-activation-value=""
            data-deactivation-type="neverDeactivate"
            data-deactivation-value=""
            data-form-name="Consent"
            data-height="773"
            data-layout-iframe-id="inline-SzaVYAYj1ztvwK1cfw8h"
            data-form-id="SzaVYAYj1ztvwK1cfw8h"
            title="Consent"
          />
        </div>
      </div>

      <Script src="https://link.msgsndr.com/js/form_embed.js" strategy="afterInteractive" />
    </main>
  );
}
