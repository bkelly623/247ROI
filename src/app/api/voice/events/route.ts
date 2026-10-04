import { NextRequest } from "next/server";
import { voiceWebhook } from "@/lib/voice-webhook";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: NextRequest) { return voiceWebhook(req, "child"); }
