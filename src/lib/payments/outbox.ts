import type { PaymentLedger } from "@/lib/payments/ledger";

export function notificationConfigured(env: NodeJS.ProcessEnv): boolean {
  if (env.PAYMENT_NOTIFY_WEBHOOK_URL?.trim()) return true;
  return Boolean(env.CONTACT_TELEGRAM_BOT_TOKEN?.trim() && env.CONTACT_TELEGRAM_CHAT_ID?.trim());
}

export async function drainPaymentNotifications(input: {
  ledger: PaymentLedger;
  env?: NodeJS.ProcessEnv;
  send?: typeof fetch;
  worker?: string;
}) {
  const env = input.env ?? process.env;
  if (!notificationConfigured(env)) return { configured: false, claimed: 0, sent: 0, failed: 0 };
  const worker = input.worker ?? `ops-${Date.now()}`;
  const claimed = await input.ledger.claimNotifications(worker, 5, 30);
  let sent = 0;
  let failed = 0;
  const send = input.send ?? fetch;
  for (const row of claimed) {
    try {
      const url = env.PAYMENT_NOTIFY_WEBHOOK_URL?.trim();
      const response = url
        ? await send(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dedupeKey: row.dedupeKey, kind: row.kind, mode: row.mode }), signal: AbortSignal.timeout(4000) })
        : await send(`https://api.telegram.org/bot${env.CONTACT_TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id: env.CONTACT_TELEGRAM_CHAT_ID, text: `247ROI payment notice ${row.dedupeKey}` }),
          signal: AbortSignal.timeout(4000),
        });
      if (!response.ok) throw new Error("notification_not_accepted");
      await input.ledger.markOutboxSent(row.dedupeKey, new Date().toISOString(), row.claimToken ?? "");
      sent += 1;
    } catch (error) {
      await input.ledger.markOutboxFailed(row.dedupeKey, error instanceof Error ? error.message : "notification_failed", row.claimToken ?? "");
      failed += 1;
    }
  }
  return { configured: true, claimed: claimed.length, sent, failed };
}
