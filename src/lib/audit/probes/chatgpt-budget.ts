import { createServiceClient } from "../supabase/server";

export interface PublicChatGPTReservation {
  sessionId: string;
  query: string;
  requestBody: unknown;
  upperCostMicros: number;
}
export interface PublicChatGPTOutcome {
  status: "observed" | "unmeasured" | "error" | "blocked";
  [key: string]: unknown;
}

/** Server-only paid-send boundary. Never retry a false/failed/uncertain RPC.
 * Requires PUBLIC_CHATGPT_BUDGET_ENABLED=true plus a native service-role client.
 * SQL owns the permanent per-session exclusion and cumulative $0.088 ceiling.
 */
export async function reservePublicChatGPT(input: PublicChatGPTReservation): Promise<boolean> {
  if (typeof window !== "undefined" || process.env.PUBLIC_CHATGPT_BUDGET_ENABLED !== "true" ||
      input.upperCostMicros !== 4000 ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.sessionId) ||
      !input.query.trim()) return false;
  try {
    const db = createServiceClient();
    if (!db) return false;
    const { data, error } = await db.rpc("audit_reserve_public_chatgpt", {
      p_session: input.sessionId, p_query: input.query,
      p_request: typeof input.requestBody === "string" ? JSON.parse(input.requestBody) : input.requestBody,
      p_upper_cost: input.upperCostMicros,
    }).abortSignal(AbortSignal.timeout(8000));
    return !error && data === true;
  } catch { return false; }
}

/** Integration contract: after a TRUE reservation, call once in finally with the
 * sanitized probe result (no credentials/headers). Await and inspect the boolean.
 * Failed persistence leaves a durable partial/uncertain job, never frees budget.
 * A received response is not proof of billing reconciliation. Legacy report
 * persistence stays with the existing pipeline; this is only operational evidence.
 */
export async function recordPublicChatGPTOutcome(sessionId: string, outcome: PublicChatGPTOutcome): Promise<boolean> {
  if (typeof window !== "undefined") return false;
  try {
    const db = createServiceClient();
    if (!db) return false;
    const { data, error } = await db.rpc("audit_record_public_chatgpt", {
      p_session: sessionId, p_outcome: outcome,
    }).abortSignal(AbortSignal.timeout(8000));
    return !error && data === true;
  } catch { return false; }
}
