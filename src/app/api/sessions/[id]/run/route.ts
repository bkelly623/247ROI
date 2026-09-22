import { after, NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/audit/sessions";
import { executeFullAudit } from "@/lib/audit/run-audit";
import { createServiceClient } from "@/lib/audit/supabase/server";

export const maxDuration = 300;

export async function POST(req: NextRequest, {params}: {params: Promise<{id:string}>}) {
  const {id}=await params;
  try {
    const session=await getSession(id);
    if (!session) return NextResponse.json({error:"Session not found"},{status:404});
    const body=await req.json().catch(()=>({}));
    if (session.report && !body?.force) return NextResponse.json({sessionId:id,report:session.report});
    const db=createServiceClient();
    if (!db) return NextResponse.json({error:"Audit storage is unavailable."},{status:503});
    const {data:claimed,error}=await db.rpc("audit_claim_public_scan",{p_session:id}).abortSignal(AbortSignal.timeout(8000));
    if (error) return NextResponse.json({error:"The audit could not be queued. Please retry."},{status:503});
    if (!claimed) return NextResponse.json({sessionId:id,status:"scanning"},{status:202});
    const callbackUrl=`${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/webhooks/athena`;
    after(async()=>{
      try {
        const report=await executeFullAudit({sessionId:id,businessName:session.business_name,
          websiteUrl:session.website_url,zipCode:session.zip_code,mode:session.mode,callbackUrl,previousReport:session.report,
          auditContext:session.audit_context ?? null});
        const saved=await updateSession(id,{status:"complete",report,progress_events:report.progressEvents,warm_tier:"warm_a"});
        if (!saved?.report) throw new Error("Report storage did not confirm the save");
      } catch {
        await updateSession(id,{status:"failed",progress_events:["Audit execution stopped. Reopen this saved link before attempting another scan; missing measurements are not negative findings."]}).catch(()=>null);
      }
    });
    return NextResponse.json({sessionId:id,status:"scanning",reportUrl:`/report/${id}`},{status:202});
  } catch {
    return NextResponse.json({error:"The audit could not be started. Please retry."},{status:503});
  }
}
