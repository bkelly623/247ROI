import { NextRequest } from "next/server";
import { receiveReceptionistCallback } from "@/lib/voice-receptionist";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: NextRequest) { return receiveReceptionistCallback(req, "sip"); }
