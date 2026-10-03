import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey } from "@/lib/audit/supabase/server";
import { z } from "zod";

export const inquirySchema = z.object({
  submissionId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).refine(v => /^\+?[\d\s().-]+$/.test(v) && v.replace(/\D/g, "").length >= 10 && v.replace(/\D/g, "").length <= 15, "Enter a valid phone number."),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
  message: z.string().trim().min(5).max(1800),
  smsConsent: z.boolean(),
  topic: z.enum(["missed-call-text-back", "ai-receptionist", "lead-capture", "custom-software", "workflow-automation", "dashboard", "unsure"]).default("unsure"),
  source: z.string().max(200).default("/contact"),
  campaign: z.string().max(200).default(""),
  website: z.string().max(200).optional(),
});
export type InquiryInput = z.infer<typeof inquirySchema>;
export type SavedInquiry = Omit<InquiryInput, "website"> & { receivedAt: string; fingerprint: string; ipHash: string; consentVersion: "contact-2026-10" };
type Receipt = { notifiedAt: string; messageId: number; channel: "telegram" };
const BUCKET = "website-inquiries";
const digest = (s: string) => createHash("sha256").update(s).digest("hex");

/** Private storage is the durable record/outbox, never a public analytics event. */
export function inquiryStore() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceRoleKey();
  if (!url || !key || key === "[SENSITIVE]") throw new Error("inquiry_storage_unconfigured");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) } });
  return {
    async ensure() {
      let result = await db.storage.getBucket(BUCKET);
      if (result.error) {
        await db.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 24000, allowedMimeTypes: ["application/json"] });
        result = await db.storage.getBucket(BUCKET);
      }
      if (result.error || !result.data || result.data.public) throw new Error("private_inquiry_storage_unavailable");
    },
    async get<T>(key: string): Promise<T | null> {
      // Check existence through the listing API: missing-object download errors vary
      // between Storage API versions and must not be confused with an outage.
      const slash = key.lastIndexOf("/");
      const prefix = key.slice(0, slash), name = key.slice(slash + 1);
      const listed = await db.storage.from(BUCKET).list(prefix, { search: name, limit: 2 });
      if (listed.error) throw new Error("inquiry_list_failed");
      if (!listed.data.some(item => item.name === name)) return null;
      const { data, error } = await db.storage.from(BUCKET).download(key);
      if (error || !data) throw new Error("inquiry_read_failed");
      return JSON.parse(await data.text()) as T;
    },
    async put(key: string, value: unknown, upsert = false) {
      const { error } = await db.storage.from(BUCKET).upload(key, JSON.stringify(value), { contentType: "application/json", upsert });
      if (error && (/already exists|duplicate/i.test(error.message) || String((error as { statusCode?: string }).statusCode) === "409")) return false;
      if (error) throw new Error("inquiry_write_failed");
      return true;
    },
    async remove(key: string) {
      const { error } = await db.storage.from(BUCKET).remove([key]);
      if (error) throw new Error("inquiry_remove_failed");
    },
    async list(prefix: string, offset = 0) {
      const { data, error } = await db.storage.from(BUCKET).list(prefix, { limit: 100, offset, sortBy: { column: "created_at", order: "asc" } });
      if (error) throw new Error("inquiry_list_failed");
      return data.filter(item => item.name.endsWith(".json"));
    },
  };
}
export type InquiryStore = ReturnType<typeof inquiryStore>;

export async function saveInquiry(input: InquiryInput, ip: string, store: InquiryStore = inquiryStore()): Promise<SavedInquiry> {
  await store.ensure();
  const payload = { ...input };
  delete payload.website;
  const fingerprint = digest(JSON.stringify(payload));
  const key = `submissions/${input.submissionId}.json`;
  const existing = await store.get<SavedInquiry>(key);
  if (existing) {
    if (existing.fingerprint !== fingerprint) throw new Error("idempotency_conflict");
    return existing;
  }
  const ipHash = digest(`${process.env.CONTACT_ADMIN_SECRET || "inquiry"}:${ip}`);
  // Persistent limit: six NEW inquiries per IP per hour; retries reuse the saved ID.
  const hour = Math.floor(Date.now() / 3600000);
  let allowed = false;
  for (let slot = 0; slot < 6; slot++) {
    if (await store.put(`limits/${ipHash}-${hour}-${slot}.json`, { at: new Date().toISOString() })) { allowed = true; break; }
  }
  if (!allowed) throw new Error("rate_limited");
  const saved: SavedInquiry = { ...payload, receivedAt: new Date().toISOString(), fingerprint, ipHash, consentVersion: "contact-2026-10" };
  if (!await store.put(key, saved)) {
    const concurrent = await store.get<SavedInquiry>(key);
    if (!concurrent || concurrent.fingerprint !== fingerprint) throw new Error("idempotency_conflict");
    return concurrent;
  }
  // Read the exact durable record before acknowledging receipt to the visitor.
  const verified = await store.get<SavedInquiry>(key);
  if (!verified || verified.fingerprint !== fingerprint) throw new Error("inquiry_verification_failed");
  return verified;
}

export function notificationText(inquiry: SavedInquiry) {
  return ["247ROI website inquiry", `Reference: ${inquiry.submissionId}`, `Interest: ${inquiry.topic}`, `Name: ${inquiry.name}`, `Phone: ${inquiry.phone}`, inquiry.email ? `Email: ${inquiry.email}` : "", `SMS consent: ${inquiry.smsConsent ? "Yes" : "No — do not text"}`, `Source: ${inquiry.source}`, inquiry.campaign ? `Campaign: ${inquiry.campaign}` : "", "", inquiry.message].filter(Boolean).join("\n");
}

export async function notifyInquiry(inquiry: SavedInquiry, store: InquiryStore = inquiryStore(), send: typeof fetch = fetch): Promise<boolean> {
  const id = inquiry.submissionId;
  if (await store.get<Receipt>(`receipts/${id}.json`)) return true;
  const lockKey = `locks/${id}.json`;
  const lock = await store.get<{ at: number }>(lockKey);
  if (lock && Date.now() - lock.at < 120000) return false;
  if (lock) await store.remove(lockKey);
  const lease = randomUUID();
  if (!await store.put(lockKey, { at: Date.now(), lease })) return false;
  try {
    const token = process.env.CONTACT_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.CONTACT_TELEGRAM_CHAT_ID;
    if (!token || !chatId) throw new Error("notification_unconfigured");
    const response = await send(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ chat_id: chatId, text: notificationText(inquiry), link_preview_options: { is_disabled: true } }),
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true || !Number.isInteger(result.result?.message_id)) throw new Error("notification_not_accepted");
    await store.put(`receipts/${id}.json`, { notifiedAt: new Date().toISOString(), messageId: result.result.message_id, channel: "telegram" } satisfies Receipt, true);
    const receipt = await store.get<Receipt>(`receipts/${id}.json`);
    return receipt?.messageId === result.result.message_id;
  } catch {
    // Full inquiry remains in the private outbox. The scheduled worker retries it.
    console.warn("[inquiry_notification_pending]", id);
    return false;
  } finally {
    const current = await store.get<{ lease: string }>(lockKey).catch(() => null);
    if (current?.lease === lease) await store.remove(lockKey).catch(() => undefined);
  }
}

export async function retryInquiries(store: InquiryStore = inquiryStore()) {
  await store.ensure();
  const deadline = Date.now() + 45000;
  let scanned = 0, delivered = 0, pending = 0;
  for (let offset = 0; offset < 10000; offset += 100) {
    const rows = await store.list("submissions", offset);
    for (const row of rows) {
      if (Date.now() > deadline) return { scanned, delivered, pending, hasMore: true };
      scanned++;
      if (await store.get<Receipt>(`receipts/${row.name}`)) continue;
      const inquiry = await store.get<SavedInquiry>(`submissions/${row.name}`);
      if (!inquiry) throw new Error("outbox_record_missing");
      if (await notifyInquiry(inquiry, store)) delivered++; else pending++;
    }
    if (rows.length < 100) return { scanned, delivered, pending, hasMore: false };
  }
  return { scanned, delivered, pending, hasMore: true };
}

export function contactAdminAuthorized(authorization: string | null) {
  const secret = process.env.CONTACT_ADMIN_SECRET;
  if (!secret || !authorization) return false;
  const a = Buffer.from(authorization), b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
