/**
 * Persist hire audit sessions. Prefer Supabase; memory is a last-resort
 * same-instance fallback (not reliable across Vercel serverless invocations).
 */
import { randomUUID } from "crypto";
import { createServiceClient, explainSupabaseKeyError } from "@/lib/audit/supabase/server";
import {
  emptyDiscovery,
  type DiscoveryState,
  type HireMessage,
  type HirePhase,
  type HireProposal,
  type HireSession,
  type HireSessionStatus,
} from "./types";

const memory = new Map<string, HireSession>();

function now() {
  return new Date().toISOString();
}

function mapRow(row: Record<string, unknown>): HireSession {
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at ?? row.created_at),
    status: row.status as HireSessionStatus,
    phase: (row.phase as HirePhase) ?? "warming",
    messages: (row.messages as HireMessage[]) ?? [],
    discovery: (row.discovery as DiscoveryState) ?? emptyDiscovery(),
    proposal: (row.proposal as HireProposal) ?? null,
    first_name: (row.first_name as string) ?? null,
    last_name: (row.last_name as string) ?? null,
    phone: (row.phone as string) ?? null,
    email: (row.email as string) ?? null,
    gate_shown_at: (row.gate_shown_at as string) ?? null,
    gate_submitted_at: (row.gate_submitted_at as string) ?? null,
    unlocked_at: (row.unlocked_at as string) ?? null,
    source: (row.source as string) ?? null,
    rep_token: (row.rep_token as string) ?? null,
  };
}

export async function createHireSession(input?: {
  source?: string;
  repToken?: string;
}): Promise<HireSession> {
  const supabase = createServiceClient();
  const row = {
    status: "chatting" as HireSessionStatus,
    phase: "warming" as HirePhase,
    messages: [] as HireMessage[],
    discovery: emptyDiscovery(),
    proposal: null,
    source: input?.source ?? "organic",
    rep_token: input?.repToken ?? null,
  };

  if (supabase) {
    const { data, error } = await supabase
      .from("hire_sessions")
      .insert(row)
      .select("*")
      .single();
    if (error) {
      // Table may not exist yet — fall back to memory so local/demo still works.
      console.warn("hire_sessions insert failed, using memory:", error.message);
    } else if (data) {
      return mapRow(data);
    }
  }

  const session: HireSession = {
    id: randomUUID(),
    created_at: now(),
    updated_at: now(),
    status: "chatting",
    phase: "warming",
    messages: [],
    discovery: emptyDiscovery(),
    proposal: null,
    first_name: null,
    last_name: null,
    phone: null,
    email: null,
    gate_shown_at: null,
    gate_submitted_at: null,
    unlocked_at: null,
    source: input?.source ?? "organic",
    rep_token: input?.repToken ?? null,
  };
  memory.set(session.id, session);
  return session;
}

export async function getHireSession(id: string): Promise<HireSession | null> {
  const supabase = createServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("hire_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) return mapRow(data);
  }
  return memory.get(id) ?? null;
}

export async function updateHireSession(
  id: string,
  patch: Partial<{
    status: HireSessionStatus;
    phase: HirePhase;
    messages: HireMessage[];
    discovery: DiscoveryState;
    proposal: HireProposal | null;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    gate_shown_at: string;
    gate_submitted_at: string;
    unlocked_at: string;
  }>
): Promise<HireSession | null> {
  const supabase = createServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("hire_sessions")
      .update({ ...patch, updated_at: now() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (!error && data) {
      const mapped = mapRow(data);
      memory.set(id, mapped);
      return mapped;
    }
    if (error) {
      console.warn("hire_sessions update failed:", explainSupabaseKeyError(error.message));
    }
  }

  const existing = memory.get(id);
  if (!existing) return null;
  const next: HireSession = {
    ...existing,
    ...patch,
    updated_at: now(),
  };
  memory.set(id, next);
  return next;
}

/** Public-safe session for unlocked reports; strips nothing critical but hides if locked. */
export function publicHireView(session: HireSession, unlocked: boolean) {
  if (unlocked || session.status === "unlocked") {
    return session;
  }

  return {
    id: session.id,
    status: session.status,
    phase: session.phase,
    discovery: {
      businessName: session.discovery.businessName,
      businessType: session.discovery.businessType,
      pains: session.discovery.pains.map((p) => ({
        title: p.title,
        time: {
          computedHoursPerWeek: p.time.computedHoursPerWeek,
          statedHoursPerWeek: p.time.statedHoursPerWeek,
        },
      })),
    },
    proposal: session.proposal
      ? {
          employeeName: session.proposal.employeeName,
          roleTitle: session.proposal.roleTitle,
          tagline: session.proposal.tagline,
          hoursSavedPerWeek: session.proposal.hoursSavedPerWeek,
          teaserOnly: true,
        }
      : null,
    gated: true,
  };
}
