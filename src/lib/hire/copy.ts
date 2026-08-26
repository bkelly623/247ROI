export const HIRE_OPENING =
  "Welcome to the 247ROI AI Opportunity Audit.\n\nThis is a guided business systems audit for owners and operators who want to find the bottlenecks worth fixing first before spending money on the wrong software.\n\nThe goal is simple: find the first workflow where a better system could save time, improve visibility, reduce repeated computer work, or create measurable ROI. That system might be a custom automation, a dashboard, an internal app, an AI agent, a software integration, or a clearer human approval process.\n\nWe will look for where time, money, data, admin, visibility, or handoffs are leaking. Then we will separate what software can prepare or handle from what should stay under human control.\n\nStart with the basics: what kind of business are you in, and what work keeps getting delayed, repeated, missed, or stuck on your plate?";

/**
 * Alternative opener — the “tech arc” story. Kept for A/B testing once
 * there’s enough traffic. To test, swap HIRE_OPENING or split by session.
 */
export const HIRE_OPENING_TECH_ARC =
  "Humans have always invented tools to make life easier.\n\nPen and paper. The telephone. Computers. Websites. Social media. Now AI, automation, dashboards, and custom software can handle more of the work that used to live on the computer.\n\nSame story every time: the useful tool is the one that removes a real bottleneck.\n\nThis isn’t a form. It’s a conversation — and by the end you’ll know which business system is most worth improving first.\n\nSo… what kind of business are you in?";

export const HIRE_PAGE = {
  eyebrow: "Business Systems Audit",
  headline: "Find the bottleneck worth fixing first.",
  subhead:
    "A guided discovery tool for owners and operators who want a practical system opportunity - not another vague software pitch.",
  proofPoints: [
    "Best bottleneck to fix first",
    "Plain-English system map",
    "Automation, dashboard, app, or agent fit",
    "Practical next step",
  ],
  microcopy:
    "Built for local businesses, service firms, professional offices, and teams with scattered data, repeated computer work, or owner bottlenecks.",
  busy: "…",
  placeholder: "Your answer…",
  placeholderLocked: "Unlock below…",
  sendHint: "Enter to send",
  triageEyebrow: "Start fast",
  triageTitle: "Pick the bottleneck closest to the money or the owner.",
  triageNote:
    "This gives the audit useful context immediately. You can still describe the messy version in your own words after it opens the right path.",
  routingEyebrow: "Already know you need help?",
  routingTitle: "Talk to 247ROI directly or use the audit to sharpen the first project.",
  routingBody:
    "The useful call is not a generic AI demo. Bring one messy workflow and we will decide what should be automated, what needs a dashboard or internal app, and what should stay human.",
  routingProof: [
    "Diagnosis before build",
    "Human approvals stay explicit",
    "Systems can include automations, dashboards, apps, integrations, or agents",
  ],
  triageChoices: [
    {
      id: "leads",
      title: "Leads and follow-up",
      body: "Missed calls, slow replies, stale estimates, no-shows, or prospects falling out of the pipeline.",
      message:
        "The bottleneck I want to look at first is leads and follow-up: missed calls, slow replies, stale estimates, or prospects falling out of the pipeline.",
    },
    {
      id: "admin",
      title: "Inbox and admin",
      body: "Repeated work across email, calendars, customer records, documents, portals, or spreadsheets.",
      message:
        "The bottleneck I want to look at first is inbox and admin work: repeated work across email, calendars, customer records, documents, portals, or spreadsheets.",
    },
    {
      id: "visibility",
      title: "Dashboards and reporting",
      body: "The business runs on scattered updates, unclear numbers, manual reports, or too many status questions.",
      message:
        "The bottleneck I want to look at first is dashboards and reporting: scattered updates, unclear numbers, manual reports, or too many status questions.",
    },
    {
      id: "bids",
      title: "Estimates and bids",
      body: "Quoting, takeoffs, proposal prep, pricing handoffs, revisions, or follow-up after the estimate goes out.",
      message:
        "The bottleneck I want to look at first is estimates and bids: quoting, takeoffs, proposal prep, pricing handoffs, revisions, or follow-up.",
    },
    {
      id: "docs",
      title: "Research and documents",
      body: "Summaries, drafts, research, intake notes, job files, SOPs, handoff packets, or client-facing reports.",
      message:
        "The bottleneck I want to look at first is research and documents: summaries, drafts, intake notes, job files, SOPs, handoff packets, or reports.",
    },
    {
      id: "unsure",
      title: "Not sure yet",
      body: "There are several annoying workflows and the first job is figuring out which one is worth fixing.",
      message:
        "I'm not sure which workflow is the best first target yet. There are several annoying bottlenecks, and I want help figuring out which one is most worth fixing.",
    },
  ],
};
