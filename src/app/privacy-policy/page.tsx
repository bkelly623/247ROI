import type { Metadata } from "next";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";
export const metadata: Metadata = {
  title: "Privacy Policy | 247ROI",
  description: "Privacy Policy for 247ROI.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-[38px] lg:text-[48px] font-semibold text-gray-900 tracking-tight leading-[1.1] mb-6">
          Privacy Policy
        </h1>

        <div className="space-y-8 text-gray-700 text-[18px] leading-relaxed tracking-tight">
          <p>247ROI LLC</p>

          <div>
            <p className="font-semibold text-gray-900 uppercase tracking-tight text-[15px]">
              IMPORTANT NOTICE REGARDING TEXT MESSAGING DATA
            </p>
            <p className="mt-4">
              247ROI LLC (&quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;) DOES NOT share customer opt-in information, including phone numbers
              and consent records, with any affiliates or third parties for marketing, promotional,
              or any other purposes unrelated to providing our direct services. All text messaging
              originator opt-in data is kept strictly confidential.
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-900">Personal Information:</p>
                <ul className="mt-2 space-y-1 list-disc pl-6">
                  <li>Name, email address, phone number</li>
                  <li>Payment information when applicable</li>
                  <li>Opt-in records and timestamps</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900">Non-Personal Information:</p>
                <ul className="mt-2 space-y-1 list-disc pl-6">
                  <li>IP address, browser type, device info</li>
                  <li>Website usage data</li>
                  <li>Cookies and tracking technologies</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900">Customer Communication:</p>
                <ul className="mt-2 space-y-1 list-disc pl-6">
                  <li>Service inquiries</li>
                  <li>AI employee audit and service inquiry details</li>
                  <li>Communication history</li>
                </ul>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p>We use collected data to:</p>
            <ul className="mt-3 space-y-1 list-disc pl-6">
              <li>Provide and improve services</li>
              <li>Respond to AI employee audit and service inquiries</li>
              <li>Communicate with customers</li>
              <li>Maintain records of consent</li>
              <li>Ensure security and fraud prevention</li>
            </ul>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-4">3. SMS Messaging &amp; Compliance</h2>
            <p className="mb-4">
              Our SMS program sends optional website form inquiry confirmations and related inquiry follow-up from 247ROI LLC. You enroll by checking the optional SMS checkbox on our contact form. It starts unchecked, and consent is not required to submit the form or purchase services. We do not send promotional marketing messages through this program.
            </p>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-900">Opt-In &amp; Consent:</p>
                <ul className="mt-2 space-y-1 list-disc pl-6">
                  <li>When you submit the form, we record your phone number, whether you checked the SMS box, the submission timestamp, and the disclosure version and text shown to you.</li>
                  <li>Records of consent are maintained.</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900">Opt-Out:</p>
                <ul className="mt-2 space-y-1 list-disc pl-6">
                  <li>Reply STOP to unsubscribe. Replying STOP will trigger one final opt-out acknowledgement; no further program messages will be sent.</li>
                  <li>Other clear opt-out requests also stop program messages, without a promised SMS acknowledgement.</li>
                  <li>To request restarting messages after opting out, contact support.</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900">Message Frequency:</p>
                <ul className="mt-2 space-y-1 list-disc pl-6">
                  <li>Varies based on your inquiry</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900">Help:</p>
                <ul className="mt-2 space-y-1 list-disc pl-6">
                  <li>
                    Reply HELP or contact{" "}
                    <a
                      href="mailto:brendan@get247roi.com"
                      className="underline underline-offset-2 hover:text-gray-900"
                    >
                      brendan@get247roi.com
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900">Carrier Disclaimer:</p>
                <ul className="mt-2 space-y-1 list-disc pl-6">
                  <li>Carriers are not liable for delayed or undelivered messages</li>
                  <li>Message and data rates may apply</li>
                </ul>
              </div>
            </div>
          </div>

          <p>For telephone inquiries, we may send an informational response about your call. Reply STOP to opt out.</p>

          <hr className="border-gray-200" />

          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-4">SMS Data Protection Statement:</h2>
            <p>
              No mobile information will be shared with third parties/affiliates for
              marketing/promotional purposes. Information sharing to subcontractors in support
              services is permitted. All other use case categories exclude text messaging originator
              opt-in data and consent; this information will not be shared with any third parties.
            </p>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
            <p className="mb-4">We do not sell or rent personal data.</p>
            <p>We may share data with:</p>
            <ul className="mt-3 space-y-1 list-disc pl-6">
              <li>Service providers (for operations). Website inquiries are saved in private storage and routed to the business owner through an internal messaging notification so we can respond and follow up.</li>
              <li>SMS providers (delivery only)</li>
              <li>Legal authorities if required</li>
            </ul>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p>
              We implement reasonable safeguards including encryption, access control, and
              monitoring.
            </p>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-4">6. Cookies &amp; Tracking</h2>
            <p>We use cookies to:</p>
            <ul className="mt-3 space-y-1 list-disc pl-6">
              <li>Improve user experience</li>
              <li>Analyze traffic</li>
              <li>Optimize performance</li>
            </ul>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-4">7. Your Rights</h2>
            <p>You may:</p>
            <ul className="mt-3 space-y-1 list-disc pl-6">
              <li>Access or update your data</li>
              <li>Request deletion</li>
              <li>Opt-out of communications</li>
            </ul>
            <p className="mt-4">
              Contact:{" "}
              <a
                href="mailto:brendan@get247roi.com"
                className="underline underline-offset-2 hover:text-gray-900"
              >
                brendan@get247roi.com
              </a>
            </p>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-4">8. Third-Party Links</h2>
            <p>We are not responsible for external websites.</p>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-4">9. Updates</h2>
            <p>We may update this policy. Changes will be posted on this page.</p>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 mb-4">10. Contact</h2>
            <p>247ROI LLC</p>
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
