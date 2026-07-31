import type { Metadata } from "next";
import SeoLandingPage from "@/components/SeoLandingPage";
import { getSeoLandingPage, seoPageJsonLd } from "@/lib/seoLandingPages";

const page = getSeoLandingPage("ai-lead-response-system")!;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: `/${page.slug}` },
};

export default function RoutePage() {
  return (
    <>
      {seoPageJsonLd(page).map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />
      ))}
      <SeoLandingPage page={page} />
    </>
  );
}
