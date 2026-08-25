import type { Metadata } from "next";
import Link from "next/link";
import { HireAuditFlow } from "@/components/hire/HireAuditFlow";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Business Systems Audit & AI Opportunity Audit | 247ROI",
  description:
    "Find the first business system worth improving with AI, automation, custom software, or better workflow design.",
  alternates: { canonical: "/hire" },
  openGraph: {
    title: "Business Systems Audit & AI Opportunity Audit | 247ROI",
    description:
      "Find the first business system worth improving with AI, automation, custom software, or better workflow design.",
    url: "/hire",
  },
};

const auditOutputs = [
  "The first bottleneck worth fixing, based on money, time, handoffs, visibility, and owner attention.",
  "A plain-English workflow map showing where the current process breaks or depends on memory.",
  "A practical recommendation: automation, AI agent, dashboard, internal app, integration, cleanup, or keep it human.",
  "Human approval rules for pricing, sensitive messages, exceptions, and judgment calls.",
  "Success criteria for deciding whether the first system is actually saving time or creating ROI.",
];

const firstFitWorkflows = [
  {
    title: "Lead response and follow-up",
    body: "Slow replies, missed calls, stale estimates, after-hours inquiries, and leads that never make it back into the CRM.",
  },
  {
    title: "Inbox, admin, and handoffs",
    body: "Repeated computer work across inboxes, spreadsheets, portals, calendars, documents, and customer records.",
  },
  {
    title: "Owner visibility",
    body: "Dashboards and internal tools that turn scattered updates into one operating picture with clear next actions.",
  },
  {
    title: "AI-assisted work product",
    body: "Research, summaries, drafts, reports, bid prep, estimate prep, and handoff notes that a human can review.",
  },
];

const notAFit = [
  "The workflow is rare, vague, or not repeated enough to justify a system.",
  "The business wants AI to make final pricing, legal, financial, or sensitive decisions without review.",
  "There is no clear owner for approving outputs, testing changes, or measuring whether the workflow improved.",
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Business Systems Audit and AI Opportunity Audit",
    provider: {
      "@type": "Organization",
      name: "247ROI",
      url: SITE_URL,
    },
    areaServed: "United States",
    serviceType: "Business systems audit, AI opportunity audit, business process automation consulting",
    description:
      "A guided audit that identifies the first business bottleneck worth fixing and recommends whether AI, automation, a dashboard, internal app, integration, custom software, or human workflow cleanup is the right next move.",
    url: `${SITE_URL}/hire`,
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is an AI Opportunity Audit?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "An AI Opportunity Audit identifies the business workflow most worth improving first, then decides whether AI, automation, dashboards, internal apps, integrations, custom software, or process cleanup is the right solution.",
        },
      },
      {
        "@type": "Question",
        name: "What should a business automate first?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Start with the bottleneck closest to money, wasted labor, owner attention, dropped handoffs, or poor visibility. Common examples include lead response, follow-up, reporting, CRM updates, inbox triage, estimate prep, bid intake, and admin handoffs.",
        },
      },
      {
        "@type": "Question",
        name: "Does every business process need AI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Some workflows need traditional automation, a dashboard, an internal app, better data flow, or clearer human approval rules. The audit exists to avoid buying AI when another system would solve the problem better.",
        },
      },
    ],
  },
];

export default function HirePage() {
  return (
    <>
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />
      ))}
      <HireAuditFlow />
      <section className="border-t border-zinc-800 bg-zinc-950 px-5 py-16 text-zinc-100 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
              AI Opportunity Audit
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
              The useful first move is finding the system worth building.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg">
              247ROI audits the work before recommending the technology. The goal is to find the bottleneck where a
              practical system can save time, protect revenue, improve visibility, or remove owner drag.
            </p>
          </div>
          <div className="grid gap-3">
            {auditOutputs.map((output) => (
              <div key={output} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <p className="text-sm leading-relaxed text-zinc-200">{output}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 text-zinc-950 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Best first targets</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
              Start where repeated work, missed revenue, or unclear handoffs already exist.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {firstFitWorkflows.map((item) => (
              <article key={item.title} className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
                <h3 className="font-display text-2xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50 px-5 py-16 text-zinc-950 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
              What the audit prevents
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
              Not every bottleneck should become an AI project.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-600">
              A serious audit should also rule out weak ideas. 247ROI looks for workflows with enough repetition,
              value, data access, approval clarity, and measurable outcome to justify a build.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="font-display text-2xl font-bold">Usually not a fit</h3>
            <ul className="mt-5 space-y-4">
              {notAFit.map((item) => (
                <li key={item} className="border-l-2 border-zinc-300 pl-4 text-sm leading-relaxed text-zinc-600">
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/services"
              className="mt-7 inline-flex rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:border-orange-500 hover:text-orange-700"
            >
              See 247ROI services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
