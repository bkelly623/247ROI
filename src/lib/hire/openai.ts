import { buildSystemPrompt, mergeDiscovery } from './prompt';
import { chatTurnSchema, type ChatTurn } from './schema';
import { guidedTurn, runSalesTurn } from './sales-engine';
import { applyUserControls } from './discovery-policy';
import { modelTurnFormat } from './model-format';
import type { DiscoveryState, HireMessage } from './types';

export function parseModelTurn(raw: unknown, prior: DiscoveryState): ChatTurn | null {
  const parsed = chatTurnSchema.safeParse(raw);
  // Do not display prose that failed to save its corresponding facts.
  if (!parsed.success || !parsed.data.discovery) return null;
  const discovery = mergeDiscovery(prior, parsed.data.discovery);
  // Request receipts are server-owned. A model cannot create or delete them.
  discovery.notes = [...new Set([...discovery.notes.filter(n=>!n.startsWith('turn:')), ...prior.notes.filter(n=>n.startsWith('turn:'))])];
  const turn = guidedTurn(discovery);
  const text = parsed.data.reply.trim();
  const concise = text.split(/\s+/).length <= 65 && text.length <= 500;
  return {
    ...turn,
    reply: turn.phase !== 'ready' && parsed.data.phase === turn.phase && concise ? text : turn.reply,
    choices: parsed.data.choices?.length && turn.phase !== 'ready' ? parsed.data.choices.slice(0,4) : turn.choices,
  };
}
export async function runHireChatTurn(input: { messages: HireMessage[]; discovery: DiscoveryState }): Promise<ChatTurn & { mode: 'ai' | 'guided' }> {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (key) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST', headers:{'content-type':'application/json',authorization:`Bearer ${key}`},
        signal:AbortSignal.timeout(14000),
        body:JSON.stringify({ model:process.env.OPENAI_HIRE_MODEL || 'gpt-4o-mini', temperature:.35, max_tokens:1700, response_format:modelTurnFormat, messages:[{role:'system',content:buildSystemPrompt(input.discovery)},...input.messages.slice(-16)] }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (typeof text==='string') {
          const raw=JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g,''));
          const turn=parseModelTurn(raw,input.discovery);
          if (turn) {
            const d=applyUserControls(input.discovery,turn.discovery!,input.messages.filter(m=>m.role==='user').at(-1)?.content||'');
            const controlled=guidedTurn(d);
            return {...controlled,reply:controlled.phase===turn.phase?turn.reply:controlled.reply,mode:'ai'};
          }
        }
      } else { console.warn('hire model unavailable',res.status); }
    } catch { console.warn('hire model unavailable or invalid; using guided recovery'); }
  }
  return {...runSalesTurn(input.discovery,input.messages),mode:'guided'};
}
