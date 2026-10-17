import type { Metadata } from "next";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";
export const metadata: Metadata = {
  title: "Terms of Service | 247ROI",
  description: "Terms of Service for 247ROI.",
  alternates: { canonical: "/terms-of-service" },
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-[38px] lg:text-[48px] font-semibold text-gray-900 tracking-tight leading-[1.1] mb-6">
          Terms of Service
        </h1>

        <div className="space-y-8 text-gray-700 text-[18px] leading-relaxed tracking-tight">
          <p>247ROI LLC</p>

          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-4">SMS Messaging Terms &amp; Compliance</h2>

            <div className="space-y-6">
              <div>
                <p className="font-medium text-gray-900">1. Program Description:</p>
                <p className="mt-2">
                  The 247ROI LLC SMS program sends optional website form inquiry confirmations and related inquiry follow-up. You can enroll on our{" "}
                  <a href="/contact" className="underline underline-offset-2 hover:text-gray-900">
                    contact form
                  </a>{" "}
                  by checking the optional SMS checkbox, which is specific to text messages and starts unchecked. Consent is not a condition of submitting the form or purchasing services. We do not send promotional marketing messages through this program.
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-900">2. Cancellation Instructions:</p>
                <p className="mt-2">
                  <strong>You can cancel the SMS service at any time. Reply &quot;STOP&quot; to the
                  number that sent you messages, or clearly tell us you no longer want texts.
                  Replying STOP will trigger one final opt-out acknowledgement; no further program messages will be sent.
                  Other clear opt-out requests also stop program messages, without a promised SMS acknowledgement.
                  To request restarting messages after opting out, contact our support team.</strong>
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-900">3. Support Information:</p>
                <p className="mt-2">
                  <strong>If you experience issues with the messaging program, reply with the keyword
                  &quot;HELP&quot; for more assistance, or reach out directly to{" "}
                  <a
                    href="mailto:brendan@get247roi.com"
                    className="underline underline-offset-2 hover:text-gray-900"
                  >
                    brendan@get247roi.com
                  </a>{" "}
                  or call{" "}
                  <a href={PRIMARY_PHONE_HREF} className="underline underline-offset-2 hover:text-gray-900">
                    {PRIMARY_PHONE_DISPLAY}
                  </a>{" "}
                  during business hours.</strong>
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-900">4. Carrier Liability:</p>
                <p className="mt-2">Carriers are not liable for delayed or undelivered messages.</p>
              </div>

              <div>
                <p className="font-medium text-gray-900">5. Message &amp; Data Rates:</p>
                <p className="mt-2">
                  Message and data rates may apply for messages sent to you from us and to us from
                  you. Message frequency varies based on your inquiry.
                  For questions about your text plan or data plan, contact your wireless
                  provider.
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-900">6. Supported Carriers:</p>
                <p className="mt-2">
                  Our SMS program works with all major U.S. wireless carriers, including AT&amp;T,
                  T-Mobile, Verizon, Sprint, and most regional carriers.
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-900">7. Age Restriction:</p>
                <p className="mt-2">You must be 18 years or older to participate in our SMS program.</p>
              </div>

              <div>
                <p className="font-medium text-gray-900">8. Privacy Policy:</p>
                <p className="mt-2">
                  For privacy-related inquiries, please refer to our Privacy Policy at{" "}
                  <a
                    href="https://www.get247roi.com/privacy-policy"
                    className="underline underline-offset-2 hover:text-gray-900"
                  >
                    https://www.get247roi.com/privacy-policy
                  </a>
                </p>
              </div>
            </div>

          </div>

          <hr className="border-gray-200 my-10" />

          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-4">General Terms</h2>
            <p>
              This website (the &quot;Site&quot;) is owned and operated by 247ROI LLC (&quot;COMPANY,&quot; &quot;we&quot; or &quot;us&quot;). By using
              the Site, you agree to be bound by these Terms of Service and to use the Site in
              accordance with these Terms of Service, our Privacy Policy, and any additional terms
              and conditions that may apply.
            </p>
            <p className="mt-4">We reserve the right to change these Terms at any time.</p>

            <div className="mt-6 space-y-4">
              <div>
                <p className="font-medium text-gray-900">Intellectual Property Rights:</p>
                <p className="mt-1">
                  All materials on this Site are owned by 247ROI LLC.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Disclaimers:</p>
                <p className="mt-1">All services are provided &quot;as is&quot; without warranties.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Termination:</p>
                <p className="mt-1">We reserve the right to terminate access at any time.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Governing Law:</p>
                <p className="mt-1">These Terms shall be governed by the laws of the State of Pennsylvania.</p>
              </div>
            </div>
          </div>

          <div>
            <p className="font-medium text-gray-900">Contact Information:</p>
            <p className="mt-2">247ROI LLC</p>
            <p className="mt-2">
              Phone:{" "}
              <a href={PRIMARY_PHONE_HREF} className="underline underline-offset-2 hover:text-gray-900">
                {PRIMARY_PHONE_DISPLAY}
              </a>
            </p>
            <p className="mt-2">
              Email:{" "}
              <a
                href="mailto:brendan@get247roi.com"
                className="underline underline-offset-2 hover:text-gray-900"
              >
                brendan@get247roi.com
              </a>
            </p>
            <p className="mt-2">
              Website:{" "}
              <a
                href="https://www.get247roi.com"
                className="underline underline-offset-2 hover:text-gray-900"
              >
                https://www.get247roi.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
