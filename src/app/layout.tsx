import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import ConditionalChatWidget from "./components/ConditionalChatWidget";
import { SITE_URL } from "@/lib/site";
import { PRIMARY_PHONE_HREF } from "@/app/components/cta";

export const metadata: Metadata = {
  title: "247ROI | AI Employees & Workflow Automation for Service Businesses",
  description:
    "247ROI builds managed AI employees and workflow automation systems for service businesses: lead response, follow-up, estimating prep, bidding, takeoffs, and operations.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "247ROI | AI Employees & Workflow Automation for Service Businesses",
    description:
      "247ROI builds managed AI employees and workflow automation systems for service businesses: lead response, follow-up, estimating prep, bidding, takeoffs, and operations.",
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
    title: "247ROI | AI Employees & Workflow Automation for Service Businesses",
    description:
      "247ROI builds managed AI employees and workflow automation systems for service businesses: lead response, follow-up, estimating prep, bidding, takeoffs, and operations.",
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
    sameAs: [SITE_URL],
    slogan: "AI that works 24/7 and proves ROI.",
    knowsAbout: [
      "AI employees",
      "managed AI employees",
      "AI workflow automation",
      "custom AI agents",
      "AI lead response systems",
      "AI follow-up automation",
      "AI estimator assistant",
      "AI operations coordinator",
      "AI inbox automation",
      "AI admin workflow automation",
      "AI takeoff assistant",
      "contractor workflow automation",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "247ROI",
    url: SITE_URL,
    description:
      "Managed AI employees and workflow automation systems for service businesses.",
    inLanguage: "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?s={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen">
        <Providers>{children}</Providers>
        <ConditionalChatWidget />
      </body>
    </html>
  );
}
