import { NextResponse } from "next/server";

const PRIMARY_DISPLAY = "(917) 572-7734";
const PRIMARY_TEL = "tel:+19175727734";
const DEMO_DISPLAY = "(484) 673-7612";
const DEMO_TEL = "tel:+14846737612";

function resolveOpenAIKey(): string | undefined {
  return (
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_KEY ||
    process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY
  );
}

export async function POST(req: Request) {
  const key = resolveOpenAIKey();
  if (!key) {
    return NextResponse.json({
      reply: `Chat isn’t configured right now. Call or text ${PRIMARY_DISPLAY} (${PRIMARY_TEL}) — or try the live demo at ${DEMO_DISPLAY} (${DEMO_TEL}).`,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ reply: "Invalid request." }, { status: 400 });
  }

  const messages = (body as { messages?: { role: string; content: string }[] }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ reply: "No message provided." }, { status: 400 });
  }

  const system = `You are 247ROI’s website assistant. Tone: confident, simple, premium — never corporate-buzzwordy.

Positioning: 247ROI installs systems that capture inbound opportunities (calls, texts, messages) and turn them into measurable revenue — 24/7, including while the owner sleeps. Emphasize ROI, revenue capture, and always-on response. Do NOT say “AI agency” or “cutting-edge technology.” Do NOT use “magic” as a theme.

Phone numbers (never mix these up):
- Primary business (call/text): ${PRIMARY_DISPLAY} → ${PRIMARY_TEL}
- Live demo ONLY: ${DEMO_DISPLAY} → ${DEMO_TEL}

Prefer directing visitors to call/text primary first; offer the demo number when they want to hear the system.

Never mention any other phone numbers.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: system }, ...messages],
        temperature: 0.6,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI error", res.status, err);
      return NextResponse.json({
        reply: `Something went wrong. Call or text ${PRIMARY_DISPLAY} — or try the demo at ${DEMO_DISPLAY}.`,
      });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({
      reply: reply || `Call or text ${PRIMARY_DISPLAY} — or try the demo at ${DEMO_DISPLAY}.`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({
      reply: `I couldn’t respond just now. Call or text ${PRIMARY_DISPLAY} — demo line ${DEMO_DISPLAY}.`,
    });
  }
}
