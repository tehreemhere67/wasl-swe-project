import "server-only";

import { query } from "@/lib/db";

/**
 * Messaging provider abstraction - IR-05 ("The provider shall be replaceable
 * without changing any requirement"), IR-07 (OTP over the same SMS interface)
 * and A-27.
 *
 * When Twilio credentials are present the message is sent through Twilio's
 * HTTPS API. Otherwise, in development, the message is written to the
 * `dev_outbox` table and the server log so the flow can be demonstrated
 * without a paid provider. The rest of the application does not care which
 * path was used.
 */

export type SmsDelivery = "sent" | "dev_outbox" | "failed";

export interface SmsResult {
  status: SmsDelivery;
  provider: "twilio" | "development" | "none";
  error?: string;
}

export function smsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (sid && token && from) {
    try {
      const form = new URLSearchParams({ To: to, From: from, Body: body });
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
      if (!response.ok) {
        const detail = await response.text();
        console.error("[sms:twilio] failed", response.status, detail.slice(0, 300));
        return { status: "failed", provider: "twilio", error: `HTTP ${response.status}` };
      }
      return { status: "sent", provider: "twilio" };
    } catch (error) {
      console.error("[sms:twilio] error", error);
      return { status: "failed", provider: "twilio", error: "network" };
    }
  }

  // Development: keep the message where a developer can read it.
  try {
    await query("INSERT INTO dev_outbox (to_phone, body) VALUES ($1, $2)", [to, body]);
  } catch (error) {
    console.error("[sms:dev] could not record message", error);
  }
  console.log(`[sms:dev] to=${to} body=${body}`);
  return { status: "dev_outbox", provider: "development" };
}

/** Reads the development outbox (development/testing only). */
export async function readDevOutbox(limit = 20): Promise<
  { id: string; to_phone: string; body: string; created_at: string }[]
> {
  const { rows } = await query<{ id: string; to_phone: string; body: string; created_at: string }>(
    "SELECT id, to_phone, body, created_at FROM dev_outbox ORDER BY created_at DESC LIMIT $1",
    [limit],
  );
  return rows;
}
