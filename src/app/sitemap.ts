import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getTranscriptsIndex } from "@/lib/transcripts";

const INDEXABLE_PATHS = [
  "/",
  "/services",
  "/demo",
  "/calendar",
  "/missed-call-calculator",
  "/plumbing-ai-receptionist",
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

  const transcripts = await getTranscriptsIndex();
  const transcriptUrls = transcripts.map((t) => ({
    url: `${SITE_URL}/transcripts/${t.slug}`,
    lastModified,
  }));

  return [...baseUrls, ...transcriptUrls];
}

