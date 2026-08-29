export type ArticleSection = {
  heading: string;
  body: string[];
  bullets?: string[];
};

export type Article = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  buyer: string;
  readTime: string;
  publishedAt: string;
  updatedAt: string;
  summary: string;
  keyTakeaways: string[];
  sections: ArticleSection[];
  faqs: { question: string; answer: string }[];
  relatedLinks: { label: string; href: string }[];
};

export const ARTICLES: Article[] = [
  {
    slug: "what-should-my-business-automate-first",
    title: "What Should My Business Automate First? A Practical Bottleneck Checklist",
    description:
      "A plain-English checklist for owners deciding whether AI, automation, a dashboard, an internal app, or a cleaner process should be the first business systems build.",
    eyebrow: "Automation checklist",
    primaryKeyword: "what should my business automate first",
    secondaryKeywords: [
      "small business automation checklist",
      "business automation audit",
      "AI automation for small business",
      "workflow automation for small business",
      "business process automation checklist",
    ],
    buyer:
      "Owners and operators with repeated computer work, scattered data, slow follow-up, manual reporting, or overloaded managers.",
    readTime: "7 min read",
    publishedAt: "2026-08-29",
    updatedAt: "2026-08-29",
    summary:
      "The first automation should not be the flashiest idea. It should be the bottleneck closest to money, wasted labor, owner attention, customer delay, or operational visibility.",
    keyTakeaways: [
      "Start with a bottleneck, not a tool. The right answer might be AI, automation, a dashboard, an internal app, an integration, or process cleanup.",
      "The strongest first candidates happen often, have clear inputs and outputs, and create visible time savings or revenue protection.",
      "Keep humans in control of pricing, sensitive messages, exceptions, and final decisions until the workflow has earned trust.",
    ],
    sections: [
      {
        heading: "The useful question is not what can AI do",
        body: [
          "A small business can automate a lot of computer work. That does not mean it should start everywhere.",
          "The useful question is narrower: which bottleneck is costing the business enough time, attention, revenue, or visibility that a first system would clearly matter?",
          "That first system might include AI. It might be a dashboard. It might be a workflow automation. It might be a simple internal app that replaces a fragile spreadsheet. The point is to choose the build around the work, not around the newest software category.",
        ],
      },
      {
        heading: "Use this scoring filter",
        body: [
          "A workflow is a strong first automation candidate when it scores well on frequency, value, clarity, and control.",
          "Frequency means the work happens every day or every week. Value means the workflow is close to revenue, labor cost, customer experience, owner attention, or decision quality. Clarity means the inputs, rules, outputs, and handoffs can be described. Control means humans can review the parts that still need judgment.",
        ],
        bullets: [
          "Frequency: does this happen often enough to matter?",
          "Value: does it protect revenue, save labor, speed response, or reduce owner drag?",
          "Clarity: can the inputs, outputs, rules, exceptions, and handoffs be mapped?",
          "Control: can sensitive decisions stay human while the system prepares the work?",
        ],
      },
      {
        heading: "Start closest to money or owner attention",
        body: [
          "The best first automation usually sits close to one of two expensive problems: revenue leakage or owner bottlenecks.",
          "Revenue leakage includes slow lead response, missed calls, stale estimates, weak follow-up, delayed proposals, and bid opportunities that never get reviewed cleanly. Owner bottlenecks include reporting, inbox triage, manual coordination, status chasing, and decisions that wait because the right information is scattered.",
        ],
        bullets: [
          "New leads wait because nobody can respond quickly.",
          "Estimates or proposals go quiet after the first conversation.",
          "Managers rebuild reports from spreadsheets every week.",
          "The owner has to ask three people and two systems to know what is happening.",
          "Good opportunities sit in inboxes, portals, documents, or shared drives without a clear next step.",
        ],
      },
      {
        heading: "Match the bottleneck to the system type",
        body: [
          "Different bottlenecks need different systems. Calling everything an AI agent makes the work sound more advanced than it is and less clear than it should be.",
          "If the problem is repeated data movement, use automation. If the problem is visibility, use a dashboard. If the problem is a messy team workflow, build an internal tool. If the problem needs reading, summarizing, drafting, classifying, or research, add an AI agent. If the problem is inconsistent rules, clean the process before automating it.",
        ],
        bullets: [
          "Automation: moving data, routing work, sending reminders, updating records, and triggering next steps.",
          "Dashboard: pulling scattered numbers into one owner-ready view with exception flags.",
          "Internal app: intake, approvals, queues, status, notes, tasks, and workflow controls.",
          "AI agent: summaries, drafts, triage, research, reporting, document review, and prepared handoffs.",
          "Process cleanup: unclear ownership, missing rules, inconsistent approvals, or workflows that are too messy to trust yet.",
        ],
      },
      {
        heading: "What should stay human",
        body: [
          "The first version should not give software authority over decisions the business would not delegate to a new employee on day one.",
          "That usually means AI can prepare the work, organize details, draft options, and flag exceptions while a human approves pricing, final messages, unusual requests, financial judgment, legal judgment, hiring decisions, and commitments to customers or vendors.",
        ],
      },
      {
        heading: "A good first build is small enough to prove",
        body: [
          "The first build should create proof quickly. A practical target is one workflow, one clear output, one owner of the result, and one success metric.",
          "Examples: reduce weekly reporting prep from four hours to thirty minutes, respond to every web lead within two minutes, create a daily bid-review queue, prepare quote-ready customer summaries, or give the owner one dashboard that shows stale follow-up and blocked work.",
        ],
      },
      {
        heading: "The 247ROI recommendation",
        body: [
          "Bring the workflow that feels expensive, annoying, or invisible. 247ROI maps it, scores the bottleneck, and recommends the first system worth building.",
          "The answer may be AI. It may be automation. It may be a dashboard, internal app, integration, or cleaner handoff system. The goal is not to use AI everywhere. The goal is to build the first practical system that saves time or creates ROI.",
        ],
      },
    ],
    faqs: [
      {
        question: "What should a small business automate first?",
        answer:
          "Start with the workflow closest to money, wasted labor, owner attention, customer delay, or operational visibility. Good first targets include lead response, follow-up, reporting, inbox triage, CRM updates, estimate prep, bid intake, data entry, and weekly status handoffs.",
      },
      {
        question: "How do I know if a workflow is ready for automation?",
        answer:
          "A workflow is ready when it happens often, has meaningful value, has clear inputs and outputs, and can keep human approval for sensitive decisions or unusual exceptions.",
      },
      {
        question: "Should I start with AI or regular automation?",
        answer:
          "Start with the bottleneck, then choose the system. Use regular automation for predictable steps and data movement. Use AI when the work needs reading, summarizing, drafting, classifying, research, or flexible handoff preparation.",
      },
      {
        question: "What if my process is messy?",
        answer:
          "That is common. The first step may be mapping and cleaning the workflow before automating it. A good system needs clear rules, ownership, inputs, outputs, exceptions, and approval points.",
      },
    ],
    relatedLinks: [
      { label: "AI Opportunity Audit", href: "/hire" },
      { label: "Business process automation consultant", href: "/business-process-automation-consultant" },
      { label: "Workflow automation consultant", href: "/workflow-automation-consultant" },
      { label: "Custom AI agents for business", href: "/ai-agents-for-business" },
      { label: "Custom business dashboard", href: "/custom-business-dashboard" },
    ],
  },
  {
    slug: "contractor-bid-intake-automation",
    title: "Contractor Bid Intake Automation: How AI Can Clean Up Bid Invites Before Estimators Waste Time",
    description:
      "A realistic use case showing how custom AI software can monitor bid invites, extract deadlines, summarize scope, flag missing documents, and prepare go/no-go packets for contractor review.",
    eyebrow: "Realistic AI use case",
    primaryKeyword: "contractor bid intake automation",
    secondaryKeywords: [
      "AI bid assistant for contractors",
      "construction bid intake automation",
      "automate bid invites",
      "AI for contractor bid management",
      "AI estimating prep for contractors",
    ],
    buyer: "Contractors and subcontractors reviewing bid invites through email, portals, PDFs, spreadsheets, and shared drives.",
    readTime: "8 min read",
    publishedAt: "2026-08-05",
    updatedAt: "2026-08-05",
    summary:
      "The first useful AI build for many contractors is not fully automated estimating. It is bid intake automation: a custom AI workflow that turns messy bid invites into clean review packets before an estimator spends time on them.",
    keyTakeaways: [
      "Bid intake is a better first SEO/use-case target than broad AI takeoff terms because the workflow is valuable and less locked up by established software players.",
      "The AI should prepare the bid, not decide the bid: deadlines, requirements, scope notes, missing documents, risks, and go/no-go context.",
      "247ROI should position this as custom AI software built around the contractor's actual inboxes, portals, files, and approval rules.",
    ],
    sections: [
      {
        heading: "Why bid intake is the right first workflow to target",
        body: [
          "Contractors do not only lose time inside the estimate. They lose time before the estimate starts: finding bid invites, opening portals, downloading files, checking deadlines, deciding if the job fits, and figuring out what the estimator needs to review.",
          "That makes contractor bid intake automation a strong first keyword and content target. It is specific enough to rank for, valuable enough to attract serious buyers, and broad enough to support custom AI software instead of one fixed AI employee role.",
          "This is also cleaner than chasing broad terms like AI takeoff software. Takeoff and estimating searches are crowded with established construction software brands. Bid intake is still operational, messy, and custom, which fits 247ROI better.",
        ],
      },
      {
        heading: "The old workflow",
        body: [
          "A contractor or subcontractor receives bid opportunities through email, BuildingConnected, PlanHub, general contractor portals, shared links, PDFs, and forwarded messages.",
          "Someone has to open everything, find the due date, confirm the trade scope, download drawings, check addenda, skim requirements, decide if the job is worth reviewing, and remind the estimator before the deadline gets tight.",
          "When the office is busy, this work gets handled late or inconsistently. Good opportunities get missed. Poor-fit jobs waste estimating time. Requirements hide in documents nobody fully reviewed.",
        ],
        bullets: [
          "Bid invites are spread across too many places.",
          "Deadlines and addenda are easy to miss.",
          "Estimators spend time figuring out what the opportunity is before they can estimate.",
          "Owners often become the filter for every bid decision.",
          "The company lacks a consistent go/no-go process.",
        ],
      },
      {
        heading: "The AI workflow",
        body: [
          "A custom AI bid intake workflow watches the places where opportunities arrive, then prepares a review packet before the human team digs in.",
          "It does not submit final bids. It does not make margin decisions. It does not replace the estimator. It handles the screen work around the decision so the human starts with a cleaner picture.",
        ],
        bullets: [
          "Detect new bid invites in inboxes or connected systems.",
          "Extract project name, location, GC, due date, walk date, trade scope, and submission instructions.",
          "Download or organize linked files when access is available.",
          "Identify missing documents, addenda, unclear scope, or deadline risk.",
          "Create a go/no-go summary based on the contractor's rules.",
          "Prepare a checklist for estimator review.",
          "Send reminders before deadlines or required meetings.",
        ],
      },
      {
        heading: "Example output",
        body: [
          "A bid intake AI employee might turn one messy invite into a simple packet like this:",
          "Project: North Ridge Medical Office Renovation. Due date: Thursday at 2:00 PM. GC: Harper Construction. Trade fit: electrical and low-voltage scope appears relevant. Location: inside current service area. Documents found: invitation, project manual, E-series drawings, addendum 1. Missing or unclear: low-voltage responsibility, alternates, site visit requirement, and whether lighting controls are included. Recommended next step: estimator review within 24 hours; send GC two clarification questions before pricing.",
          "That packet is not the finished bid. It is the work that lets a human decide faster and with fewer blind spots.",
        ],
      },
      {
        heading: "What humans still approve",
        body: [
          "The point is not to make AI autonomous where judgment matters. The point is to stop forcing experienced people to do repeatable document and inbox prep.",
          "Final bid decisions should stay human. The AI prepares the work and flags the details. The contractor decides what to pursue, how to price, what to exclude, and whether to submit.",
        ],
        bullets: [
          "Final go/no-go decisions.",
          "Final quantities and pricing.",
          "Margin and risk decisions.",
          "Exclusions and contract language.",
          "Bid submission.",
          "Sensitive communication with GCs or customers.",
        ],
      },
      {
        heading: "Why this fits 247ROI",
        body: [
          "This is not a stable, off-the-shelf role. Every contractor's bid process is different. Some live in email. Some live in BuildingConnected. Some use spreadsheets. Some have a shared drive. Some have one estimator; others route opportunities across a team.",
          "That is the point. 247ROI builds custom AI software around the actual workflow. The article can use bid intake as the example while making the larger promise clear: if valuable computer work is repetitive, document-heavy, or scattered across tools, AI can probably take the first pass.",
        ],
      },
      {
        heading: "First build recommendation",
        body: [
          "Start narrow: automate the first pass on bid invites. Do not start by trying to automate the whole estimating department.",
          "The first version should prove that AI can catch opportunities, organize information, protect deadlines, and prepare better review packets. If that works, the system can expand into bid board updates, CRM syncing, estimator task assignment, document comparison, proposal drafting, or reporting.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is contractor bid intake automation?",
        answer:
          "Contractor bid intake automation uses software and AI to monitor bid invites, extract deadlines and requirements, organize documents, flag missing information, and prepare go/no-go review packets before an estimator spends time on the opportunity.",
      },
      {
        question: "Does this replace an estimator?",
        answer:
          "No. The safer and more useful first build prepares the opportunity for estimator review. Humans still approve final fit, quantities, pricing, exclusions, and submission.",
      },
      {
        question: "Can this work with my current tools?",
        answer:
          "Usually, yes. The value of custom AI software is that it can be designed around the inboxes, portals, spreadsheets, CRMs, file storage, and approval habits already inside the business.",
      },
      {
        question: "Why target bid intake before takeoff automation?",
        answer:
          "Broad takeoff automation is crowded with established construction software. Bid intake is often more fragmented and custom, which makes it a better first 247ROI use case for contractors with messy pre-estimating workflows.",
      },
    ],
    relatedLinks: [
      { label: "Custom AI employees", href: "/ai-employees" },
      { label: "Contractor bid assistant", href: "/contractor-bid-assistant" },
      { label: "AI workflow automation agency", href: "/ai-workflow-automation-agency" },
      { label: "Find My First AI Employee", href: "/hire" },
    ],
  },
];

export function getArticle(slug: string) {
  return ARTICLES.find((article) => article.slug === slug);
}

export const ARTICLE_PATHS = ARTICLES.map((article) => `/articles/${article.slug}`);
