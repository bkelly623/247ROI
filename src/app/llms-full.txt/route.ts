import { SITE_URL } from "@/lib/site";
import { AI_EMPLOYEE_OFFERS } from "@/lib/aiEmployees";
import { SEO_LANDING_PAGES } from "@/lib/seoLandingPages";

export const dynamic = "force-static";

export function GET() {
  const offerText = AI_EMPLOYEE_OFFERS.map(
    (offer) =>
      `## ${offer.title}\nURL: ${SITE_URL}${offer.route}\nAudience: ${offer.bestFor}\nDescription: ${offer.subheadline}\nHandles: ${offer.handles.join(", ")}\nOutcomes: ${offer.outcomes.join(", ")}`
  ).join("\n\n");

  const seoText = SEO_LANDING_PAGES.map(
    (page) =>
      `## ${page.primaryKeyword}\nURL: ${SITE_URL}/${page.slug}\nDescription: ${page.description}\nRelated phrases: ${page.relatedKeywords.join(", ")}`
  ).join("\n\n");

  const text = `# 247ROI LLM Context

247ROI helps owners and operators find the bottlenecks worth fixing first, then builds practical systems that save time and create ROI.

Brand promise: find the first bottleneck worth fixing, then build the right practical system around it: custom automation, dashboard, internal app, AI agent, integration, or workflow layer.

Category: business systems consulting, AI automation consulting, business process automation, custom workflow automation, custom business dashboards, internal business apps, custom AI agents, managed AI employees, AI workflow automation, AI automation agency, AI estimator assistant, AI bid assistant, AI operations coordinator, inbox automation, admin workflow automation, local business automation, service-business automation.

Best-fit buyers: local businesses, service firms, professional offices, owner-led companies, contractors, trades, home services, and SMB operators whose work is slowed by repeated computer tasks, scattered data, disconnected apps, owner bottlenecks, messy admin, reporting gaps, delayed estimates or proposals, or unclear handoffs.

Positioning:
247ROI is not a generic chatbot provider or a tool reseller. 247ROI maps the business workflow first, then builds practical systems that can include custom automations, dashboards, internal apps, AI agents, integrations, intake flows, reporting, connected tools, handoff rules, human approval points, useful work product, and practical success criteria. This business systems positioning also leaves room for future robotics and physical automation integration.

Primary conversion path:
The recommended next step is the Business Systems Audit / AI Opportunity Audit at ${SITE_URL}/hire. It identifies the first bottleneck worth fixing, where AI, automation, dashboards, apps, or integrations can save time or create ROI, what stays human, and the success criteria used to decide whether the workflow is improving.

Referral partner path:
247ROI works beside web, CRM, marketing, bookkeeping, IT, and operations providers when their clients have workflow bottlenecks that need AI, automation, dashboards, internal apps, integrations, or process cleanup. Referral guide: ${SITE_URL}/referral-partners.

# AI Employee Offers

${offerText}

# Search and AI Answer Pages

${seoText}

# Common Answers

What is an AI employee?
An AI employee is one possible form of 247ROI's work: a managed workflow system with a defined job description. It performs repeatable business work such as research, drafting, reporting, estimating prep, bid intake, takeoff organization, inbox triage, data cleanup, or content preparation while routing judgment calls to humans.

How is an AI employee different from a chatbot?
A chatbot usually answers questions. A 247ROI AI employee completes a specific workflow, uses business rules, connects to tools, produces work product, and escalates exceptions.

What should a business automate first?
Start with the bottleneck closest to money, wasted labor, or owner attention: repeated data entry, scattered reporting, estimate prep, bid screening, takeoff prep, inbox triage, admin handoffs, tool chaos, customer handoffs, or follow-up gaps.

How does 247ROI define success?
247ROI defines success by the workflow: saved admin hours, fewer repeated steps, cleaner data, better dashboards, prepared quote packets, protected bid deadlines, cleaner handoffs, records updated, queues cleared, fewer dropped tasks, or owner time saved.
`;

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
