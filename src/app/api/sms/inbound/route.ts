import { NextRequest, NextResponse } from "next/server";
import { validTwilioSignature } from "@/lib/twilio-signature";
import { getConversationHistory, alreadyNotifiedAbout, sendSms } from "@/lib/twilio";
import { runSmsTurn } from "@/lib/sms-lead/engine";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twiml(message?: string) {
  const body = message
    ? `<Response><Message>${escapeXml(message)}</Message></Response>`
    : "<Response></Response>";
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>${body}`, {
    headers: { "Content-Type": "text/xml" },
  });
}

/**
 * Twilio inbound SMS webhook for the (610) 300-3001 business line.
 * Handles replies to the missed-call text-back message as a real
 * conversational lead-capture flow, not a single canned auto-reply.
 *
 * Conversation state is reconstructed from Twilio's own Messages log
 * (see getConversationHistory) rather than a database — works across
 * stateless serverless invocations with no extra infra.
 */
export async function POST(req: NextRequest) {
  if (!req.headers.get("x-twilio-signature")) return new NextResponse("Forbidden", { status: 403 });
  const form = await req.formData();
  if (!validTwilioSignature(req, form)) return new NextResponse("Forbidden", { status: 403 });
  const from = String(form.get("From") || "");
  const to = String(form.get("To") || "");
  const bodyText = String(form.get("Body") || "").trim();

  if (!from || !to || !bodyText) {
    return twiml();
  }

  // Never let the AI engage with opt-out/help keywords — Twilio's own
  // STOP/HELP handling (advertised in every message) already covers these
  // before this webhook even fires in most cases, but guard anyway.
  const upper = bodyText.toUpperCase();
  if (["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "HELP", "INFO"].includes(upper)) {
    return twiml();
  }

  const history = await getConversationHistory(from, to, 20);
  // The current inbound message may or may not have landed in Twilio's log
  // yet depending on webhook timing — append it explicitly if it's missing.
  const last = history[history.length - 1];
  if (!last || last.role !== "user" || last.content !== bodyText) {
    history.push({ role: "user", content: bodyText, at: new Date().toISOString() });
  }

  const turn = await runSmsTurn(history.map((m) => ({ role: m.role, content: m.content })));

  const alertNumber = process.env.FORWARD_PHONE_NUMBER;
  if (turn.leadReady && alertNumber) {
    const already = await alreadyNotifiedAbout(from, to, alertNumber);
    if (!already) {
      const alertText = [
        turn.urgent ? "URGENT LEAD" : "New lead",
        turn.summary || "Details in thread",
        `From ${from}`,
      ].join(" — ");
      const sent = await sendSms(alertNumber, alertText);
      if (!sent.ok) {
        console.error("[sms-lead] failed to alert Brendan", { from, error: sent.error });
      }
    }
  }

  return twiml(turn.reply);
}
