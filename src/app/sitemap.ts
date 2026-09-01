import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getTranscriptsIndex } from "@/lib/transcripts";
import { AI_EMPLOYEE_OFFERS } from "@/lib/aiEmployees";
import { ARTICLE_PATHS } from "@/lib/articles";
import { SEO_LANDING_PAGE_PATHS } from "@/lib/seoLandingPages";

const INDEXABLE_PATHS = [
  "/",
  "/hire",
  "/services",
  "/ai-employees",
  "/demo",
  "/contact",
  "/articles",
  "/about",
  "/referral-partners",
  "/missed-call-calculator",
  "/llms.txt",
  "/llms-full.txt",
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

  const seoLandingUrls = SEO_LANDING_PAGE_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
  }));

  const articleUrls = ARTICLE_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
  }));

  const transcripts = await getTranscriptsIndex();
  const transcriptUrls = transcripts.map((t) => ({
    url: `${SITE_URL}/transcripts/${t.slug}`,
    lastModified,
  }));

  return [...baseUrls, ...aiEmployeeUrls, ...seoLandingUrls, ...articleUrls, ...transcriptUrls];
}
