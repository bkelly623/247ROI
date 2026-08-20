import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import ConditionalChatWidget from "./components/ConditionalChatWidget";
import { SITE_URL } from "@/lib/site";
import { PRIMARY_PHONE_HREF } from "@/app/components/cta";

export const metadata: Metadata = {
  title: "247ROI | Business Systems, AI Agents & Automation",
  description:
    "247ROI helps business owners build better business systems with AI agents, automation, custom software, and workflow improvement.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "247ROI | Business Systems, AI Agents & Automation",
    description:
      "247ROI helps business owners build better business systems with AI agents, automation, custom software, and workflow improvement.",
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
    title: "247ROI | Business Systems, AI Agents & Automation",
    description:
      "247ROI helps business owners build better business systems with AI agents, automation, custom software, and workflow improvement.",
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
    slogan: "Better business systems using AI agents, automation, and custom software.",
    knowsAbout: [
      "business systems consulting",
      "business process automation",
      "AI automation consulting",
      "business systems audit",
      "AI opportunity map",
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
      "custom software workflows",
      "robotics integration planning",
      "local business automation",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "247ROI",
    url: SITE_URL,
    description:
      "Business systems consulting, AI agents, automation, custom software, and workflow improvement for business owners.",
    inLanguage: "en-US",
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
