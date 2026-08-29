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
  relatedPageSlugs?: string[];
};

export const SEO_LANDING_PAGES: SeoLandingPage[] = [
  {
    slug: "what-should-my-business-automate-first",
    title: "What Should My Business Automate First? | 247ROI",
    description:
      "247ROI helps owners decide what to automate first by scoring bottlenecks against revenue, labor, owner attention, workflow clarity, and human control.",
    eyebrow: "Automation starting point",
    headline: "Find the first workflow worth automating before buying another tool.",
    subheadline:
      "247ROI helps owners and operators identify whether the right first build is AI, automation, a dashboard, an internal app, an integration, or a cleaner workflow.",
    primaryKeyword: "what should my business automate first",
    relatedKeywords: [
      "small business automation checklist",
      "business automation audit",
      "AI automation for small business",
      "workflow automation for small business",
      "business process automation checklist",
    ],
    relatedPageSlugs: [
      "business-process-automation-consultant",
      "workflow-automation-consultant",
      "ai-automation-consultant-small-business",
      "custom-business-dashboard",
      "internal-tools-for-small-business",
    ],
    buyerProblems: [
      "The business knows manual computer work is expensive, but the first automation target is unclear.",
      "Leads, reports, estimates, inboxes, tasks, records, and handoffs live across too many tools.",
      "Owners are comparing AI tools without knowing which workflow would create the clearest payoff.",
      "Previous automation attempts stalled because the process, approvals, and exceptions were not mapped first.",
    ],
    systemBuilds: [
      "Bottleneck map for repeated computer work, revenue leakage, owner drag, and visibility gaps",
      "First-build recommendation across automation, AI agent, dashboard, internal app, integration, or process cleanup",
      "Workflow scorecard for frequency, value, clarity, control, and expected proof",
      "Human approval rules for pricing, sensitive messages, exceptions, and final decisions",
      "Simple success metric tied to saved hours, faster response, cleaner handoffs, or better operating visibility",
      "Next-step path into the AI Opportunity Audit when the workflow is worth deeper diagnosis",
    ],
    faqs: [
      {
        question: "What should my business automate first?",
        answer:
          "Start with the workflow closest to money, wasted labor, owner attention, customer delay, or operational visibility. Common first targets include lead response, follow-up, reporting, inbox triage, CRM updates, estimate prep, bid intake, data entry, and weekly status handoffs.",
      },
      {
        question: "How do I choose between AI, automation, a dashboard, and an internal app?",
        answer:
          "Use the workflow to choose the system. Predictable repeated steps usually fit automation. Visibility gaps usually need dashboards. Team workflows often need internal tools. Reading, drafting, summarizing, triage, research, and flexible handoff prep may need an AI agent.",
      },
      {
        question: "Can 247ROI help if I do not know where to start?",
        answer:
          "Yes. The AI Opportunity Audit is designed for that exact question. It identifies the first bottleneck worth fixing, what kind of system fits, what should stay human, and what proof would show the build is working.",
      },
      {
        question: "Should messy workflows be automated?",
        answer:
          "Not blindly. Messy workflows often need mapping and cleanup before automation. 247ROI looks for clear inputs, outputs, rules, ownership, exceptions, and approval points before recommending a build.",
      },
    ],
  },
  {
    slug: "business-process-automation-consultant",
    title: "Business Process Automation Consultant | 247ROI",
    description:
      "247ROI helps SMB owners find the business process worth automating first, then builds practical automations, dashboards, internal apps, and AI agents around real workflows.",
    eyebrow: "Business process automation consultant",
    headline: "Automate the process that is actually slowing the business down.",
    subheadline:
      "247ROI works with owners and operators to find the first operational bottleneck worth fixing, then builds the practical system around it: automation, dashboard, internal app, AI agent, integration, or cleaner workflow.",
    primaryKeyword: "business process automation consultant",
    relatedKeywords: [
      "workflow automation consultant",
      "small business automation consultant",
      "business systems consultant",
      "business process automation for small business",
      "custom business automation",
    ],
    relatedPageSlugs: [
      "workflow-automation-consultant",
      "ai-automation-consultant-small-business",
      "custom-business-dashboard",
      "internal-tools-for-small-business",
    ],
    buyerProblems: [
      "The same computer work gets repeated every week, but nobody has time to redesign it.",
      "Important work lives across inboxes, spreadsheets, CRMs, forms, calendars, portals, and memory.",
      "Managers chase updates because there is no clean operating picture.",
      "Automation attempts stall because the workflow was never mapped tightly enough.",
    ],
    systemBuilds: [
      "Workflow audit and bottleneck map",
      "Custom automation for repeated admin and data movement",
      "Internal dashboard for owner and manager visibility",
      "AI agent for research, triage, drafting, reporting, or follow-up",
      "Human approval rules for pricing, sensitive messages, exceptions, and judgment calls",
      "Iteration plan based on saved time, cleaner handoffs, conversion, or revenue protection",
    ],
    faqs: [
      {
        question: "What does a business process automation consultant do?",
        answer:
          "A business process automation consultant identifies repeatable workflows that waste time, lose revenue, or create operational drag, then designs systems that reduce manual work. For 247ROI, that system might be an automation, dashboard, internal app, AI agent, integration, or a cleaner approval workflow.",
      },
      {
        question: "What should a small business automate first?",
        answer:
          "Start with the bottleneck closest to money, wasted labor, owner attention, or dropped handoffs. Common first targets include lead response, follow-up, reporting, CRM updates, bid intake, estimate prep, inbox triage, document handling, and weekly operational reporting.",
      },
      {
        question: "How is 247ROI different from buying another automation tool?",
        answer:
          "247ROI starts with the business process, not the software category. The goal is to understand how the work actually moves today, where it breaks, what should stay human, and what practical system would create visible ROI.",
      },
      {
        question: "Can AI be part of business process automation?",
        answer:
          "Yes, when the workflow needs language, judgment support, summarization, classification, drafting, research, or flexible handoffs. AI should be constrained by rules, useful output, logs, and human approval where decisions are sensitive.",
      },
    ],
  },
  {
    slug: "workflow-automation-consultant",
    title: "Workflow Automation Consultant | 247ROI",
    description:
      "247ROI helps SMB owners map messy workflows, find the first automation worth building, and connect apps, data, approvals, dashboards, and AI agents around real work.",
    eyebrow: "Workflow automation consultant",
    headline: "Fix the workflow before adding another tool.",
    subheadline:
      "247ROI helps owners and operators turn repeated computer work, scattered handoffs, and manual follow-up into practical workflow automation systems with clear rules, outputs, and human approval points.",
    primaryKeyword: "workflow automation consultant",
    relatedKeywords: [
      "workflow automation for small business",
      "business workflow automation",
      "AI workflow automation consultant",
      "custom workflow automation",
      "process automation consultant",
    ],
    relatedPageSlugs: [
      "business-process-automation-consultant",
      "ai-automation-consultant-small-business",
      "ai-agents-for-business",
      "internal-tools-for-small-business",
      "custom-business-dashboard",
    ],
    buyerProblems: [
      "People copy the same information between inboxes, spreadsheets, CRMs, forms, calendars, portals, and documents.",
      "Approvals, reminders, customer updates, and internal handoffs depend on memory instead of a visible system.",
      "The business bought tools, but the work still gets delayed because the workflow between those tools is unclear.",
      "Owners want automation, but need to know what should stay human before anything gets connected.",
    ],
    systemBuilds: [
      "Workflow map that shows inputs, decisions, handoffs, exceptions, and owner approval points",
      "Automation layer for repeated data movement, document prep, routing, reminders, and status updates",
      "AI agent support for summaries, drafts, classifications, research, reporting, and next-step prep",
      "Dashboard or internal app when the team needs visibility, queues, records, or approval controls",
      "Human-in-the-loop rules for pricing, sensitive messages, exceptions, and final decisions",
      "Measurement plan tied to saved hours, faster response, fewer dropped handoffs, or cleaner operating visibility",
    ],
    faqs: [
      {
        question: "What does a workflow automation consultant do?",
        answer:
          "A workflow automation consultant maps how work moves through a business, identifies repeated steps and weak handoffs, then designs automation around the process. The work can include app integrations, dashboards, internal tools, AI agents, approval rules, reporting, and follow-up systems.",
      },
      {
        question: "Which workflows should a small business automate first?",
        answer:
          "Start with workflows that happen often, waste owner attention, slow revenue, or create dropped handoffs. Common first targets include lead response, estimate follow-up, inbox triage, CRM updates, data entry, document prep, status reporting, scheduling, and weekly operating reports.",
      },
      {
        question: "Can workflow automation use AI?",
        answer:
          "Yes, when the workflow needs language, summaries, classification, drafting, research, or flexible next-step prep. 247ROI keeps AI constrained by clear inputs, output formats, logs, exception paths, and human approval for sensitive decisions.",
      },
      {
        question: "How is workflow automation different from business process automation?",
        answer:
          "Workflow automation usually focuses on the movement of work between people, tools, approvals, and next steps. Business process automation is the broader operating-system view. 247ROI uses both ideas to decide whether the right first build is automation, an AI agent, a dashboard, an internal app, an integration, or process cleanup.",
      },
    ],
  },
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
    slug: "ai-agents-for-business",
    title: "Custom AI Agents for Business | 247ROI",
    description:
      "247ROI builds custom AI agents for business workflows such as inbox triage, research, reporting, CRM updates, follow-up, document handling, and operational handoffs.",
    eyebrow: "Custom AI agents for business",
    headline: "Build an AI agent around one real business job, not a vague demo.",
    subheadline:
      "247ROI designs custom AI agents with clear inputs, connected tools, useful work product, human approval rules, and success criteria tied to the workflow they are supposed to improve.",
    primaryKeyword: "custom AI agents for business",
    relatedKeywords: [
      "AI agents for small business",
      "business AI agents",
      "custom AI agent development",
      "AI workflow agents",
      "managed AI agents for business",
    ],
    buyerProblems: [
      "The team needs research, summaries, drafts, reports, or CRM updates prepared before a human can act.",
      "Important details sit across inboxes, documents, spreadsheets, portals, notes, and software tools.",
      "Generic AI tools create output, but they do not own a defined workflow or leave a reliable handoff.",
      "Owners want AI help without giving it authority over pricing, sensitive messages, or final decisions.",
    ],
    systemBuilds: [
      "AI inbox triage agent for routing, summaries, and draft replies",
      "AI reporting agent that turns scattered updates into owner-ready briefs",
      "AI research agent for vendor, prospect, market, or bid preparation",
      "AI CRM update agent for cleaner records and next-step prompts",
      "AI follow-up agent for leads, estimates, stale opportunities, and reminders",
      "Human approval rules, logs, and exception paths for sensitive work",
    ],
    faqs: [
      {
        question: "What is a custom AI agent for business?",
        answer:
          "A custom AI agent is a workflow system built around a defined business job. It can read inputs, prepare work product, update records, draft messages, summarize details, research options, or route next steps while following business rules and escalating judgment calls.",
      },
      {
        question: "What business workflows are good fits for AI agents?",
        answer:
          "Good first fits include inbox triage, lead follow-up, CRM updates, weekly reporting, research, bid preparation, estimate support, document review, meeting briefs, and operations handoffs where a human still reviews important decisions.",
      },
      {
        question: "How is a custom AI agent different from ChatGPT?",
        answer:
          "ChatGPT is a general tool. A custom AI agent is designed around a business workflow, connected inputs, expected output, approval rules, logs, and a clear definition of what useful work looks like.",
      },
      {
        question: "Does 247ROI let AI agents make final decisions?",
        answer:
          "Not for sensitive work. 247ROI designs human approval points for pricing, final customer messages, legal or financial judgment, unusual exceptions, and anything the business should not delegate blindly.",
      },
    ],
  },
  {
    slug: "ai-visibility-optimization",
    title: "AI Visibility Optimization | 247ROI",
    description:
      "247ROI helps businesses improve AI visibility with clearer entity signals, answer-ready pages, technical SEO, schema, citations, and recurring answer-engine checks.",
    eyebrow: "AI visibility optimization",
    headline: "Make your business easier for search engines and AI answer engines to understand.",
    subheadline:
      "247ROI improves AI visibility by tightening the public signals around what you do, who you serve, which problems you solve, and why your pages deserve to be cited in search and AI-generated answers.",
    primaryKeyword: "AI visibility optimization",
    relatedKeywords: [
      "generative engine optimization consultant",
      "AI search optimization",
      "ChatGPT visibility optimization",
      "AI answer engine optimization",
      "GEO consultant",
    ],
    buyerProblems: [
      "The business has useful services, but search engines and AI tools cannot easily explain what makes it relevant.",
      "Pages describe the company in broad terms without answer-ready sections for real buyer questions.",
      "Schema, sitemap coverage, internal links, citations, and entity signals are incomplete or inconsistent.",
      "Nobody is checking whether ChatGPT, Gemini, Perplexity, Google, or Bing actually surface the business for priority prompts.",
    ],
    systemBuilds: [
      "AI visibility audit for priority services, locations, audiences, and answer-engine prompts",
      "Entity clarity pass across homepage, service pages, metadata, schema, sitemap, robots, and llms files",
      "Answer-ready pages that map buyer questions to practical, specific service explanations",
      "Internal link structure that connects authority pages, service pages, and the audit conversion path",
      "Citation and proof plan for directories, profiles, articles, case examples, and trusted third-party mentions",
      "Recurring AI visibility checks with prompt snapshots, gaps, next actions, and page improvements",
    ],
    faqs: [
      {
        question: "What is AI visibility optimization?",
        answer:
          "AI visibility optimization is the work of making a business easier to understand, trust, and cite across search engines and AI answer engines. It combines technical SEO, clear service pages, structured data, entity consistency, useful citations, and recurring checks of the prompts buyers actually ask.",
      },
      {
        question: "Is AI visibility optimization different from SEO?",
        answer:
          "It builds on SEO instead of replacing it. Strong crawlable pages, clear metadata, internal links, schema, and trustworthy citations still matter. AI visibility adds answer-ready structure and prompt-level monitoring so the business can improve how it appears in AI-generated recommendations and explanations.",
      },
      {
        question: "How does 247ROI improve visibility in ChatGPT and AI search?",
        answer:
          "247ROI starts by clarifying the business entity, service category, buyer problems, proof, pages, and crawlable context. Then it tracks priority prompts and improves the public signals that answer engines can use: focused pages, schema, llms files, internal links, citations, examples, and consistent profiles.",
      },
      {
        question: "Can anyone guarantee that a business will be recommended by AI tools?",
        answer:
          "No. AI platforms control their own ranking, retrieval, and answer behavior. The practical goal is to improve the signals those systems can find and evaluate, then measure prompt visibility over time and keep improving the pages and citations that support the business.",
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
  {
    slug: "ai-automation-consultant-small-business",
    title: "AI Automation Consultant for Small Business | 247ROI",
    description:
      "247ROI helps small businesses identify the computer work AI should handle first, then builds custom automations, AI agents, dashboards, internal apps, and connected systems.",
    eyebrow: "AI automation consultant for small business",
    headline: "Stop paying people to repeat computer work software can handle.",
    subheadline:
      "247ROI helps owners find the highest-value work to automate first, then builds practical AI and software systems around the way the business actually operates.",
    primaryKeyword: "AI automation consultant for small business",
    relatedKeywords: [
      "small business AI automation",
      "AI automation for small business",
      "AI business automation consultant",
      "custom AI automation consultant",
      "small business automation consultant",
    ],
    relatedPageSlugs: [
      "business-process-automation-consultant",
      "ai-agents-for-business",
      "internal-tools-for-small-business",
      "custom-business-dashboard",
    ],
    buyerProblems: [
      "Employees spend hours moving information between inboxes, spreadsheets, CRMs, calendars, portals, and documents.",
      "The owner knows work is being repeated, but has not separated low-value admin from work that still needs judgment.",
      "The business has tried off-the-shelf tools, but the process still depends on manual follow-up and memory.",
      "Important opportunities slow down because nobody has a clean system for intake, routing, reporting, or follow-through.",
    ],
    systemBuilds: [
      "AI automation audit focused on the computer work with the clearest time or revenue impact",
      "Custom automations that move data, prepare work, route handoffs, and reduce repeated admin",
      "AI agents for research, summaries, drafting, inbox triage, CRM updates, reporting, and follow-up",
      "Dashboards and internal apps when visibility or workflow control matters more than another automation",
      "Human approval rules for pricing, customer messages, exceptions, and sensitive decisions",
      "A first-build roadmap that starts small enough to ship and measure",
    ],
    faqs: [
      {
        question: "What does an AI automation consultant do for a small business?",
        answer:
          "An AI automation consultant identifies repeatable computer work that can be handled or prepared by AI, automation, dashboards, internal apps, or custom software. The goal is not to add a tool. The goal is to remove low-value manual work while keeping humans in control of important decisions.",
      },
      {
        question: "What should a small business automate first with AI?",
        answer:
          "Start with work that is repeated often, close to revenue, or expensive in owner attention. Common first targets include lead response, follow-up, inbox triage, CRM updates, reporting, estimate prep, bid intake, scheduling handoffs, data entry, and weekly operating dashboards.",
      },
      {
        question: "Can 247ROI automate anything done on a computer?",
        answer:
          "247ROI can evaluate nearly any computer-based business process: admin, sales, operations, reporting, marketing, websites, SEO, social content systems, dashboards, internal tools, and custom apps. The audit decides what is actually worth building first.",
      },
      {
        question: "Is AI automation safe for customer-facing work?",
        answer:
          "It can be when the system has clear rules, logs, escalation paths, and human approval for sensitive messages, pricing, unusual requests, or final decisions. 247ROI designs AI automation around those control points.",
      },
    ],
  },
  {
    slug: "generative-engine-optimization-consultant",
    title: "Generative Engine Optimization Consultant | 247ROI",
    description:
      "247ROI helps businesses improve visibility in AI answers with crawlable pages, entity clarity, schema, citations, internal links, and recurring prompt checks.",
    eyebrow: "Generative engine optimization consultant",
    headline: "Make your business easier for AI answers to find, understand, and cite.",
    subheadline:
      "247ROI combines practical SEO, AI visibility checks, schema, citations, and answer-ready pages so search engines and AI tools can explain what your business does.",
    primaryKeyword: "generative engine optimization consultant",
    relatedKeywords: [
      "GEO consultant",
      "AI search consultant",
      "AI answer engine optimization",
      "ChatGPT visibility consultant",
      "generative engine optimization services",
    ],
    relatedPageSlugs: ["ai-visibility-optimization", "business-process-automation-consultant", "ai-agents-for-business"],
    buyerProblems: [
      "The business depends on search, but AI answers and summaries are changing how people discover providers.",
      "The site has broad service copy without clear answers to the questions buyers actually ask.",
      "Entity signals are scattered across the website, profiles, citations, reviews, content, and schema.",
      "Nobody is checking whether AI systems can accurately describe the business or recommend it for the right prompts.",
    ],
    systemBuilds: [
      "Prompt map for the buyer questions the business wants to appear in",
      "Answer-ready service pages with direct explanations, FAQs, and useful examples",
      "Schema, metadata, sitemap, robots, llms.txt, and internal-link cleanup",
      "Citation and profile consistency plan across trusted third-party sources",
      "Recurring AI visibility snapshots across ChatGPT, Gemini, Perplexity, Google, and Bing-style surfaces",
      "Page improvement backlog based on what AI answers miss or misunderstand",
    ],
    faqs: [
      {
        question: "What is generative engine optimization?",
        answer:
          "Generative engine optimization is the work of improving the public signals that AI answer engines can use when explaining, citing, or recommending a business. It overlaps with SEO, but adds prompt testing, entity clarity, answer-ready pages, structured data, citations, and recurring checks.",
      },
      {
        question: "Is GEO different from SEO?",
        answer:
          "GEO builds on SEO. Search engines and AI systems still need crawlable pages, useful content, links, metadata, schema, and trusted citations. GEO adds a focus on how AI systems answer buyer questions and whether the business is understood correctly.",
      },
      {
        question: "Can a consultant guarantee AI recommendations?",
        answer:
          "No. AI platforms control their own retrieval and ranking. A practical GEO consultant improves the signals that can be discovered, cited, and trusted, then measures prompt visibility over time.",
      },
      {
        question: "What should a business fix first for AI visibility?",
        answer:
          "Start with clear service pages, consistent business entity information, crawlable answers to buyer questions, relevant schema, internal links, accurate profiles, and citations from sources that search and AI systems can verify.",
      },
    ],
  },
  {
    slug: "custom-business-dashboard",
    title: "Custom Business Dashboard | 247ROI",
    description:
      "247ROI builds custom business dashboards that help owners see leads, sales, operations, follow-up, bottlenecks, and weekly performance without chasing spreadsheets.",
    eyebrow: "Custom business dashboard",
    headline: "See the business without chasing updates across ten places.",
    subheadline:
      "247ROI builds owner-ready dashboards and reporting systems that pull the right information into one practical operating view.",
    primaryKeyword: "custom business dashboard",
    relatedKeywords: [
      "custom dashboard for small business",
      "business dashboard development",
      "owner dashboard",
      "AI dashboard automation",
      "small business reporting dashboard",
    ],
    relatedPageSlugs: [
      "internal-tools-for-small-business",
      "ai-automation-consultant-small-business",
      "business-process-automation-consultant",
    ],
    buyerProblems: [
      "Important numbers live across spreadsheets, CRMs, inboxes, forms, calendars, accounting tools, and memory.",
      "Managers spend too much time asking for updates instead of seeing what needs attention.",
      "Reports are built manually every week and still arrive too late to change anything.",
      "The business cannot clearly see lead flow, follow-up, job status, bottlenecks, or team output in one place.",
    ],
    systemBuilds: [
      "Owner dashboard for leads, pipeline, jobs, follow-up, revenue signals, and task queues",
      "Automated reporting from spreadsheets, CRMs, forms, calendars, and operating tools",
      "AI-generated summaries that explain what changed and what needs attention",
      "Exception flags for stale leads, overdue handoffs, missing records, and delayed jobs",
      "Internal app views for the team when a dashboard needs workflow controls, not just charts",
      "Weekly improvement loop based on what owners actually use to make decisions",
    ],
    faqs: [
      {
        question: "What is a custom business dashboard?",
        answer:
          "A custom business dashboard is a reporting system built around the way a business operates. It pulls the right data into one view so owners and managers can see priorities, bottlenecks, follow-up, job status, and performance without rebuilding reports manually.",
      },
      {
        question: "When does a small business need a custom dashboard?",
        answer:
          "A custom dashboard makes sense when important work is hard to see, reports take too long to prepare, teams rely on spreadsheets, or the owner has to ask multiple people and tools for basic operating answers.",
      },
      {
        question: "Can AI help with business dashboards?",
        answer:
          "Yes. AI can summarize changes, flag exceptions, draft weekly operating briefs, explain trends, and prepare next-step notes. The dashboard should still make the source data and logic inspectable.",
      },
      {
        question: "Is a dashboard enough, or does the business need an internal app?",
        answer:
          "If the problem is visibility, a dashboard may be enough. If people also need to update records, route work, approve steps, or manage a process, an internal app may be the better build.",
      },
    ],
  },
  {
    slug: "internal-tools-for-small-business",
    title: "Internal Tools for Small Business | 247ROI",
    description:
      "247ROI builds internal tools for small businesses that have outgrown spreadsheets, disconnected apps, manual routing, and repeated computer work.",
    eyebrow: "Internal tools for small business",
    headline: "Replace the workaround your business accidentally started depending on.",
    subheadline:
      "247ROI builds focused internal tools, dashboards, automations, and AI-assisted workflows for small businesses that need software shaped around the way they actually work.",
    primaryKeyword: "internal tools for small business",
    relatedKeywords: [
      "custom internal tools",
      "small business internal app",
      "custom business software",
      "spreadsheet replacement app",
      "internal workflow app",
    ],
    relatedPageSlugs: [
      "custom-business-dashboard",
      "ai-automation-consultant-small-business",
      "business-process-automation-consultant",
      "ai-agents-for-business",
    ],
    buyerProblems: [
      "A spreadsheet became the operating system, but it is fragile, slow, and hard to trust.",
      "Work depends on people copying data between tools, messages, portals, and documents.",
      "The team needs a simple app for intake, routing, approvals, status, notes, and reporting.",
      "Off-the-shelf software is either too rigid, too expensive, or still leaves the business doing manual work around it.",
    ],
    systemBuilds: [
      "Internal app for intake, status tracking, approvals, notes, tasks, and handoffs",
      "Spreadsheet replacement with cleaner permissions, fields, workflows, and reporting",
      "Automation layer that connects forms, CRM, calendars, email, docs, and operating tools",
      "AI-assisted summaries, draft messages, research, document review, and reporting where useful",
      "Dashboard views for owners, managers, and operators",
      "Iterative build plan that starts with the smallest useful version",
    ],
    faqs: [
      {
        question: "What are internal tools for small business?",
        answer:
          "Internal tools are custom apps, dashboards, automations, or workflow systems used by the team inside the business. They help manage intake, approvals, reporting, operations, handoffs, records, and repeated computer work.",
      },
      {
        question: "When should a small business build an internal tool?",
        answer:
          "Build an internal tool when the current process depends on spreadsheets, copy-paste work, missed handoffs, disconnected apps, manual reports, or workarounds that are slowing the business down.",
      },
      {
        question: "Are internal tools expensive?",
        answer:
          "They do not have to start as large software projects. The best first version usually handles one valuable workflow, uses the tools the business already has where possible, and expands after the team proves it saves time or improves visibility.",
      },
      {
        question: "Can AI be part of an internal business tool?",
        answer:
          "Yes. AI can prepare summaries, drafts, classifications, research, reports, and recommendations inside an internal tool while humans keep approval over sensitive decisions.",
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
