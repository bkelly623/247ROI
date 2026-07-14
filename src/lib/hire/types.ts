export type HirePhase =
  | "warming"
  | "pain1"
  | "time_verify"
  | "process"
  | "pain2_probe"
  | "ready"
  | "gated"
  | "unlocked";

export type PainTimeBreakdown = {
  label: string;
  minutesPerOccurrence: number | null;
  occurrencesPerWeek: number | null;
  hiddenMinutesPerOccurrence: number | null;
  computedHoursPerWeek: number | null;
  statedHoursPerWeek: number | null;
  underestimationNote: string | null;
};

export type PainPoint = {
  id: string;
  title: string;
  rawDescription: string;
  tools: string[];
  processSteps: string[];
  whoDoesIt: string | null;
  whyItHurts: string | null;
  time: PainTimeBreakdown;
  automatable: boolean | null;
  confidence: number;
};

export type DiscoveryState = {
  businessName: string | null;
  businessType: string | null;
  role: string | null;
  teamSize: string | null;
  pains: PainPoint[];
  activePainId: string | null;
  seekingSecondPain: boolean;
  notes: string[];
  /** Rule-engine / LLM shared sales progress */
  salesStage?: string | null;
};

export type HireProposal = {
  employeeName: string;
  roleTitle: string;
  tagline: string;
  hoursSavedPerWeek: { low: number; high: number };
  monthlyHoursSaved: { low: number; high: number };
  problemsSolved: string[];
  emotionalPayoff: string;
  jobFromAtoZ: string[];
  howTheyUseIt: {
    interface: string;
    dailyLoop: string;
    approvals: string;
    humanHandoffs: string;
  };
  implementationSketch: string;
  whyThisFirst: string;
  secondaryOpportunity: string | null;
  fitScore: number;
  fitNotes: string;
  ctaLabel: string;
};

export type HireMessage = {
  role: "user" | "assistant";
  content: string;
};

export type HireSessionStatus =
  | "chatting"
  | "gate_ready"
  | "unlocked"
  | "abandoned";

export type HireSession = {
  id: string;
  created_at: string;
  updated_at: string;
  status: HireSessionStatus;
  phase: HirePhase;
  messages: HireMessage[];
  discovery: DiscoveryState;
  proposal: HireProposal | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  gate_shown_at: string | null;
  gate_submitted_at: string | null;
  unlocked_at: string | null;
  source: string | null;
  rep_token: string | null;
};

export function emptyDiscovery(): DiscoveryState {
  return {
    businessName: null,
    businessType: null,
    role: null,
    teamSize: null,
    pains: [],
    activePainId: null,
    seekingSecondPain: false,
    notes: [],
    salesStage: "open",
  };
}
