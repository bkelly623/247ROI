import { runSalesTurn } from "./sales-engine";
import type { DiscoveryState, HireMessage } from "./types";
import type { ChatTurn } from "./schema";

/**
 * Discovery is owned by the sales engine.
 * LLM "creative" replies were wiping state and looping — do not let them drive.
 */
export async function runHireChatTurn(input: {
  messages: HireMessage[];
  discovery: DiscoveryState;
}): Promise<ChatTurn> {
  return runSalesTurn(input.discovery, input.messages);
}
