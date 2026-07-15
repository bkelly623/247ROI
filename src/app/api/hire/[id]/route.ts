import { NextRequest, NextResponse } from "next/server";
import { hireGateSchema } from "@/lib/hire/gate";
import { notifyHireUnlock } from "@/lib/hire/notify";
import {
  createHireSession,
  getHireSession,
  updateHireSession,
} from "@/lib/hire/sessions";
import type { DiscoveryState, HireMessage, HireProposal } from "@/lib/hire/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getHireSession(id);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const unlocked = session.status === "unlocked";
  if (unlocked) {
    return NextResponse.json({ session, unlocked: true });
  }

  return NextResponse.json({
    unlocked: false,
    session: {
      id: session.id,
      status: session.status,
      phase: session.phase,
      proposal: session.proposal
        ? {
            employeeName: session.proposal.employeeName,
            roleTitle: session.proposal.roleTitle,
            tagline: session.proposal.tagline,
            hoursSavedPerWeek: session.proposal.hoursSavedPerWeek,
          }
        : null,
      discovery: {
        businessName: session.discovery.businessName,
        businessType: session.discovery.businessType,
      },
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const raw = await req.json();
    const contact = hireGateSchema.parse({
      firstName: raw.firstName,
      lastName: raw.lastName ?? "",
      phone: raw.phone,
      email: raw.email ?? "",
    });

    let session = await getHireSession(id);

    const proposal =
      (raw.proposal as HireProposal | undefined) ?? session?.proposal;
    const discovery =
      (raw.discovery as DiscoveryState | undefined) ?? session?.discovery;
    const messages =
      (raw.messages as HireMessage[] | undefined) ?? session?.messages;

    if (!proposal) {
      return NextResponse.json(
        { error: "Finish the audit conversation first." },
        { status: 400 }
      );
    }

    if (!session) {
      session = await createHireSession({
        source: raw.source ?? "gate_recover",
      });
    }

    const targetId = session.id;
    const nextDiscovery = discovery ?? session.discovery;
    const updated = await updateHireSession(targetId, {
      first_name: contact.firstName,
      last_name: contact.lastName || "",
      phone: contact.phone,
      email: contact.email || "",
      proposal,
      discovery: nextDiscovery,
      messages: messages ?? session.messages,
      gate_submitted_at: new Date().toISOString(),
      unlocked_at: new Date().toISOString(),
      status: "unlocked",
      phase: "unlocked",
    });

    void notifyHireUnlock({
      sessionId: targetId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      email: contact.email,
      discovery: nextDiscovery,
      proposal,
    });

    if (targetId !== id && updated) {
      return NextResponse.json({
        sessionId: targetId,
        unlocked: true,
        session: updated,
        redirected: true,
      });
    }

    return NextResponse.json({
      sessionId: targetId,
      unlocked: true,
      session: updated,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Gate failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
