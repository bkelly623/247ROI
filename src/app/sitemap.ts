import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getTranscriptsIndex } from "@/lib/transcripts";
import { AI_EMPLOYEE_OFFERS } from "@/lib/aiEmployees";

const INDEXABLE_PATHS = [
  "/",
  "/hire",
  "/services",
  "/ai-employees",
  "/demo",
  "/contact",
  "/pricing",
  "/missed-call-calculator",
  "/plumbing-ai-receptionist",
  "/hvac-ai-receptionist",
  "/roofing-estimate-follow-up",
  "/ai-estimator",
  "/ai-follow-up-agent",
  "/contractor-bid-assistant",
  "/privacy-policy",
  "/terms-of-service",
  "/consent",
  "/guarantee",
  "/terms",
  "/transcripts",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const baseUrls = INDEXABLE_PATHS.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified,
  }));

  const aiEmployeeUrls = AI_EMPLOYEE_OFFERS.map((offer) => ({
    url: `${SITE_URL}${offer.route}`,
    lastModified,
  }));

  const transcripts = await getTranscriptsIndex();
  const transcriptUrls = transcripts.map((t) => ({
    url: `${SITE_URL}/transcripts/${t.slug}`,
    lastModified,
  }));

  return [...baseUrls, ...aiEmployeeUrls, ...transcriptUrls];
}
