import { NextResponse } from "next/server";
import { runHireChatTurn } from "@/lib/hire/openai";
import {
  createHireSession,
  getHireSession,
  updateHireSession,
} from "@/lib/hire/sessions";
import { emptyDiscovery, type DiscoveryState, type HireMessage } from "@/lib/hire/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      sessionId?: string;
      message?: string;
      messages?: HireMessage[];
      discovery?: DiscoveryState;
    };

    if (!body.message?.trim()) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    let sessionId = body.sessionId;
    let session = sessionId ? await getHireSession(sessionId) : null;

    if (!session) {
      session = await createHireSession({ source: "hire_chat" });
      sessionId = session.id;
      if (body.messages?.length) {
        session.messages = body.messages;
      }
      if (body.discovery) {
        session.discovery = body.discovery;
      }
    }

    if (session.status === "unlocked") {
      return NextResponse.json(
        { error: "Audit already unlocked — view your hire plan.", sessionId },
        { status: 400 }
      );
    }

    // Prefer server history; fall back to client transcript (serverless-safe).
    const prior: HireMessage[] =
      session.messages.length > 0
        ? session.messages
        : Array.isArray(body.messages)
          ? body.messages
          : [];
    // Prefer server discovery whenever we already have progress — including
    // salesStage/notes (e.g. "not at a desk") before any pain is named.
    const serverHasProgress = Boolean(
      session.discovery?.pains?.length ||
        session.discovery?.businessType ||
        session.discovery?.salesStage ||
        session.discovery?.notes?.length ||
        session.discovery?.role
    );
    const discovery: DiscoveryState = serverHasProgress
      ? session.discovery
      : body.discovery ?? emptyDiscovery();

    const userMessage: HireMessage = {
      role: "user",
      content: body.message.trim(),
    };
    const messages = [...prior, userMessage];

    const turn = await runHireChatTurn({
      messages,
      discovery,
    });

    const assistantMessage: HireMessage = {
      role: "assistant",
      content: turn.reply,
    };

    const nextMessages = [...messages, assistantMessage];
    const nextStatus = turn.readyForGate ? "gate_ready" : "chatting";

    const updated = await updateHireSession(sessionId!, {
      messages: nextMessages,
      discovery: turn.discovery,
      proposal: turn.proposal,
      phase: turn.phase,
      status: nextStatus,
      ...(turn.readyForGate
        ? { gate_shown_at: new Date().toISOString() }
        : {}),
    });

    return NextResponse.json({
      reply: turn.reply,
      phase: turn.phase,
      discovery: turn.discovery,
      proposal: turn.readyForGate ? turn.proposal : null,
      readyForGate: turn.readyForGate,
      teaserLine: turn.teaserLine,
      sessionId,
      status: updated?.status ?? nextStatus,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Chat failed" },
      { status: 500 }
    );
  }
}
