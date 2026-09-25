import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AuditContextSchema,
  contextFromPublicChoice,
  parseAuditContext,
  PublicGeographyChoiceSchema,
} from "@/lib/audit/audit-context";
import { createSession, getRepSession } from "@/lib/audit/sessions";
import { normalizeUrl } from "@/lib/audit/utils";

const schema = z.object({
  businessName: z.string().min(2),
  websiteUrl: z.string().min(3),
  zipCode: z.string().min(5).max(10),
  repToken: z.string().optional(),
  /** Public intake: local vs national/remote confirmation. */
  geography: PublicGeographyChoiceSchema.optional(),
  /** Full validated context when supplied by a trusted caller; never accepts budget/authorization. */
  auditContext: AuditContextSchema.optional(),
  /** SMS opt-in: phone number and explicit consent captured on the public intake form. */
  phone: z.string().min(7).optional(),
  smsConsent: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());

    // SMS opt-in enforcement: if a phone number is supplied, explicit consent must accompany it.
    // TODO(247ROI): persist body.phone / body.smsConsent to scan_sessions once that column exists
    // in Supabase; logged here in the interim so consent capture is not silently dropped.
    if (body.phone) {
      if (!body.smsConsent) {
        return NextResponse.json(
          { error: "SMS consent checkbox must be checked to submit a phone number." },
          { status: 400 }
        );
      }
      console.log("[sms-consent]", {
        phone: body.phone,
        smsConsent: body.smsConsent,
        businessName: body.businessName,
        at: new Date().toISOString(),
      });
    }
    let mode: "organic" | "rep" = "organic";
    let businessName = body.businessName;
    let websiteUrl = normalizeUrl(body.websiteUrl);
    let zipCode = body.zipCode;

    if (body.repToken) {
      const rep = await getRepSession(body.repToken);
      if (rep) {
        mode = "rep";
        if (rep.business_name) businessName = rep.business_name;
        if (rep.website_url) websiteUrl = normalizeUrl(rep.website_url);
        if (rep.zip_code) zipCode = rep.zip_code;
      }
    }

    let auditContext = body.auditContext ?? contextFromPublicChoice(body.geography) ?? null;
    if (body.auditContext) {
      const checked = parseAuditContext(body.auditContext);
      if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
      auditContext = checked.context;
    }

    const session = await createSession({
      businessName,
      websiteUrl,
      zipCode,
      mode,
      repToken: body.repToken,
      auditContext,
    });

    return NextResponse.json({ session });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
