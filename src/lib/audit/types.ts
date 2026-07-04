export type AuditSectionKey = "ai" | "seo" | "reputation" | "social";

export type WarmTier = "cold" | "warm_b" | "warm_a" | "hot" | "client";

export type SessionMode = "organic" | "rep";

export type SessionStatus =
  | "started"
  | "gate_pending"
  | "scanning"
  | "gate_complete"
  | "complete"
  | "failed";

export interface AuditSection {
  key: AuditSectionKey;
  label: string;
  plainQuestion: string;
  score: number;
  summary: string;
  topFix: string;
}

export interface AuditDeficit {
  severity: "critical" | "warning" | "info";
  finding: string;
  fix: string;
  category: AuditSectionKey;
}

export interface PackageRecommendation {
  id: string;
  headline: string;
  description: string;
  priceFrame: "as_low_as_99" | "custom" | "contact";
  ctaLabel: string;
  ctaUrl?: string;
}

export interface SiteAnnotation {
  id: string;
  label: string;
  detail: string;
  x: number;
  y: number;
  status: "problem" | "fixed";
}

export interface AuditReport {
  opportunityIndex: number;
  opportunityHeadline: string;
  sections: AuditSection[];
  deficits: AuditDeficit[];
  packages: {
    primary: PackageRecommendation;
    secondary: PackageRecommendation;
  };
  guideSteps: string[];
  sitePreview: {
    businessName: string;
    websiteUrl?: string;
    screenshotUrl?: string;
    beforeAnnotations: SiteAnnotation[];
    afterAnnotations: SiteAnnotation[];
  };
  socialFindings?: {
    found: string[];
    notLinked: string[];
    note: string;
  };
  revenueInsight?: {
    monthlyLeakEstimate: number;
    reasoning: string;
  };
  progressEvents: string[];
  advisorSteps?: string[];
  executiveSummary?: string;
  salesHook?: string;
}

export interface ScanSession {
  id: string;
  business_name: string;
  website_url: string;
  zip_code: string;
  mode: SessionMode;
  status: SessionStatus;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  report?: AuditReport | null;
  warm_tier: WarmTier;
  created_at: string;
}

export interface GatePayload {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface StartScanPayload {
  businessName: string;
  websiteUrl: string;
  zipCode: string;
  mode?: SessionMode;
  repToken?: string;
}

export const SECTION_META: Record<
  AuditSectionKey,
  { label: string; plainQuestion: string; icon: string }
> = {
  ai: {
    label: "AI Visibility",
    plainQuestion: "Can AI recommend you?",
    icon: "sparkles",
  },
  seo: {
    label: "Google Search",
    plainQuestion: "Can customers find you on Google?",
    icon: "search",
  },
  reputation: {
    label: "Reputation",
    plainQuestion: "Do you look trustworthy online?",
    icon: "star",
  },
  social: {
    label: "Social Presence",
    plainQuestion: "Are you visible where people scroll?",
    icon: "share",
  },
};

export const SERVICE_CATALOG: Record<
  string,
  { name: string; description: string; tiesTo: AuditSectionKey[] }
> = {
  foundation: {
    name: "Smart Site Foundation",
    description:
      "A fast, AI-ready website built to rank on Google and get recommended by ChatGPT and other AI tools.",
    tiesTo: ["ai", "seo"],
  },
  ai_visibility: {
    name: "AI Visibility Growth Program",
    description:
      "End-to-end AI visibility — citation layers, entity optimization, schema, and integrated SEO, reputation, and social signals so ChatGPT and Google AI recommend you first.",
    tiesTo: ["ai", "seo", "reputation", "social"],
  },
  seo_engine: {
    name: "SEO Growth Engine",
    description:
      "Fix technical issues and publish local content so you show up when people search for your services.",
    tiesTo: ["seo"],
  },
  reputation: {
    name: "Review & Reputation System",
    description:
      "Automated review requests and responses so your online reputation builds itself after every job.",
    tiesTo: ["reputation"],
  },
  social_authority: {
    name: "Social Authority Pipeline",
    description:
      "Consistent project spotlights and short-form content so your brand stays alive where customers scroll.",
    tiesTo: ["social"],
  },
  ai_voice: {
    name: "AI Receptionist",
    description:
      "Never miss another call — AI answers, qualifies, and books appointments around the clock.",
    tiesTo: ["ai", "social"],
  },
  missed_call: {
    name: "Missed-Call Text-Back",
    description:
      "Instant text when you miss a call — rescue the lead before they call your competitor.",
    tiesTo: ["reputation"],
  },
  paid_ads: {
    name: "Local Paid Ads",
    description:
      "Targeted ads that put your business in front of ready-to-buy customers in your service area.",
    tiesTo: ["seo", "social"],
  },
  lead_reactivation: {
    name: "Lead Reactivation",
    description:
      "Turn old quotes and dormant contacts into booked jobs with automated follow-up.",
    tiesTo: ["reputation"],
  },
};
