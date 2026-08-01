import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AiEmployeeLandingPage from "@/components/AiEmployeeLandingPage";
import { AI_EMPLOYEE_OFFERS, getAiEmployeeOffer } from "@/lib/aiEmployees";
import { SITE_URL } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return AI_EMPLOYEE_OFFERS.map((offer) => ({ slug: offer.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const offer = getAiEmployeeOffer(slug);

  if (!offer) {
    return {};
  }

  return {
    title: `${offer.title} | 247ROI`,
    description: offer.subheadline,
    alternates: { canonical: offer.route },
    openGraph: {
      title: `${offer.title} | 247ROI`,
      description: offer.subheadline,
      url: offer.route,
    },
  };
}

export default async function AiEmployeeOfferRoutePage({ params }: PageProps) {
  const { slug } = await params;
  const offer = getAiEmployeeOffer(slug);

  if (!offer) {
    notFound();
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "AI Employees",
        item: `${SITE_URL}/ai-employees`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: offer.title,
        item: `${SITE_URL}${offer.route}`,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <AiEmployeeLandingPage offer={offer} />
    </>
  );
}
