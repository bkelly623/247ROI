import { z } from "zod";

/** Confirmed service geography. Region values are enumerated, not free-form instructions. */
export const GeographySchema = z.enum(["local", "regional", "national", "mixed"]);
export type Geography = z.infer<typeof GeographySchema>;

export const SeoInvestmentSchema = z.enum(["agency", "in_house", "none", "unknown"]);
export type SeoInvestment = z.infer<typeof SeoInvestmentSchema>;

const OwnerAssertionSource = z.literal("owner_confirmed");

const ReviewsAssertionSchema = z.object({
  status: z.enum(["none", "has_reviews", "unknown"]),
  source: OwnerAssertionSource,
  note: z.string().max(500).optional(),
});

const GbpAssertionSchema = z.object({
  status: z.enum(["none", "has_listing", "ineligible", "unknown"]),
  source: OwnerAssertionSource,
  note: z.string().max(500).optional(),
});

const optionalTrimmed = (max: number) =>
  z.string().trim().min(1).max(max).optional();

/**
 * Validated audit context for Stage 3 measurement.
 * Absent / null after parse = legacy local behavior (not fabricated confirmed context).
 * Never hardcodes 247ROI prospect data. Optional disclosures only — never private GSC.
 */
export const AuditContextSchema = z
  .object({
    geography: GeographySchema,
    /** Explicit named service area required for regional/mixed. */
    serviceArea: optionalTrimmed(200),
    priorityService: optionalTrimmed(200),
    buyerType: optionalTrimmed(200),
    seoInvestment: SeoInvestmentSchema.optional(),
    ownerAssertions: z
      .object({
        reviews: ReviewsAssertionSchema.optional(),
        gbp: GbpAssertionSchema.optional(),
      })
      .optional(),
    /** Schema version for comparable assessments. */
    version: z.literal(1).default(1),
  })
  .superRefine((value, ctx) => {
    if ((value.geography === "regional" || value.geography === "mixed") && !value.serviceArea) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Regional/mixed geography requires an explicit named service area",
        path: ["serviceArea"],
      });
    }
  });

export type AuditContext = z.infer<typeof AuditContextSchema>;

/** Reject malicious/oversized payloads; never treat missing as confirmed national. */
export function parseAuditContext(raw: unknown):
  | { ok: true; context: AuditContext }
  | { ok: true; context: null }
  | { ok: false; error: string } {
  if (raw === undefined || raw === null || raw === "") return { ok: true, context: null };
  const parsed = AuditContextSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid audit context" };
  }
  return { ok: true, context: parsed.data };
}

/** Public intake: local vs national/remote confirmation (robust subset). */
export const PublicGeographyChoiceSchema = z.enum(["local", "national"]);
export type PublicGeographyChoice = z.infer<typeof PublicGeographyChoiceSchema>;

export function contextFromPublicChoice(
  choice: PublicGeographyChoice | undefined
): AuditContext | null {
  if (!choice) return null;
  return AuditContextSchema.parse({ geography: choice, version: 1 });
}

/** Legacy sessions and validated-absent context keep legacy local ZIP behavior. */
export function isLegacyLocalContext(context: AuditContext | null | undefined): boolean {
  return !context;
}
