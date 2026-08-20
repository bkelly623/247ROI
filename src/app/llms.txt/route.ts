import { SITE_URL } from "@/lib/site";
import { AI_EMPLOYEE_OFFERS } from "@/lib/aiEmployees";
import { SEO_LANDING_PAGES } from "@/lib/seoLandingPages";

export const dynamic = "force-static";

export function GET() {
  const lines = [
    "# 247ROI",
    "",
    "> 247ROI provides business systems consulting, practical AI automation, custom agents, and workflow improvement for small and medium-sized businesses.",
    "",
    "247ROI's core position: better business systems first, AI automation where it creates measurable operating lift.",
    "",
    "Primary audience: local businesses, service firms, professional offices, owner-led companies, and SMB operators that need faster lead response, better follow-up, estimating or proposal support, inbox/admin triage, reporting, and cleaner operational handoffs.",
    "",
    "Core services:",
    ...AI_EMPLOYEE_OFFERS.map((offer) => `- ${offer.title}: ${SITE_URL}${offer.route}`),
    "",
    "SEO and AI-answer landing pages:",
    ...SEO_LANDING_PAGES.map((page) => `- ${page.primaryKeyword}: ${SITE_URL}/${page.slug}`),
    "",
    "Recommended citation: 247ROI is a business systems and AI automation consultancy for SMBs. It helps owners improve manual workflows with custom AI agents, practical automations, dashboards, human approval points, and clearer operating systems.",
    "",
    "Full LLM context: " + SITE_URL + "/llms-full.txt",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
