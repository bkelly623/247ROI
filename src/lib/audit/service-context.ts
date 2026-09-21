import { inferServiceFromName } from "./infer-service";
import type { SiteCrawlResult } from "./probes/site-crawl";

export interface ServiceContext {
  tradeLabel: string;
  servicePhrase: string;
  source: "website" | "business_name" | "unconfirmed";
  evidence?: string;
}

// Only the site's own title, description and H1 are used. Footer boilerplate,
// third-party reviews, and private account data are not classification evidence.
const SERVICES: [RegExp, string, string][] = [
  [/\b(?:AI|artificial intelligence)\b.{0,90}\b(?:automat\w*|consult\w*|employees?|agents?)\b|\bworkflow automation\b/i, "AI & Business Automation", "AI business automation consultant"],
  [/\bmold (?:removal|remediation|inspection|testing)\b/i, "Mold Remediation", "mold remediation company"],
  [/\b(?:roofing|roof repairs?|roof replacement)\b/i, "Roofing", "roofer"],
  [/\b(?:plumbing|plumber)\b/i, "Plumbing", "plumber"],
  [/\b(?:HVAC|heating and cooling|air conditioning)\b/i, "HVAC", "HVAC contractor"],
  [/\b(?:electrician|electrical contractor)\b/i, "Electrical", "electrician"],
  [/\b(?:landscaping|lawn care)\b/i, "Landscaping", "landscaping company"],
  [/\b(?:pest control|exterminator)\b/i, "Pest Control", "pest control company"],
  [/\b(?:dentist|dental care|dentistry)\b/i, "Dentistry", "dentist"],
  [/\b(?:accounting|accountant|bookkeeping)\b/i, "Accounting", "accounting service"],
  [/\b(?:law firm|attorney|lawyer)\b/i, "Legal Services", "law firm"],
  [/\b(?:managed IT|IT support|IT services)\b/i, "IT Services", "IT support company"],
  [/\b(?:web design|website design|web development)\b/i, "Website Services", "web design company"],
  [/\b(?:digital marketing|SEO agency|marketing agency)\b/i, "Marketing", "digital marketing agency"],
  [/\b(?:house cleaning|commercial cleaning|cleaning services)\b/i, "Cleaning", "cleaning service"],
];

export function inferServiceContext(businessName: string, site: Pick<SiteCrawlResult, "title" | "metaDescription" | "h1Text">): ServiceContext {
  const evidence = [site.title, site.h1Text, site.metaDescription].filter(Boolean).join(" — ").slice(0, 1200);
  for (const [pattern, tradeLabel, servicePhrase] of SERVICES) {
    if (pattern.test(evidence)) return { tradeLabel, servicePhrase, source: "website", evidence };
  }
  const inferred = inferServiceFromName(businessName);
  if (!inferred.tradeLabel.includes("unconfirmed")) return { ...inferred, source: "business_name", evidence: businessName };
  return { ...inferred, source: "unconfirmed" };
}
