import { createHash } from "node:crypto";
import { createServiceClient } from "../supabase/server";
export type CollectionKind = "chatgpt" | "ranked_keywords" | "competitors_domain";
export interface CollectionReservation {sessionId:string; kind:CollectionKind; query:string; requestBody:unknown; upperCostMicros:number}
function key(kind:CollectionKind,query:string):string { return createHash("sha256").update(kind === "chatgpt" ? query : kind).digest("hex"); }
export async function reservePublicCollection(input:CollectionReservation):Promise<boolean> {
  if (typeof window !== "undefined" || process.env.PUBLIC_CHATGPT_BUDGET_ENABLED !== "true") return false;
  try {
    const db=createServiceClient(); if (!db) return false;
    const {data,error}=await db.rpc("audit_reserve_public_collection",{
      p_session:input.sessionId,p_kind:input.kind,p_sample_key:key(input.kind,input.query),p_query:input.query,
      p_request:typeof input.requestBody === "string" ? JSON.parse(input.requestBody) : input.requestBody,p_upper_cost:input.upperCostMicros,
    }).abortSignal(AbortSignal.timeout(8000));
    return !error && data === true;
  } catch { return false; }
}
export async function recordPublicCollection(input:Pick<CollectionReservation,"sessionId"|"kind"|"query">,outcome:Record<string,unknown>):Promise<boolean> {
  try {
    const db=createServiceClient();if (!db) return false;
    const {data,error}=await db.rpc("audit_record_public_collection",{
      p_session:input.sessionId,p_kind:input.kind,p_sample_key:key(input.kind,input.query),p_outcome:outcome,
    }).abortSignal(AbortSignal.timeout(8000)); return !error && data === true;
  } catch { return false; }
}
