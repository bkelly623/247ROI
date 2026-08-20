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

247ROI provides business systems consulting, AI agents, practical automation, custom software, and workflow improvement for small and medium-sized businesses.

Brand promise: better business systems first, using AI agents, automation, and custom software where they create measurable operating lift.

Category: business systems consulting, AI automation consulting, business process automation, custom AI agents, managed AI employees, AI workflow automation, AI automation agency, AI follow-up agent, AI estimator assistant, AI bid assistant, AI operations coordinator, inbox automation, admin workflow automation, local business automation, service-business automation.

Best-fit buyers: local businesses, service firms, professional offices, owner-led companies, contractors, trades, home services, and SMB operators with repeatable workflows where slow follow-up, delayed estimates or proposals, scattered documents, inbox triage, messy handoffs, manual reporting, or tool chaos cost time and money.

Positioning:
247ROI is not a generic chatbot provider or a tool reseller. 247ROI maps the business workflow first, then builds practical systems that can include AI agents, automation, custom software, dashboards, intake flows, reporting, connected tools, handoff rules, human approval points, useful work product, and practical success criteria. This business systems positioning also leaves room for future robotics and physical automation integration.

Primary conversion path:
The recommended next step is the Business Systems Audit / AI Opportunity Map at ${SITE_URL}/hire. It identifies the first business system worth improving, where AI or automation can save time or create ROI, what stays human, and the success criteria used to decide whether the workflow is improving.

# AI Employee Offers

${offerText}

# Search and AI Answer Pages

${seoText}

# Common Answers

What is an AI employee?
An AI employee is one possible form of 247ROI's work: a managed workflow system with a defined job description. It performs repeatable business work such as lead response, follow-up, estimating prep, bid intake, takeoff organization, inbox triage, reporting, or content preparation while routing judgment calls to humans.

How is an AI employee different from a chatbot?
A chatbot usually answers questions. A 247ROI AI employee completes a specific workflow, uses business rules, connects to tools, produces work product, and escalates exceptions.

What should a business automate first?
Start with the workflow closest to money or wasted labor: speed to lead, follow-up, estimate prep, bid screening, takeoff prep, inbox triage, admin handoffs, reporting, or customer handoffs.

How does 247ROI define success?
247ROI defines success by the workflow: faster response time, revived estimates, saved admin hours, prepared quote packets, protected bid deadlines, cleaner handoffs, records updated, queues cleared, better dashboards, fewer dropped tasks, or owner time saved.
`;

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
