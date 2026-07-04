import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import ConditionalChatWidget from "./components/ConditionalChatWidget";
import { SITE_URL } from "@/lib/site";
import { PRIMARY_PHONE_HREF } from "@/app/components/cta";

export const metadata: Metadata = {
  title: "247ROI | AI Employees for SMB Operations",
  description:
    "Managed AI employees for small and medium-sized businesses: lead response, follow-up, estimating support, bidding prep, and operational coordination.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "247ROI | AI Employees for SMB Operations",
    description:
      "Managed AI employees for small and medium-sized businesses: lead response, follow-up, estimating support, bidding prep, and operational coordination.",
    url: SITE_URL,
    siteName: "247ROI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        alt: "247ROI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "247ROI | AI Employees for SMB Operations",
    description:
      "Managed AI employees for small and medium-sized businesses: lead response, follow-up, estimating support, bidding prep, and operational coordination.",
    images: ["/twitter-image"],
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
        <ConditionalChatWidget />
      </body>
    </html>
  );
}
