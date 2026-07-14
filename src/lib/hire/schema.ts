import { z } from "zod";

export const painTimeSchema = z.object({
  label: z.string(),
  minutesPerOccurrence: z.number().nullable(),
  occurrencesPerWeek: z.number().nullable(),
  hiddenMinutesPerOccurrence: z.number().nullable(),
  computedHoursPerWeek: z.number().nullable(),
  statedHoursPerWeek: z.number().nullable(),
  underestimationNote: z.string().nullable(),
});

export const painPointSchema = z.object({
  id: z.string(),
  title: z.string(),
  rawDescription: z.string(),
  tools: z.array(z.string()),
  processSteps: z.array(z.string()),
  whoDoesIt: z.string().nullable(),
  whyItHurts: z.string().nullable(),
  time: painTimeSchema,
  automatable: z.boolean().nullable(),
  confidence: z.number().min(0).max(1),
});

export const discoverySchema = z.object({
  businessName: z.string().nullable(),
  businessType: z.string().nullable(),
  role: z.string().nullable(),
  teamSize: z.string().nullable(),
  pains: z.array(painPointSchema),
  activePainId: z.string().nullable(),
  seekingSecondPain: z.boolean(),
  notes: z.array(z.string()),
  salesStage: z.string().nullable().optional(),
});

export const hireProposalSchema = z.object({
  employeeName: z.string(),
  roleTitle: z.string(),
  tagline: z.string(),
  hoursSavedPerWeek: z.object({
    low: z.number(),
    high: z.number(),
  }),
  monthlyHoursSaved: z.object({
    low: z.number(),
    high: z.number(),
  }),
  problemsSolved: z.array(z.string()).min(1),
  emotionalPayoff: z.string(),
  jobFromAtoZ: z.array(z.string()).min(4),
  howTheyUseIt: z.object({
    interface: z.string(),
    dailyLoop: z.string(),
    approvals: z.string(),
    humanHandoffs: z.string(),
  }),
  implementationSketch: z.string(),
  whyThisFirst: z.string(),
  secondaryOpportunity: z.string().nullable(),
  fitScore: z.number().min(0).max(100),
  fitNotes: z.string(),
  ctaLabel: z.string(),
});

export const chatTurnSchema = z.object({
  reply: z.string().min(1),
  phase: z.enum([
    "warming",
    "pain1",
    "time_verify",
    "process",
    "pain2_probe",
    "ready",
  ]),
  discovery: discoverySchema,
  proposal: hireProposalSchema.nullable(),
  readyForGate: z.boolean(),
  teaserLine: z.string().nullable(),
  choices: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        value: z.string(),
      })
    )
    .nullable()
    .optional(),
  inputMode: z.enum(["choices", "text", "both"]).nullable().optional(),
});

export type ChatTurn = z.infer<typeof chatTurnSchema>;
