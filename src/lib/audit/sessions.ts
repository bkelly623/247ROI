import { createServiceClient, explainSupabaseKeyError } from "./supabase/server";
import type { AuditReport, ScanSession, SessionStatus, WarmTier } from "./types";
import { randomUUID } from "crypto";

const memorySessions = new Map<string, ScanSession>();

export async function createSession(input: {
  businessName: string;
  websiteUrl: string;
  zipCode: string;
  mode: "organic" | "rep";
  repToken?: string;
}): Promise<ScanSession> {
  const supabase = createServiceClient();
  const row = {
    business_name: input.businessName,
    website_url: input.websiteUrl,
    zip_code: input.zipCode,
    mode: input.mode,
    status: "started" as SessionStatus,
    rep_token: input.repToken ?? null,
    warm_tier: "cold" as WarmTier,
  };

  if (supabase) {
    const { data, error } = await supabase
      .from("scan_sessions")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(explainSupabaseKeyError(error.message));
    return mapRow(data);
  }

  const session: ScanSession = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    business_name: input.businessName,
    website_url: input.websiteUrl,
    zip_code: input.zipCode,
    mode: input.mode,
    status: "started",
    warm_tier: "cold",
    report: null,
  };
  memorySessions.set(session.id, session);
  return session;
}

export async function getSession(id: string): Promise<ScanSession | null> {
  const supabase = createServiceClient();
  if (supabase) {
    const { data } = await supabase
      .from("scan_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? mapRow(data) : null;
  }
  return memorySessions.get(id) ?? null;
}

export async function updateSession(
  id: string,
  patch: Partial<{
    status: SessionStatus;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    report: AuditReport;
    progress_events: string[];
    warm_tier: WarmTier;
    gate_shown_at: string;
    gate_submitted_at: string;
    report_viewed_at: string;
    cta_clicked_at: string;
    athena_job_id: string;
  }>
): Promise<ScanSession | null> {
  const supabase = createServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("scan_sessions")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(explainSupabaseKeyError(error.message));
    return mapRow(data);
  }

  const existing = memorySessions.get(id);
  if (!existing) return null;
  const updated: ScanSession = {
    ...existing,
    ...("first_name" in patch ? { first_name: patch.first_name } : {}),
    ...("last_name" in patch ? { last_name: patch.last_name } : {}),
    ...("phone" in patch ? { phone: patch.phone } : {}),
    ...("email" in patch ? { email: patch.email } : {}),
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.report ? { report: patch.report } : {}),
    ...(patch.warm_tier ? { warm_tier: patch.warm_tier } : {}),
  };
  memorySessions.set(id, updated);
  return updated;
}

export async function checkRateLimit(phone: string): Promise<boolean> {
  const normalized = phone.replace(/\D/g, "");
  const supabase = createServiceClient();
  if (!supabase) return true;

  const { data } = await supabase
    .from("audit_rate_limits")
    .select("*")
    .eq("phone_normalized", normalized)
    .maybeSingle();

  if (!data) return true;

  const daysSince =
    (Date.now() - new Date(data.last_audit_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > 90) return true;
  return data.audit_count < 1;
}

export async function recordRateLimit(phone: string): Promise<void> {
  const normalized = phone.replace(/\D/g, "");
  const supabase = createServiceClient();
  if (!supabase) return;

  await supabase.from("audit_rate_limits").upsert({
    phone_normalized: normalized,
    audit_count: 1,
    last_audit_at: new Date().toISOString(),
  });
}

function mapRow(row: Record<string, unknown>): ScanSession {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    business_name: row.business_name as string,
    website_url: row.website_url as string,
    zip_code: row.zip_code as string,
    mode: row.mode as ScanSession["mode"],
    status: row.status as ScanSession["status"],
    first_name: row.first_name as string | null | undefined,
    last_name: row.last_name as string | null | undefined,
    phone: row.phone as string | null | undefined,
    email: row.email as string | null | undefined,
    warm_tier: row.warm_tier as WarmTier,
    report: row.report as AuditReport | null | undefined,
  };
}

export async function getRepSession(token: string) {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("rep_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  return data;
}
