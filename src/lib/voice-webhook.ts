import { after, NextRequest, NextResponse } from "next/server";
import { validTwilioSignature } from "@/lib/twilio-signature";
import { isCallSid, type VoiceEvent } from "@/lib/missed-calls";
import { inquiryStore } from "@/lib/inquiries";
import { queueVoiceEvent, processVoiceJob } from "@/lib/voice-jobs";

export async function voiceWebhook(req: NextRequest, defaultKind: VoiceEvent["kind"]) {
  if (!req.headers.get("x-twilio-signature")) return new NextResponse("Forbidden", { status: 403 });
  const form = await req.formData();
  if (!validTwilioSignature(req, form)) return new NextResponse("Forbidden", { status: 403 });
  // Dial actions only control voice continuation. Independent timestamped child
  // callbacks own SMS decisions, even when the original caller hangs up early.
  if (defaultKind === "dial") {
    if (!isCallSid(String(form.get("CallSid") || ""))) return new NextResponse("Bad call", { status: 400 });
    return new NextResponse('<Response><Hangup/></Response>', { headers: { "Content-Type": "text/xml" } });
  }
  const kind = req.nextUrl.searchParams.get("kind") || defaultKind;
  if (!["child", "amd", "parent"].includes(kind)) return new NextResponse("Bad event", { status: 400 });
  const parent = req.nextUrl.searchParams.get("parent") || String(form.get("ParentCallSid") || form.get("CallSid") || "");
  if (!isCallSid(parent)) return new NextResponse("Bad call", { status: 400 });
  const timestamp = form.get("Timestamp") ? Date.parse(String(form.get("Timestamp"))) : (kind === "amd" ? Date.now() : NaN);
  if (!Number.isFinite(timestamp)) return new NextResponse("Missing event timestamp", { status: 400 });
  try {
    const id = await queueVoiceEvent({ kind: kind as VoiceEvent["kind"], parent, status: String(form.get("CallStatus") || ""), answeredBy: String(form.get("AnsweredBy") || ""), timestamp }, inquiryStore(Date.now() + 6000));
    after(async () => { try { await processVoiceJob(id); } catch { console.error("[voice_job_pending]", id); } });
  } catch {
    console.error("[voice_callback_enqueue_failed]", { parent, kind });
    return new NextResponse("Retry", { status: 503 });
  }
  return new NextResponse('<Response/>', { headers: { "Content-Type": "text/xml" } });
}
