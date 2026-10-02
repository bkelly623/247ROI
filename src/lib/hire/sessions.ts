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

const globalMemory = globalThis as typeof globalThis & { hireQaMemory?: Map<string, HireSession> };
const memory = globalMemory.hireQaMemory ??= new Map<string, HireSession>();
export const localMemoryAllowed = () => process.env.HIRE_LOCAL_MEMORY === '1' && !process.env.VERCEL;
function requireMemoryMode() {
  if (!localMemoryAllowed()) throw new Error('Saving is temporarily unavailable. Please retry; your draft is still on this device.');
}

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
      .abortSignal(AbortSignal.timeout(5000))
      .single();
    if (error) {
      // Only explicit local QA can use volatile storage; production fails closed.
      console.warn("hire_sessions insert failed:", error.code);
    } else if (data) {
      return mapRow(data);
    }
  }

  requireMemoryMode();
  if (memory.size >= 200) memory.delete(memory.keys().next().value!);
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
      .abortSignal(AbortSignal.timeout(5000))
      .maybeSingle();
    if (error) throw new Error("Saved audit unavailable. Please retry.");
    if (data) return mapRow(data);
  }
  if (!supabase) requireMemoryMode();
  return localMemoryAllowed() ? memory.get(id) ?? null : null;
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
  }>,
  expectedUpdatedAt?: string
): Promise<HireSession | null> {
  const supabase = createServiceClient();
  if (supabase) {
    let query = supabase.from("hire_sessions").update({ ...patch, updated_at: now() }).eq("id", id);
    if (expectedUpdatedAt) query = query.eq('updated_at', expectedUpdatedAt);
    const {data, error} = await query.select('*').abortSignal(AbortSignal.timeout(5000)).maybeSingle();
    if (!error && data) {
      const mapped = mapRow(data);
      // Supabase is authoritative; do not shadow a failed durable write in memory.
      return mapped;
    }
    if (error) {
      console.warn("hire_sessions update failed:", explainSupabaseKeyError(error.message));
      throw new Error("Could not save your answer. Please retry.");
    }
  }

  if (supabase) return null;
  requireMemoryMode();
  const existing = memory.get(id);
  if (existing && expectedUpdatedAt && existing.updated_at !== expectedUpdatedAt) return null;
  if (!existing) return null;
  const next: HireSession = {
    ...existing,
    ...patch,
    updated_at: new Date(Math.max(Date.now(), Date.parse(existing.updated_at) + 1)).toISOString(),
  };
  memory.set(id, next);
  return next;
}

/** Session IDs are unguessable bearer links. Never expose contact fields or rep tokens. */
export function publicHireView(session: HireSession, includeMessages = false) {
  const {id, status, phase, discovery, proposal, updated_at, created_at} = session;
  return {id,status,phase,discovery:{...discovery,notes:discovery.notes.filter(n=>!n.startsWith('turn:'))},proposal,updated_at,created_at,
    messages:includeMessages ? session.messages : []};
}
