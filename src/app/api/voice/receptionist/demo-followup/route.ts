import { NextRequest } from "next/server";
import { receiveDemoFollowupRequest } from "@/lib/demo-followup-delivery";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: NextRequest) { return receiveDemoFollowupRequest(req); }
