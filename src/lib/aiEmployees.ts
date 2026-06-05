export type AiEmployeeOffer = {
  slug: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  priceHint: string;
  bestFor: string;
  route: string;
  icon: "phone" | "message" | "calculator" | "fileSearch" | "megaphone" | "clipboard";
  priority: "core" | "contractor" | "growth";
  painPoints: string[];
  handles: string[];
  outcomes: string[];
  goodFit: string[];
  notFit: string[];
  steps: { title: string; description: string }[];
};

export const AI_EMPLOYEE_OFFERS: AiEmployeeOffer[] = [
  {
    slug: "ai-receptionist",
    title: "AI Receptionist",
    shortTitle: "Receptionist",
    eyebrow: "Front desk AI employee",
    headline: "Every call answered. Every lead captured.",
    subheadline:
      "A 24/7 AI receptionist for trades and service businesses that answers overflow, captures job details, routes urgent calls, and pushes leads toward booked work.",
    priceHint: "30-day trial for qualified businesses",
    bestFor: "Call-heavy local service businesses losing jobs to voicemail, after-hours gaps, and slow response.",
    route: "/ai-employees/ai-receptionist",
    icon: "phone",
    priority: "core",
    painPoints: [
      "Missed calls during jobs, nights, weekends, and lunch rushes",
      "Voicemails that never turn into booked estimates",
      "Weak intake notes that force the owner to chase details",
    ],
    handles: ["Answering and intake", "Urgency routing", "Job detail capture", "Booking prompts", "Call summaries"],
    outcomes: ["More inbound demand captured", "Cleaner handoffs", "Faster response", "Fewer lost emergency jobs"],
    goodFit: [
      "Trades company with steady inbound calls",
      "Owner or dispatcher cannot answer every call",
      "Average job value makes one recovered job meaningful",
    ],
    notFit: ["No inbound call volume", "No capacity to take more work", "No clear service area or booking rules"],
    steps: [
      { title: "Map the calls", description: "We define service area, urgent jobs, common questions, and handoff rules." },
      { title: "Connect the line", description: "We wire overflow, after-hours, or a dedicated number into the AI receptionist." },
      { title: "Track recovered value", description: "You get weekly scorecards tied to captured calls and booked opportunities." },
    ],
  },
  {
    slug: "ai-follow-up-agent",
    title: "AI Follow-Up Agent",
    shortTitle: "Follow-Up",
    eyebrow: "Speed-to-lead AI employee",
    headline: "Stop letting warm leads cool off.",
    subheadline:
      "An AI follow-up employee that texts, emails, qualifies, reminds, and reactivates leads so more inquiries become appointments.",
    priceHint: "Starting at $597/month after setup",
    bestFor: "Businesses with form fills, missed calls, estimates, or old leads that need faster second and third touches.",
    route: "/ai-employees/ai-follow-up-agent",
    icon: "message",
    priority: "core",
    painPoints: [
      "New leads wait hours before hearing back",
      "Past estimates sit untouched",
      "No-shows and unconfirmed appointments waste calendar space",
    ],
    handles: ["Instant SMS/email follow-up", "Lead qualification", "Appointment reminders", "Estimate reactivation", "Human handoff"],
    outcomes: ["Higher lead-to-appointment rate", "More old estimates revived", "Less admin work", "Cleaner pipeline visibility"],
    goodFit: [
      "You already generate leads",
      "Follow-up is inconsistent or manual",
      "You have a CRM, spreadsheet, inbox, or calendar to connect",
    ],
    notFit: ["No lead source", "No clear next step for prospects", "No consent or opt-out process for outreach"],
    steps: [
      { title: "Map lead paths", description: "We inspect where new, missed, and stale leads currently stall." },
      { title: "Build sequences", description: "We create follow-up logic for speed-to-lead, reminders, and reactivation." },
      { title: "Measure booked outcomes", description: "We report replies, appointments, no-shows reduced, and revived opportunities." },
    ],
  },
  {
    slug: "ai-estimator",
    title: "AI Estimator",
    shortTitle: "Estimator",
    eyebrow: "Quoting AI employee",
    headline: "Get estimates out before the buyer goes cold.",
    subheadline:
      "An AI estimating assistant that collects job details, organizes photos, drafts scope notes, and prepares quote-ready summaries for contractor review.",
    priceHint: "Custom build after workflow review",
    bestFor: "Contractors losing speed and margin because estimates take too long to prepare or follow up.",
    route: "/ai-employees/ai-estimator",
    icon: "calculator",
    priority: "contractor",
    painPoints: [
      "Estimating creates a bottleneck for the owner",
      "Incomplete intake causes repeat calls",
      "Quotes go out slowly and competitors win first",
    ],
    handles: ["Job detail collection", "Photo/document organization", "Scope draft creation", "Quote-ready summaries", "Follow-up reminders"],
    outcomes: ["Faster quote turnaround", "Cleaner estimate packets", "Less owner admin", "More timely follow-up"],
    goodFit: [
      "You quote jobs repeatedly each week",
      "Your team already has pricing rules or templates",
      "A human reviews final numbers before sending",
    ],
    notFit: ["No repeatable estimating process", "No pricing logic", "You need fully autonomous final bids with no review"],
    steps: [
      { title: "Collect pricing logic", description: "We map estimate types, required inputs, templates, and approval rules." },
      { title: "Build estimate packets", description: "The AI organizes details into review-ready summaries and quote drafts." },
      { title: "Tighten turnaround", description: "We measure quote speed, follow-up completion, and owner time saved." },
    ],
  },
  {
    slug: "ai-job-bidding-agent",
    title: "AI Job Bidding Agent",
    shortTitle: "Job Bidding",
    eyebrow: "Pipeline AI employee",
    headline: "Find, qualify, and prepare more jobs worth bidding.",
    subheadline:
      "An AI bidding assistant that monitors opportunities, screens fit, gathers requirements, and prepares bid checklists before your team spends time on the wrong jobs.",
    priceHint: "Custom build for bid-driven contractors",
    bestFor: "Contractors, subs, and service firms that need more disciplined bid intake and prequalification.",
    route: "/ai-employees/ai-job-bidding-agent",
    icon: "clipboard",
    priority: "contractor",
    painPoints: [
      "Good bid opportunities get missed",
      "Teams waste time on poor-fit jobs",
      "Requirements are scattered across emails, portals, and documents",
    ],
    handles: ["Opportunity monitoring", "Fit scoring", "Requirement extraction", "Bid checklist prep", "Deadline reminders"],
    outcomes: ["More qualified bids", "Less time wasted", "Cleaner requirements", "Earlier deadline visibility"],
    goodFit: [
      "You regularly review bid opportunities",
      "There are clear go/no-go criteria",
      "Missing a deadline or requirement costs real money",
    ],
    notFit: ["No repeat bid workflow", "No target job profile", "No person responsible for final review"],
    steps: [
      { title: "Define bid fit", description: "We map job types, geography, margin rules, deadlines, and required documents." },
      { title: "Organize opportunities", description: "The AI screens and summarizes jobs before they hit your team." },
      { title: "Improve bid discipline", description: "We track qualified opportunities, deadlines, and prep time reduced." },
    ],
  },
  {
    slug: "ai-takeoff-assistant",
    title: "AI Takeoff Assistant",
    shortTitle: "Takeoffs",
    eyebrow: "Preconstruction AI employee",
    headline: "Turn plans into cleaner takeoff prep.",
    subheadline:
      "An AI takeoff assistant that organizes plan sets, extracts key requirements, flags missing details, and prepares measurement notes for estimator review.",
    priceHint: "Custom build for construction workflows",
    bestFor: "Construction and specialty trade teams buried in plans, specs, revisions, and preconstruction admin.",
    route: "/ai-employees/ai-takeoff-assistant",
    icon: "fileSearch",
    priority: "contractor",
    painPoints: [
      "Plan review eats estimator time",
      "Specs and addenda get missed",
      "Takeoff prep is inconsistent across jobs",
    ],
    handles: ["Plan set organization", "Spec extraction", "Revision checks", "Measurement note prep", "Estimator review handoff"],
    outcomes: ["Less prep time", "Fewer missed requirements", "Cleaner estimator workflow", "Better bid readiness"],
    goodFit: [
      "You repeatedly review drawings or specs",
      "Human estimators stay in control",
      "Preconstruction admin is slowing bid volume",
    ],
    notFit: ["No digital plans or repeat process", "You need guaranteed final quantities without review", "No estimator to verify outputs"],
    steps: [
      { title: "Map plan workflow", description: "We document how plans, specs, addenda, and notes move through the team." },
      { title: "Structure review prep", description: "The AI organizes files and creates estimator-ready requirement notes." },
      { title: "Measure saved time", description: "We track review time reduced, issues flagged, and bid packets prepared." },
    ],
  },
  {
    slug: "ai-content-employee",
    title: "AI Content Employee",
    shortTitle: "Content",
    eyebrow: "Growth AI employee",
    headline: "Turn jobs, proof, and offers into daily market presence.",
    subheadline:
      "An AI content employee that turns your services, customer questions, reviews, photos, and offers into posts, scripts, campaigns, and follow-up assets.",
    priceHint: "Starting at $597/month after setup",
    bestFor: "Businesses that need more consistent content without pulling the owner into a blank-page content grind.",
    route: "/ai-employees/ai-content-employee",
    icon: "megaphone",
    priority: "growth",
    painPoints: [
      "Content is inconsistent because the owner is busy",
      "Good jobs and proof never become marketing assets",
      "Offers are not packaged clearly enough for outreach",
    ],
    handles: ["Social posts", "Short-form scripts", "Offer angles", "Review-based content", "Campaign copy"],
    outcomes: ["More consistent visibility", "Better sales assets", "More reusable proof", "Less owner content time"],
    goodFit: [
      "You have completed jobs, reviews, photos, or proof",
      "You want consistent market presence",
      "Someone can approve content before publishing",
    ],
    notFit: ["No real proof or offer", "No approval process", "You expect content alone to fix weak sales follow-up"],
    steps: [
      { title: "Mine your proof", description: "We collect services, FAQs, reviews, photos, offers, and customer objections." },
      { title: "Build content lanes", description: "The AI creates repeatable posts, scripts, promos, and nurture assets." },
      { title: "Publish with discipline", description: "You approve and deploy content tied to offers and sales conversations." },
    ],
  },
];

export const featuredAiEmployeeOffers = AI_EMPLOYEE_OFFERS.filter((offer) => offer.priority !== "growth");

export function getAiEmployeeOffer(slug: string) {
  return AI_EMPLOYEE_OFFERS.find((offer) => offer.slug === slug);
}
