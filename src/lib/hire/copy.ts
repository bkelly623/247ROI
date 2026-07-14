export const HIRE_OPENING =
  "We’re finding work in your business that a human shouldn’t still be doing on a computer or phone.\n\nWhat takes the most time like that right now?\n\nIf you’re not sure, say \"not sure.\" If you’re rarely at a desk, say that.";

export const HIRE_PAGE = {
  eyebrow: "AI employee audit",
  headline: "Your next hire shouldn’t need a desk.",
  subhead: "We’ll name the first AI employee worth building — then we can look at revenue next.",
  phaseLabels: {
    warming: "Discovery",
    pain1: "Discovery",
    time_verify: "The real hours",
    process: "How it works",
    pain2_probe: "Almost there",
    ready: "Your hire",
  } as Record<string, string>,
  busy: "Thinking…",
  placeholder: "Answer here…",
  placeholderLocked: "Unlock below to continue…",
  sendHint: "Press Enter to send",
  /** Shown after hire packet unlock */
  upsellPrompt:
    "Next optional step: we can look at lead-gen and revenue — missed calls, website, AI visibility, reviews — and rank what would lift profit fastest.",
};
