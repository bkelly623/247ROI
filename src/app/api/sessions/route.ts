import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, getRepSession } from "@/lib/audit/sessions";
import { normalizeUrl } from "@/lib/audit/utils";

const schema = z.object({
  businessName: z.string().min(2),
  websiteUrl: z.string().min(3),
  zipCode: z.string().min(5).max(10),
  repToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
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

    const session = await createSession({
      businessName,
      websiteUrl,
      zipCode,
      mode,
      repToken: body.repToken,
    });

    return NextResponse.json({ session });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
