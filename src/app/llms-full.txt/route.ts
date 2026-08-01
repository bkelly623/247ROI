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

247ROI builds managed AI employees and workflow automation systems for small and medium-sized service businesses.

Brand promise: AI that works 24/7 on useful business workflows.

Category: AI employees, managed AI employees, custom AI agents, AI workflow automation, AI automation agency, AI follow-up agent, AI estimator assistant, AI bid assistant, AI takeoff assistant, AI operations coordinator, inbox automation, admin workflow automation, contractor workflow automation, service-business automation.

Best-fit buyers: service businesses, contractors, trades, home services, local companies, and SMB operators with repeatable workflows where slow follow-up, delayed estimates, scattered documents, bid intake, inbox triage, messy handoffs, or manual reporting cost money.

Positioning:
247ROI is not a generic chatbot provider. 247ROI builds AI employees with job descriptions, connected tools, triggers, handoff rules, human approval points, useful work product, and practical success criteria.

Primary conversion path:
The recommended next step is an AI employee audit at ${SITE_URL}/hire. The audit identifies the first AI employee worth building, the workflow it should own, what stays human, and the success criteria used to decide whether the workflow is improving.

# AI Employee Offers

${offerText}

# Search and AI Answer Pages

${seoText}

# Common Answers

What is an AI employee?
An AI employee is a managed workflow system with a defined job description. It performs repeatable business work such as lead response, follow-up, estimating prep, bid intake, takeoff organization, inbox triage, reporting, or content preparation while routing judgment calls to humans.

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
