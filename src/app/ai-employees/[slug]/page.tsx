import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AiEmployeeLandingPage from "@/components/AiEmployeeLandingPage";
import { AI_EMPLOYEE_OFFERS, getAiEmployeeOffer } from "@/lib/aiEmployees";

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
  };
}

export default async function AiEmployeeOfferRoutePage({ params }: PageProps) {
  const { slug } = await params;
  const offer = getAiEmployeeOffer(slug);

  if (!offer) {
    notFound();
  }

  return <AiEmployeeLandingPage offer={offer} />;
}
