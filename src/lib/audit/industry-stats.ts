import type { GrowthTier } from "./types";

export const INDUSTRY_STATS = [
  {
    label: "Consumers using AI for local recommendations",
    value: "58%",
    trend: "up",
    detail: "Growing monthly — especially homeowners under 45",
  },
  {
    label: "Traditional Google clicks vs 2022",
    value: "-22%",
    trend: "down",
    detail: "Zero-click and AI answers absorb top-of-funnel search",
  },
  {
    label: "Avg. value of one booked service job",
    value: "$4,200",
    trend: "neutral",
    detail: "Trades & home services — one missed lead hurts",
  },
  {
    label: "Businesses with AI-readable schema",
    value: "<12%",
    trend: "opportunity",
    detail: "First movers in your zip still have the window",
  },
] as const;

export const GROWTH_TIERS: GrowthTier[] = [
  {
    id: "foundation",
    name: "Smart Site Foundation",
    priceLabel: "$99/mo",
    monthlyPrice: 99,
    lifts: { aiMention: 15, googleRank: 1, leadCapture: 10 },
    features: [
      "AI-ready site infrastructure",
      "LocalBusiness schema + speed",
      "Service area pages",
      "Click-to-call + lead capture",
    ],
  },
  {
    id: "growth",
    name: "Growth Automation",
    priceLabel: "$297/mo",
    monthlyPrice: 297,
    lifts: { aiMention: 25, googleRank: 2, leadCapture: 20 },
    features: [
      "Everything in Foundation",
      "Automated review requests",
      "Local SEO monitoring",
      "Entity-linked social profiles",
      "Monthly performance reports",
    ],
  },
  {
    id: "ai_visibility",
    name: "AI Visibility Program",
    priceLabel: "From $497/mo",
    monthlyPrice: 497,
    lifts: { aiMention: 45, googleRank: 3, leadCapture: 35 },
    features: [
      "Everything in Growth",
      "Multi-LLM citation layers",
      "AI mention tracking (ChatGPT, Gemini, Claude)",
      "Content engineered for AI retrieval",
      "Hands-on strategy + optimization",
    ],
  },
];
