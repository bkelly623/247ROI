import { runSalesTurn } from "./sales-engine";
import { mergeDiscovery, proposalFallback } from "./prompt";
import { chatTurnSchema, type ChatTurn } from "./schema";
import type { DiscoveryState, HireMessage } from "./types";

/**
 * Engine owns structure AND wording.
 * Free-form LLM replies were soft, long, and off-script — do not let them drive.
 */
export async function runHireChatTurn(input: {
  messages: HireMessage[];
  discovery: DiscoveryState;
}): Promise<ChatTurn> {
  const turn = runSalesTurn(input.discovery, input.messages);
  return { ...turn, choices: null, inputMode: "text" };
}

export function parseModelTurn(
  raw: unknown,
  prior: DiscoveryState
): ChatTurn | null {
  const obj =
    raw && typeof raw === "object"
      ? ({ ...(raw as object) } as Record<string, unknown>)
      : null;
  if (!obj || typeof obj.reply !== "string") return null;
  if (obj.readyForGate == null) obj.readyForGate = false;
  if (obj.proposal === undefined) obj.proposal = null;
  if (obj.teaserLine === undefined) obj.teaserLine = null;
  if (obj.phase == null) obj.phase = "warming";
  if (obj.discovery == null) obj.discovery = prior;
  const parsed = chatTurnSchema.safeParse(obj);
  if (!parsed.success) return null;
  const turn = parsed.data;
  const discovery = mergeDiscovery(prior, turn.discovery as DiscoveryState);
  let proposal = turn.proposal ?? null;
  if (turn.readyForGate && !proposal && discovery.pains.length) {
    proposal = proposalFallback(discovery);
  }
  return {
    reply: turn.reply,
    phase: turn.phase,
    discovery,
    proposal,
    readyForGate: turn.readyForGate ?? false,
    teaserLine:
      turn.teaserLine ??
      (proposal
        ? `${proposal.employeeName} · ${proposal.hoursSavedPerWeek.low}–${proposal.hoursSavedPerWeek.high} hrs/week`
        : null),
    choices: null,
    inputMode: "text",
  };
}
