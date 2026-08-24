import { NextResponse } from "next/server";

const PRIMARY_DISPLAY = "(917) 572-7734";
const PRIMARY_TEL = "tel:+19175727734";

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
      reply: `The fastest next step is simple: start the Business Systems Audit / AI Opportunity Audit at /hire, call or text ${PRIMARY_DISPLAY}, or email contact@247roi.com. Good first message: "I want to improve [workflow]."`,
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

Positioning: 247ROI helps owners and operators find the bottlenecks worth fixing first, then builds practical systems that save time and create ROI. Common builds include custom workflow automations, dashboards that unify scattered data, internal apps, AI agents, estimating or bid support, inbox/admin operations, reporting, and operations coordination.

Promise: cleaner operations and measurable operating lift, not fake full autonomy. Explain that AI and automation can take repetitive work off the team's plate while humans keep approval on pricing, bids, exceptions, and sensitive decisions.

Best next step: ask what workflow is slow, messy, or leaking revenue, then direct qualified visitors to start the Business Systems Audit / AI Opportunity Audit at /hire, call/text the primary business line, or email contact@247roi.com.

Phone number:
- Primary business (call/text): ${PRIMARY_DISPLAY} → ${PRIMARY_TEL}

Prefer the primary business line first.

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
        reply: `Something went wrong. Start the Business Systems Audit / AI Opportunity Audit at /hire, or call/text ${PRIMARY_DISPLAY} with the workflow you want to improve.`,
      });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({
      reply: reply || `Start the Business Systems Audit / AI Opportunity Audit at /hire, or call/text ${PRIMARY_DISPLAY} with the workflow you want to improve.`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({
      reply: `I could not respond just now. Start the Business Systems Audit / AI Opportunity Audit at /hire, or call/text ${PRIMARY_DISPLAY} with the workflow you want to improve.`,
    });
  }
}
