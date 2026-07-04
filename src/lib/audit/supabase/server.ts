import { createClient } from "@supabase/supabase-js";

/** Server-side key: legacy JWT service_role OR new sb_secret_... key — NOT the publishable key. */
export function getServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY
  );
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceRoleKey();

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function explainSupabaseKeyError(message: string): string {
  if (/invalid api key/i.test(message)) {
    return [
      "Supabase server key is wrong in Vercel.",
      "SUPABASE_SERVICE_ROLE_KEY must be the secret key (sb_secret_... or service_role JWT),",
      "NOT the same value as NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      "Fix in Vercel → 247ROI → Settings → Environment Variables, then Redeploy.",
    ].join(" ");
  }
  if (/relation.*does not exist/i.test(message)) {
    return "Database tables missing. Run the SQL migration in Supabase SQL Editor, then try again.";
  }
  return message;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
