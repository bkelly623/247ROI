import { SITE_URL } from "@/lib/site";

export type SeoLandingPage = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryKeyword: string;
  relatedKeywords: string[];
  buyerProblems: string[];
  systemBuilds: string[];
  faqs: { question: string; answer: string }[];
};

export const SEO_LANDING_PAGES: SeoLandingPage[] = [
  {
    slug: "ai-employees-for-small-business",
    title: "AI Employees for Small Business | 247ROI",
    description:
      "247ROI builds managed AI employees for small businesses that need faster lead response, follow-up, estimating prep, inbox triage, reporting, and workflow automation.",
    eyebrow: "AI employees for small business",
    headline: "Hire AI for the work your team keeps missing, delaying, or repeating.",
    subheadline:
      "247ROI builds managed AI employees with clear job descriptions, connected tools, human approval rules, and practical success criteria for small businesses.",
    primaryKeyword: "AI employees for small business",
    relatedKeywords: [
      "managed AI employees",
      "hire an AI employee",
      "AI workers for small business",
      "AI automation for small business",
      "custom AI agents for business",
    ],
    buyerProblems: [
      "New leads wait too long before someone responds.",
      "Follow-up depends on whoever has time that day.",
      "Owners are buried in inboxes, estimates, summaries, and handoffs.",
      "Software exists, but nobody owns the daily workflow.",
    ],
    systemBuilds: [
      "AI lead response employee",
      "AI follow-up employee",
      "AI estimating prep employee",
      "AI inbox and admin employee",
      "AI reporting and dashboard employee",
    ],
    faqs: [
      {
        question: "What is an AI employee for a small business?",
        answer:
          "An AI employee is a managed workflow system with a specific job description. It handles repeatable tasks such as lead response, follow-up, estimating prep, bid intake, inbox triage, or reporting while escalating judgment calls to a human.",
      },
      {
        question: "Is an AI employee just a chatbot?",
        answer:
          "No. A chatbot answers questions. A useful AI employee completes a defined business workflow, works inside rules, connects to tools, produces work product, and leaves output your team can inspect.",
      },
      {
        question: "How does 247ROI decide which AI employee to build first?",
        answer:
          "247ROI starts with an audit of where time or revenue leaks today, then recommends the first AI employee most likely to save labor, capture revenue, or improve follow-through.",
      },
    ],
  },
  {
    slug: "ai-employees-for-service-businesses",
    title: "AI Employees for Service Businesses | 247ROI",
    description:
      "Managed AI employees for contractors and service businesses: AI receptionist, AI follow-up, AI estimator, AI takeoff assistant, bid assistant, and workflow automation.",
    eyebrow: "AI employees for service businesses",
    headline: "AI employees for the jobs that decide whether service revenue gets captured.",
    subheadline:
      "247ROI helps service businesses capture more leads, respond faster, prepare cleaner estimates, organize bid work, and keep follow-up moving.",
    primaryKeyword: "AI employees for service businesses",
    relatedKeywords: [
      "AI employees for contractors",
      "AI receptionist for contractors",
      "AI follow-up agent",
      "AI estimator for contractors",
      "contractor workflow automation",
    ],
    buyerProblems: [
      "Calls and form leads arrive while the team is on jobs.",
      "Estimates take too long to prepare and follow up.",
      "Bid invites, takeoffs, and job details scatter across tools.",
      "Customers choose whoever responds with confidence first.",
    ],
    systemBuilds: [
      "AI receptionist for call capture and routing",
      "AI follow-up agent for new and stale leads",
      "AI estimator assistant for quote-ready packets",
      "AI takeoff assistant for plan and spec prep",
      "AI bid assistant for opportunity screening",
    ],
    faqs: [
      {
        question: "Which service businesses are a fit for AI employees?",
        answer:
          "The best fit is a business with repeated lead, estimate, bidding, support, or admin workflows where faster execution would save time or protect revenue.",
      },
      {
        question: "Can AI employees work for contractors?",
        answer:
          "Yes. Contractors can use AI employees for missed-call capture, follow-up, estimate prep, takeoff organization, bid screening, review requests, and daily reporting.",
      },
      {
        question: "Does the AI make final pricing or bid decisions?",
        answer:
          "No. 247ROI designs AI employees with human approval points for final pricing, sensitive messages, final bids, and exceptions.",
      },
    ],
  },
  {
    slug: "ai-workflow-automation-agency",
    title: "AI Workflow Automation Agency | 247ROI",
    description:
      "247ROI is an AI workflow automation agency building custom AI agents and managed AI employees for lead response, follow-up, estimating, bidding, and operations.",
    eyebrow: "AI workflow automation agency",
    headline: "Custom AI workflow automation for the work that should not stay manual.",
    subheadline:
      "We map the workflow, write the job spec, connect the tools, define human approvals, and improve the operation without pretending every useful build has a perfect ROI formula.",
    primaryKeyword: "AI workflow automation agency",
    relatedKeywords: [
      "AI automation agency",
      "business process automation with AI",
      "custom AI agents",
      "workflow automation for small business",
      "AI business automation",
    ],
    buyerProblems: [
      "Work moves through too many inboxes, spreadsheets, CRMs, calendars, and portals.",
      "People repeat the same admin tasks every week.",
      "Automation attempts fail because nobody defined the workflow tightly.",
      "The business needs a managed system, not another app to remember.",
    ],
    systemBuilds: [
      "Workflow audit and automation map",
      "Custom AI agent job description",
      "Tool integrations and handoff rules",
      "Human approval and exception logic",
      "Success criteria and ongoing optimization",
    ],
    faqs: [
      {
        question: "What does an AI workflow automation agency do?",
        answer:
          "An AI workflow automation agency designs and builds systems that use AI to complete repeatable business processes across tools, messages, documents, calendars, CRMs, and dashboards.",
      },
      {
        question: "How is 247ROI different from a generic automation tool?",
        answer:
          "247ROI builds around a business workflow, not a tool demo. The goal is to create a managed AI employee that performs a job, leaves useful output, and improves how the business operates.",
      },
      {
        question: "What workflows should be automated first?",
        answer:
          "Start with workflows closest to money or wasted labor: lead response, follow-up, estimate prep, bid intake, inbox triage, reporting, and handoffs.",
      },
    ],
  },
  {
    slug: "ai-lead-response-system",
    title: "AI Lead Response System | 247ROI",
    description:
      "AI lead response systems for service businesses that need faster first touch, better follow-up, missed-call recovery, appointment reminders, and CRM handoffs.",
    eyebrow: "AI lead response system",
    headline: "Respond before the lead calls the next company.",
    subheadline:
      "247ROI builds AI lead response systems that answer, qualify, follow up, remind, reactivate, and hand off leads before revenue leaks out of the pipeline.",
    primaryKeyword: "AI lead response system",
    relatedKeywords: [
      "speed to lead automation",
      "AI follow-up automation",
      "missed call automation",
      "AI receptionist for contractors",
      "after hours lead response",
    ],
    buyerProblems: [
      "Leads arrive after hours or while the team is busy.",
      "The first response takes too long.",
      "Stale estimates do not get reactivated.",
      "No-shows and appointment reminders are inconsistent.",
    ],
    systemBuilds: [
      "Instant SMS and email follow-up",
      "AI receptionist or overflow capture",
      "Qualification and booking prompts",
      "Estimate reactivation sequences",
      "CRM and calendar handoff summaries",
    ],
    faqs: [
      {
        question: "What is an AI lead response system?",
        answer:
          "An AI lead response system contacts new leads quickly, qualifies the opportunity, captures missing details, routes urgent requests, books or prompts next steps, and keeps follow-up moving.",
      },
      {
        question: "Why does speed to lead matter?",
        answer:
          "Many service buyers contact multiple companies. The business that responds quickly and clearly often gets the first serious conversation.",
      },
      {
        question: "Can 247ROI help with missed calls and after-hours leads?",
        answer:
          "Yes. 247ROI can build AI employees for missed-call capture, after-hours qualification, urgent routing, and next-day follow-up.",
      },
    ],
  },
  {
    slug: "ai-employee-roi-calculator",
    title: "AI Employee ROI Calculator | 247ROI",
    description:
      "Estimate the ROI of an AI employee by calculating missed leads, slow follow-up, manual admin hours, estimate delays, and workflow bottlenecks.",
    eyebrow: "AI employee ROI calculator",
    headline: "Before you hire an AI employee, know what it has to pay for.",
    subheadline:
      "The first AI employee should be judged by captured revenue, saved labor, faster response, prepared work product, and fewer missed handoffs.",
    primaryKeyword: "AI employee ROI calculator",
    relatedKeywords: [
      "AI automation ROI calculator",
      "cost of missed calls calculator",
      "AI employee cost",
      "AI automation savings",
      "how much can AI automation save",
    ],
    buyerProblems: [
      "AI sounds useful, but the business case is unclear.",
      "Owners do not know whether to automate leads, estimates, admin, or reporting first.",
      "Manual work feels expensive but has not been measured.",
      "Tool subscriptions pile up without clear success criteria.",
    ],
    systemBuilds: [
      "Lost revenue estimate from missed or slow leads",
      "Weekly labor hours that can be reduced",
      "Estimate and bid bottleneck value",
      "First AI employee recommendation",
      "Success criteria for improve-or-stop decisions",
    ],
    faqs: [
      {
        question: "How should AI employee ROI be measured?",
        answer:
          "When ROI is measurable, use captured leads, faster first response, revived estimates, saved admin hours, prepared quote packets, protected deadlines, and reduced owner workload. For custom dashboards or internal automations, success may be cleaner visibility, fewer dropped handoffs, better decisions, or less manual coordination.",
      },
      {
        question: "What is the first AI employee usually worth building?",
        answer:
          "The best first AI employee is usually closest to revenue: lead response, follow-up, missed-call capture, estimate prep, or bid intake.",
      },
      {
        question: "Does 247ROI guarantee every AI employee will work?",
        answer:
          "No serious provider should guarantee that every workflow deserves automation. 247ROI uses an audit and success criteria to decide what is worth building, what should stay human, and what should be stopped.",
      },
    ],
  },
];

export const SEO_LANDING_PAGE_PATHS = SEO_LANDING_PAGES.map((page) => `/${page.slug}`);

export function getSeoLandingPage(slug: string) {
  return SEO_LANDING_PAGES.find((page) => page.slug === slug);
}

export function seoPageJsonLd(page: SeoLandingPage) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.primaryKeyword,
      provider: {
        "@type": "Organization",
        name: "247ROI",
        url: SITE_URL,
      },
      areaServed: "US",
      serviceType: page.primaryKeyword,
      description: page.description,
      url: `${SITE_URL}/${page.slug}`,
      audience: {
        "@type": "BusinessAudience",
        audienceType: "Small and medium-sized service businesses",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: page.primaryKeyword,
          item: `${SITE_URL}/${page.slug}`,
        },
      ],
    },
  ];
}
