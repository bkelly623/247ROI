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
      { label: "Admin workflow teardown", href: "/articles/admin-workflow-your-team-should-stop-doing-by-hand" },
      { label: "Business process automation consultant", href: "/business-process-automation-consultant" },
      { label: "Workflow automation consultant", href: "/workflow-automation-consultant" },
      { label: "Custom AI agents for business", href: "/ai-agents-for-business" },
      { label: "Custom business dashboard", href: "/custom-business-dashboard" },
    ],
  },
  {
    slug: "admin-workflow-your-team-should-stop-doing-by-hand",
    title: "The Admin Workflow Your Team Should Stop Doing by Hand",
    description:
      "A practical workflow teardown for owners deciding whether repeated admin, inbox, spreadsheet, CRM, or reporting work should become automation, an internal app, a dashboard, or an AI-assisted handoff.",
    eyebrow: "Workflow teardown",
    primaryKeyword: "admin workflow automation",
    secondaryKeywords: [
      "small business admin automation",
      "automate admin tasks",
      "inbox workflow automation",
      "spreadsheet workflow automation",
      "CRM update automation",
      "business process automation example",
    ],
    buyer:
      "Owners, operators, and office managers whose team keeps copying data between inboxes, spreadsheets, CRMs, documents, and reporting tools.",
    readTime: "8 min read",
    publishedAt: "2026-09-03",
    updatedAt: "2026-09-03",
    summary:
      "The admin workflow to stop doing by hand is usually the one that happens every week, crosses multiple tools, slows follow-up or reporting, and still requires a human to notice whether the work is complete.",
    keyTakeaways: [
      "Do not start with every admin task. Start with the repeated handoff that creates missed follow-up, stale records, late reporting, or owner interruption.",
      "The first useful system may be automation, an internal app, a dashboard, an AI agent, or cleaner process rules. The workflow decides the build.",
      "A good first version prepares the work, shows exceptions, and gives humans approval control instead of hiding business judgment inside software.",
    ],
    sections: [
      {
        heading: "The pattern to look for",
        body: [
          "The strongest admin automation candidate is not the task everyone complains about most. It is the handoff that quietly burns time because the same details have to be found, copied, checked, renamed, summarized, routed, and reported again and again.",
          "It usually sits between tools: an inbox and a CRM, a form and a spreadsheet, a shared drive and a customer record, a project management board and a weekly report, or a call note and a follow-up sequence.",
          "When the workflow depends on one person remembering the next step, the business gets fragile. That is where a small practical system can create proof fast.",
        ],
        bullets: [
          "The work happens daily or weekly.",
          "The same details move between two or more systems.",
          "A delay creates stale follow-up, missed revenue, bad reporting, or owner interruption.",
          "The rules are mostly knowable, but exceptions still need human review.",
          "The output should be visible: a queue, record update, report, brief, checklist, or dashboard flag.",
        ],
      },
      {
        heading: "Example: new customer intake turns into scattered follow-up",
        body: [
          "A lead comes in through a form, email, phone note, referral message, or spreadsheet row. Someone opens the message, checks whether the request is real, copies contact details into a CRM, creates a task, sends a reply, saves attachments, notifies the right person, and maybe adds a note to a weekly report.",
          "None of those steps is impressive by itself. Together, they create the kind of admin drag that keeps a small team reactive. If one step is missed, the lead gets a slower reply, the CRM becomes less trustworthy, and the owner starts asking for status updates manually.",
        ],
        bullets: [
          "Where did the request come from?",
          "Is the contact information complete?",
          "Which service, location, or priority does it fit?",
          "Who owns the next step?",
          "What should be recorded, replied to, or escalated?",
          "What should appear in the owner dashboard this week?",
        ],
      },
      {
        heading: "The system that replaces the manual loop",
        body: [
          "The first build does not need to be complicated. A practical intake workflow can catch the request, extract the useful fields, check for missing details, update the right system, create the next task, and prepare a reply or handoff note.",
          "If the business needs visibility, the same workflow can feed a dashboard. If the team needs action controls, it can become a lightweight internal app. If messages or documents require interpretation, an AI agent can prepare the first pass while humans approve anything sensitive.",
        ],
        bullets: [
          "Capture the request from the source system.",
          "Extract the key fields and flag missing information.",
          "Create or update the CRM, spreadsheet, task, or project record.",
          "Draft the response or internal handoff note.",
          "Route exceptions to a human instead of forcing a bad rule.",
          "Log the outcome so reporting and follow-up are not rebuilt by hand.",
        ],
      },
      {
        heading: "What humans should still approve",
        body: [
          "Admin automation fails when it pretends every decision is a rule. The safer version gives the team leverage without removing judgment.",
          "A human should still approve pricing, promises to customers, unusual requests, sensitive messages, vendor commitments, legal or financial judgment, and anything that would be risky for a new employee to decide alone.",
        ],
      },
      {
        heading: "The proof metric",
        body: [
          "Pick one metric before building. Otherwise the project becomes a technology demo instead of an operating improvement.",
          "Good proof metrics are concrete: fewer minutes spent on intake, faster first response, fewer stale leads, fewer duplicate records, cleaner weekly reporting, fewer owner interruptions, or fewer handoffs that wait on memory.",
        ],
        bullets: [
          "Reduce weekly admin reporting from four hours to thirty minutes.",
          "Create every new lead task within two minutes.",
          "Cut duplicate CRM records by half.",
          "Give the owner one daily exception list instead of scattered status checks.",
          "Make every customer request end with a clear owner, due date, and next step.",
        ],
      },
      {
        heading: "When not to automate it yet",
        body: [
          "Some admin workflows are not ready. If nobody agrees on ownership, if the rules change every time, or if the source data is unreliable, a cleaner process may come first.",
          "That is still useful. The first move might be a workflow map, a better intake form, a standard handoff checklist, or a dashboard that reveals where the mess starts. AI and automation work better after the business can describe the job.",
        ],
      },
      {
        heading: "The 247ROI recommendation",
        body: [
          "Bring the admin workflow that keeps pulling attention back into the business: inbox triage, CRM updates, reporting, intake, document prep, follow-up, scheduling handoffs, or spreadsheet cleanup.",
          "247ROI maps the workflow, scores whether it is worth fixing first, and builds the practical system around it. That system might be automation, an AI agent, a dashboard, an internal app, an integration, or process cleanup.",
        ],
      },
    ],
    faqs: [
      {
        question: "What admin tasks should a small business automate first?",
        answer:
          "Start with repeated admin handoffs that happen often and affect revenue, reporting, follow-up, or owner attention. Common first targets include lead intake, CRM updates, inbox triage, document routing, spreadsheet cleanup, weekly reporting, and customer follow-up tasks.",
      },
      {
        question: "Is admin workflow automation the same as AI automation?",
        answer:
          "Not always. Some admin workflows only need standard automation or an internal app. AI is useful when the work requires reading, summarizing, classifying, drafting, research, or preparing a flexible handoff for human review.",
      },
      {
        question: "How do I know if an admin workflow is ready to automate?",
        answer:
          "It is usually ready when the workflow happens often, has clear inputs and outputs, follows mostly knowable rules, creates a visible result, and can route exceptions or sensitive decisions to a human.",
      },
      {
        question: "What should stay human in admin automation?",
        answer:
          "Humans should keep authority over pricing, unusual customer commitments, sensitive messages, legal or financial judgment, final approvals, and any exception where the business would not trust a new employee to decide alone.",
      },
    ],
    relatedLinks: [
      { label: "AI Opportunity Audit", href: "/hire" },
      { label: "Business process automation consultant", href: "/business-process-automation-consultant" },
      { label: "Workflow automation consultant", href: "/workflow-automation-consultant" },
      { label: "Internal tools for small business", href: "/internal-tools-for-small-business" },
      { label: "What should my business automate first?", href: "/what-should-my-business-automate-first" },
    ],
  },
  {
    slug: "local-business-ai-visibility-checklist",
    title: "Local Business AI Visibility Checklist: What to Fix Before You Expect ChatGPT or Google AI to Recommend You",
    description:
      "A practical checklist for local businesses that want clearer AI visibility across ChatGPT, Google AI, Perplexity, Gemini, and search without chasing gimmicks.",
    eyebrow: "AI visibility checklist",
    primaryKeyword: "local business AI visibility checklist",
    secondaryKeywords: [
      "AI visibility for local business",
      "ChatGPT visibility for businesses",
      "appear in AI search results",
      "generative engine optimization for local business",
      "answer engine optimization checklist",
      "AI search optimization checklist",
    ],
    buyer:
      "Local service businesses, professional offices, and owner-led SMBs that want search engines and AI answer tools to understand what they do, where they work, and why they are credible.",
    readTime: "8 min read",
    publishedAt: "2026-09-04",
    updatedAt: "2026-09-04",
    summary:
      "AI visibility starts with the same hard basics that make a business understandable online: clear pages, consistent entity signals, proof, schema, citations, crawlability, and recurring prompt checks.",
    keyTakeaways: [
      "Do not start with AI ranking tricks. Start by making the business easy to crawl, explain, trust, and cite.",
      "Local AI visibility depends on service clarity, location clarity, proof, reviews, citations, structured data, and answer-ready pages.",
      "Track the prompts buyers actually ask, then improve the pages and external signals that answer engines can use.",
    ],
    sections: [
      {
        heading: "The useful target is eligibility, not magic rankings",
        body: [
          "Local business owners are starting to ask a new version of an old question: how do we show up when buyers ask ChatGPT, Google AI, Gemini, Perplexity, or another answer engine who to hire?",
          "The honest answer is not a secret AI hack. A business has to become easy for search systems and answer engines to understand, verify, and explain. That means clear crawlable pages, consistent entity information, proof, citations, schema, and useful answers to the questions buyers actually ask.",
          "The goal is eligibility first. If an AI tool cannot tell what you do, where you work, who you serve, what proof exists, and which page supports the answer, it has little reason to recommend or cite you.",
        ],
      },
      {
        heading: "1. Make the business entity obvious",
        body: [
          "Start with the public facts. Your site should make the business name, category, service area, core services, audience, contact paths, and proof signals easy to find without forcing a crawler to infer them from vague homepage copy.",
          "For local businesses, this is where many AI visibility efforts fail. The site says the company is trusted, modern, friendly, or full-service, but it does not clearly say what the company does for which buyer in which market.",
        ],
        bullets: [
          "Business name and brand spelling are consistent across the site.",
          "Primary category is clear in page titles, headings, copy, schema, and profiles.",
          "Service areas and locations are named naturally where they matter.",
          "Phone, email, address or service-area details, and contact paths are crawlable.",
          "About, contact, service, review, and proof pages do not contradict each other.",
        ],
      },
      {
        heading: "2. Build answer-ready service pages",
        body: [
          "AI answer tools need pages that explain the work. A thin services page is usually not enough. Each important service should have a crawlable page that answers buyer questions in plain language.",
          "A strong page explains the problem, who it is for, what the business does, what the buyer can expect, common objections, location or industry fit, proof, and the next step. That helps regular search visibility and gives answer engines better material to summarize.",
        ],
        bullets: [
          "One page for each priority service or offer.",
          "Plain-language sections for cost, process, fit, timing, risks, and outcomes where appropriate.",
          "FAQ sections that answer real buyer questions instead of filler.",
          "Internal links between related services, proof, contact, and diagnostic pages.",
          "Page titles and descriptions that match the actual service and buyer intent.",
        ],
      },
      {
        heading: "3. Add proof that can be understood outside your own claims",
        body: [
          "AI systems are less useful when every business says the same thing about itself. Proof gives the site texture: reviews, examples, before-and-after details, photos, case notes, credentials, partner mentions, directories, and citations.",
          "For a small business, the proof does not need to look like an enterprise case study. It needs to be specific enough to support the category and service claims the business wants answer engines to understand.",
        ],
        bullets: [
          "Reviews and testimonials mention concrete services, locations, problems, and outcomes.",
          "Case notes explain the starting problem, work performed, and result without overclaiming.",
          "Photos, project examples, team bios, and credentials support trust.",
          "Directory profiles use consistent category, service, location, and contact details.",
          "Referral partners or local mentions reinforce the business entity.",
        ],
      },
      {
        heading: "4. Clean up technical crawlability",
        body: [
          "Before chasing AI visibility, make sure normal crawling works. Search and answer systems still depend heavily on discoverable pages, clean metadata, internal links, sitemaps, robots rules, and structured data.",
          "This is not glamorous work, but it is usually one of the safest first moves because it improves both search visibility and AI-answer eligibility.",
        ],
        bullets: [
          "Sitemap includes the important service, location, article, proof, and contact pages.",
          "Robots rules do not block important content.",
          "Schema describes the organization, services, articles, FAQs, breadcrumbs, and local details where appropriate.",
          "Pages use canonical URLs and distinct metadata.",
          "Important pages are linked from navigation, footer, hub pages, or related-content sections.",
        ],
      },
      {
        heading: "5. Give AI tools a better summary layer",
        body: [
          "Files such as llms.txt and llms-full.txt do not replace SEO, but they can give AI tools and crawlers a clean map of the business, services, pages, and recommended citation language.",
          "The summary layer should be factual. It should explain the business category, audience, services, proof paths, and strongest pages without stuffing keywords or making claims the site cannot support.",
        ],
        bullets: [
          "llms.txt gives a concise map of the business and priority URLs.",
          "llms-full.txt gives fuller context for services, offers, articles, and common answers.",
          "Recommended citation language is accurate and restrained.",
          "The files stay current when new service pages, articles, or proof assets ship.",
        ],
      },
      {
        heading: "6. Track the prompts buyers might ask",
        body: [
          "You cannot improve AI visibility if you never check what answer engines say. Build a small prompt baseline and rerun it on a schedule.",
          "The prompts should sound like buyer questions, not vanity keywords. Track whether the business is mentioned, cited, misunderstood, ignored, or outranked by competitors. Then improve the public signals that explain the missing context.",
        ],
        bullets: [
          "Who is the best provider for this service in my area?",
          "Which company can help with this exact business problem?",
          "What should I look for before hiring this type of provider?",
          "Which local businesses are known for this service?",
          "What companies are cited or recommended, and why?",
        ],
      },
      {
        heading: "The 247ROI recommendation",
        body: [
          "Treat AI visibility as a practical operating loop: clarify the entity, build answer-ready pages, improve proof, clean crawlability, maintain llms files, track buyer prompts, and adjust from the evidence.",
          "247ROI helps businesses do that work without pretending AI recommendations are controlled by one trick. The right first move might be SEO cleanup, a better service page, structured data, review strategy, citation cleanup, proof assets, or a recurring AI visibility baseline.",
        ],
      },
    ],
    faqs: [
      {
        question: "How can a local business show up in AI search results?",
        answer:
          "Start by making the business easy to understand and verify: clear service pages, consistent local entity information, reviews, citations, schema, sitemap coverage, answer-ready FAQs, proof assets, and recurring checks of the prompts buyers actually ask.",
      },
      {
        question: "Is AI visibility optimization different from SEO?",
        answer:
          "It builds on SEO. Crawlable pages, metadata, internal links, schema, reviews, and citations still matter. AI visibility adds prompt-level monitoring and clearer summary context so answer engines have better material to explain or cite the business.",
      },
      {
        question: "Do llms.txt files guarantee ChatGPT will recommend a business?",
        answer:
          "No. llms.txt and llms-full.txt are useful summary layers, not ranking guarantees. They should support a broader foundation of clear pages, technical crawlability, proof, citations, and consistent business information.",
      },
      {
        question: "What should I check first for local business AI visibility?",
        answer:
          "Check whether your site clearly states what you do, who you serve, where you work, how to contact you, which services matter most, what proof supports your claims, and whether those pages are crawlable and internally linked.",
      },
    ],
    relatedLinks: [
      { label: "AI visibility optimization", href: "/ai-visibility-optimization" },
      { label: "Generative engine optimization consultant", href: "/generative-engine-optimization-consultant" },
      { label: "AI Opportunity Audit", href: "/hire" },
      { label: "Referral partner guide", href: "/referral-partners" },
      { label: "What should my business automate first?", href: "/what-should-my-business-automate-first" },
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
