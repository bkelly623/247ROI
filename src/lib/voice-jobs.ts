import { createHash } from "node:crypto";
import { inquiryStore, type InquiryStore } from "@/lib/inquiries";
import { handleVoiceEvent, type VoiceEvent } from "@/lib/missed-calls";

export async function queueVoiceEvent(event: VoiceEvent, store: InquiryStore) {
  await store.ensure();
  const id = createHash("sha256").update(JSON.stringify(event)).digest("hex");
  await store.put(`voice-jobs/${id}.json`, event);
  return id;
}
async function alertOwner(parent: string, reason: string, store: InquiryStore) {
  const key = `voice-alerts/${parent}-${reason}.json`;
  if (await store.get(key)) return;
  const token = process.env.CONTACT_TELEGRAM_BOT_TOKEN, chat = process.env.CONTACT_TELEGRAM_CHAT_ID;
  if (!token || !chat) throw new Error("voice_alert_unconfigured");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ chat_id: chat, text: `247ROI call needs review\nCall: ${parent}\n${reason === "detection-unknown" ? "Twilio could not distinguish a person from voicemail. No automatic text was sent to avoid texting an answered call." : "SMS acceptance is uncertain. Automatic resending is paused to prevent duplicate texts; inspect the Twilio message log."}` }),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error("voice_alert_failed");
  await store.put(key, { at: Date.now(), messageId: result.result?.message_id });
}
export async function processVoiceJob(id: string, store = inquiryStore(), handle = handleVoiceEvent) {
  const event = await store.get<VoiceEvent>(`voice-jobs/${id}.json`);
  if (!event) return;
  const result = await handle(event);
  if (result === "scheduled") return "scheduled"; // Keep durable job until due.
  const parent = event.parent;
  if (result === "sms_acceptance_unknown" || result === "duplicate_suppressed") {
    const receipt = await store.get<{ ok: boolean; uncertain?: boolean; code?: number }>(`voice-results/${parent}.json`);
    const claim = await store.get<{ at: number }>(`voice-claims/${parent}.json`);
    if (!receipt && claim && Date.now() - claim.at < 90000) throw new Error("voice_send_in_progress");
    if (receipt && !receipt.ok && !receipt.uncertain && receipt.code !== 21610) throw new Error("voice_retry_pending");
    if ((!receipt && claim) || receipt?.uncertain) await alertOwner(parent, "send-uncertain", store);
  }
  if (event.kind === "amd" && event.answeredBy === "unknown" && !await store.get(`voice-human/${parent}.json`) && !await store.get(`voice-machine/${parent}.json`)) {
    await alertOwner(parent, "detection-unknown", store);
  }
  await store.remove(`voice-jobs/${id}.json`);
}
// The response is already returned to Twilio. Wait only inside its supported
// after-response task; the durable job and timer survive interrupted execution.
export async function processVoiceJobAfterResponse(id: string, store = inquiryStore(), handle = handleVoiceEvent) {
  if (await processVoiceJob(id, store, handle) !== "scheduled") return;
  const event = await store.get<VoiceEvent>(`voice-jobs/${id}.json`);
  if (!event) return;
  const schedule = await store.get<{ dueAt: number }>(`voice-schedule/${event.parent}.json`);
  if (!schedule) throw new Error("voice_schedule_missing");
  const wait = schedule.dueAt - Date.now();
  if (wait > 15000) return; // Older/longer schedules remain in durable recovery.
  if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
  await processVoiceJob(id, store, handle);
}
export async function retryVoiceJobs() {
  const store = inquiryStore(Date.now() + 45000);
  await store.ensure();
  const deadline = Date.now() + 35000;
  let processed = 0, pending = 0, scheduled = 0;
  const jobs = await store.list("voice-jobs");
  for (const job of jobs.slice(0, 20)) {
    if (Date.now() > deadline) return { processed, pending, scheduled, hasMore: true };
    try { if (await processVoiceJob(job.name.replace(/\.json$/, ""), store) === "scheduled") scheduled++; else processed++; }
    catch { pending++; }
  }
  return { processed, pending, scheduled, hasMore: jobs.length > 20 };
}
