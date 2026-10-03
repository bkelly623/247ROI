import { NextResponse } from "next/server";
// Legacy intake collected no way to contact the sender and could falsely report success.
// The public route now redirects to the validated, durable contact form.
export async function POST() { return NextResponse.json({ ok: false, error: "Please use the contact form at /contact so we can save your message and reply.", contactUrl: "/contact?source=intake" }, { status: 410 }); }
