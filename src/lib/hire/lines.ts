/** Light line variance so the audit doesn’t sound identical every session. */

const LINES = {
  askIndustry: [
    "What kind of business are you in?",
    "What industry is the business in?",
  ],
  vagueIndustry: [
    "Fair. We build AI employees that handle almost anything on a computer — sales, follow-up, support, ops, admin.\nWhat industry — chiro, roofing, agency, spa, something else?",
    "Got it — need the industry though.\nChiro, roofing, agency, spa… what are you?",
  ],
  clarifyIndustry: [
    "Just the industry — roofing, dental, chiro, agency, ecommerce… what are you?",
    "Industry is enough — dental, roofing, agency, ecommerce. Which one?",
  ],
  askHours: [
    (title: string) => `Hours a week on ${title.toLowerCase()}?`,
    (title: string) => `Roughly how many hours a week does ${title.toLowerCase()} eat?`,
  ],
  askProcess: [
    (title: string) =>
      `${title}. Walk me through how you do it now — start to finish.`,
    (title: string) =>
      `${title}. Step by step — how does that work today?`,
  ],
  confirmMirror: [
    (steps: string, hrs: number | string) =>
      `So: ${steps}. ~${hrs} hrs/week.\nDo I have that right?`,
    (steps: string, hrs: number | string) =>
      `Checking my notes: ${steps}. About ${hrs} hours a week.\nThat sound right?`,
  ],
  secondOrder: [
    (hrs: number | string) =>
      `If most of those ~${hrs} hours came back, what would you do with them?`,
    (hrs: number | string) =>
      `Suppose ~${hrs} hours landed back on your calendar — where do they go?`,
  ],
  wantSolve: [
    "Is that something you actually want solved — or have you accepted it?",
    "Do you want that fixed, or is it just how the business runs now?",
  ],
  valuable: [
    (pitch: string) =>
      `${pitch}\nWould building that be valuable?`,
    (pitch: string) =>
      `${pitch}\nIf we built it, would it be valuable?`,
  ],
} as const;

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function pickLine<T>(options: readonly T[], seed: string): T {
  const i = hashSeed(seed || "x") % options.length;
  return options[i]!;
}

export const hireLines = LINES;
