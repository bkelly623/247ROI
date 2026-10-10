import { NextRequest } from "next/server";
import { receiveReceptionistTransfer } from "@/lib/voice-transfer";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: NextRequest) { return receiveReceptionistTransfer(req); }
