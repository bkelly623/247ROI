import { NextResponse } from "next/server";

const PRIMARY_DISPLAY = "(917) 572-7734";
const PRIMARY_TEL = "tel:+19175727734";
const DEMO_DISPLAY = "(866) 360-2529";
const DEMO_TEL = "tel:+18663602529";

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
      reply: `Chat is not configured right now. Call or text ${PRIMARY_DISPLAY} (${PRIMARY_TEL}) with the workflow you want to improve. The live receptionist demo is ${DEMO_DISPLAY} (${DEMO_TEL}).`,
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

  const system = `You are 247ROI's website assistant. Tone: confident, simple, practical, premium. Avoid hype and corporate buzzwords.

Positioning: 247ROI builds managed AI employees for SMB service businesses. Common roles include AI receptionist, follow-up agent, estimator assistant, bid assistant, inbox/SMS response assistant, and operations coordinator.

Promise: AI-assisted workflow acceleration, not fake full autonomy. Explain that AI can usually handle the repeatable 70-80% of a well-scoped workflow and save major time, while humans keep approval on pricing, bids, exceptions, and sensitive decisions.

Best next step: ask what workflow is slow or leaking revenue, then direct qualified visitors to call/text the primary business line or email contact@247roi.com for a workflow map.

Phone numbers (never mix these up):
- Primary business (call/text): ${PRIMARY_DISPLAY} → ${PRIMARY_TEL}
- Live demo ONLY: ${DEMO_DISPLAY} → ${DEMO_TEL}

Prefer the primary business line first. Offer the demo number only when they specifically want to hear the AI receptionist demo.

Never mention any other phone numbers. Do not mention GoHighLevel, Automagixx, deleted calendars, internal tools, or website implementation details.`;

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
        reply: `Something went wrong. Call or text ${PRIMARY_DISPLAY} with the workflow you want to improve. The receptionist demo line is ${DEMO_DISPLAY}.`,
      });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({
      reply: reply || `Call or text ${PRIMARY_DISPLAY} with the workflow you want to improve. The receptionist demo line is ${DEMO_DISPLAY}.`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({
      reply: `I could not respond just now. Call or text ${PRIMARY_DISPLAY} with the workflow you want to improve. The receptionist demo line is ${DEMO_DISPLAY}.`,
    });
  }
}
