import { NextRequest } from "next/server";
import { receiveReceptionistAction } from "@/lib/voice-intake";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: NextRequest) { return receiveReceptionistAction(req); }
