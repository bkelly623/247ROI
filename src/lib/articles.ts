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
