export type ChatChoice = {
  id: string;
  label: string;
  value: string;
};

export type InputMode = "choices" | "text" | "both";

/** Most common SMB desk/computer time sinks — keep under ~8 for thumb UX */
export const PAIN_CHOICES: ChatChoice[] = [
  { id: "followups", label: "Chasing people / follow-ups", value: "pain:followups" },
  { id: "inbox", label: "Inbox, texts, or messages", value: "pain:inbox" },
  { id: "scheduling", label: "Scheduling / booking", value: "pain:scheduling" },
  { id: "quotes", label: "Quotes, estimates, or proposals", value: "pain:quotes" },
  { id: "billing", label: "Invoices / billing admin", value: "pain:billing" },
  { id: "leads", label: "Missed calls / slow lead response", value: "pain:leads" },
  { id: "data", label: "Copying data between systems", value: "pain:data" },
  { id: "not_desk", label: "I'm rarely at a desk", value: "meta:not_desk" },
  { id: "other", label: "Something else", value: "meta:other" },
];

export const WHO_CHOICES: ChatChoice[] = [
  { id: "me", label: "Me — on my phone or after hours", value: "who:me" },
  { id: "employee", label: "An employee / office person", value: "who:employee" },
  { id: "family", label: "Spouse or family", value: "who:family" },
  { id: "nobody", label: "Nobody — it piles up", value: "who:nobody" },
];

export const TIME_BAND_CHOICES: ChatChoice[] = [
  { id: "lt10", label: "Under 10 hours / week", value: "time:lt10" },
  { id: "10_20", label: "10–20 hours / week", value: "time:10_20" },
  { id: "20_30", label: "20–30 hours / week", value: "time:20_30" },
  { id: "gt30", label: "More than 30 hours / week", value: "time:gt30" },
  { id: "fte", label: "We have someone full-time on this", value: "time:fte" },
];

export const MINUTES_CHOICES: ChatChoice[] = [
  { id: "m5", label: "About 5 minutes", value: "mins:5" },
  { id: "m15", label: "About 15 minutes", value: "mins:15" },
  { id: "m30", label: "About 30 minutes", value: "mins:30" },
  { id: "m45", label: "About 45 minutes", value: "mins:45" },
  { id: "m60", label: "An hour or more", value: "mins:60" },
];

export const COUNT_CHOICES: ChatChoice[] = [
  { id: "c3", label: "1–5 times / week", value: "count:3" },
  { id: "c10", label: "About 10 / week", value: "count:10" },
  { id: "c20", label: "About 20 / week", value: "count:20" },
  { id: "c40", label: "40+ / week", value: "count:40" },
  { id: "c_daily", label: "Basically every day, multiple times", value: "count:50" },
];

export const MIRROR_CHOICES: ChatChoice[] = [
  { id: "yes", label: "Yes — that's how it works", value: "mirror:yes" },
  { id: "tweak", label: "Close, but let me fix something", value: "mirror:tweak" },
];

export const VALUE_CHOICES: ChatChoice[] = [
  { id: "yes", label: "Yes — that would help", value: "value:yes" },
  { id: "maybe", label: "Maybe — I want to see more", value: "value:maybe" },
  { id: "no", label: "Not really", value: "value:no" },
];

export const OBJECTION_CHOICES: ChatChoice[] = [
  { id: "cost", label: "I'm worried about cost", value: "obj:cost" },
  { id: "trust", label: "I don't trust AI with this yet", value: "obj:trust" },
  { id: "time", label: "We're too busy to set it up", value: "obj:time" },
  { id: "different", label: "Our problem is actually something else", value: "obj:different" },
  { id: "hard_no", label: "Hard no on this one", value: "obj:hard_no" },
];

export function painTitleFromValue(value: string): string | null {
  const map: Record<string, string> = {
    "pain:followups": "Follow-ups",
    "pain:inbox": "Inbox / messages",
    "pain:scheduling": "Scheduling",
    "pain:quotes": "Quotes / proposals",
    "pain:billing": "Billing admin",
    "pain:leads": "Missed calls / lead response",
    "pain:data": "Data entry between systems",
  };
  return map[value] ?? null;
}

export function timeBandHours(value: string): number | null {
  const map: Record<string, number> = {
    "time:lt10": 7,
    "time:10_20": 15,
    "time:20_30": 25,
    "time:gt30": 35,
    "time:fte": 40,
  };
  return map[value] ?? null;
}
