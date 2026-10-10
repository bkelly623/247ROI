import { NextRequest } from "next/server";
import { inboundVoice } from "@/lib/voice-inbound";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return inboundVoice(req);
}
