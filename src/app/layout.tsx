import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import ChatWidget from "./components/ChatWidget";
import { SITE_URL } from "@/lib/site";
import { PRIMARY_PHONE_HREF } from "@/app/components/cta";

export const metadata: Metadata = {
  title: "247ROI | Revenue That Runs 24/7",
  description:
    "Capture leads, book appointments, and grow revenue around the clock — even while you sleep. AI-powered systems built for businesses that want measurable ROI.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "247ROI | Revenue That Runs 24/7",
    description:
      "Capture leads, book appointments, and grow revenue around the clock — even while you sleep. AI-powered systems built for businesses that want measurable ROI.",
    url: SITE_URL,
    siteName: "247ROI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/site-logo.png",
        alt: "247ROI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "247ROI | Revenue That Runs 24/7",
    description:
      "Capture leads, book appointments, and grow revenue around the clock — even while you sleep. AI-powered systems built for businesses that want measurable ROI.",
    images: ["/site-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "247ROI",
    url: SITE_URL,
    logo: `${SITE_URL}/site-logo.png`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: PRIMARY_PHONE_HREF.replace(/^tel:/, ""),
        contactType: "customer service",
        areaServed: "US",
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen">
        <Providers>{children}</Providers>
        <ChatWidget />
      </body>
    </html>
  );
}
