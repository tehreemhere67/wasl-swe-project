import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { query } from "@/lib/db";
import { hashPassword, verifyPassword } from "./password";

/**
 * One-time passcodes - FR-DON-01 / IR-07 / A-06.
 *
 * A six digit code is generated, hashed with the same slow hash used for
 * passwords, and stored with an expiry. The plain code is returned to the
 * caller only so that it can be handed to the messaging layer; it is never
 * stored or logged in production.
 */

export type OtpPurpose = "donor_signup" | "password_reset";

export interface IssuedOtp {
  code: string;
  expiresAt: Date;
  resendAfterSeconds: number;
}

function ttlSeconds(): number {
  return Number(process.env.OTP_TTL_SECONDS || 300);
}

function resendSeconds(): number {
  return Number(process.env.OTP_RESEND_SECONDS || 60);
}

function maxAttempts(): number {
  return Number(process.env.OTP_MAX_ATTEMPTS || 5);
}

export class OtpCooldownError extends Error {
  secondsRemaining: number;
  constructor(secondsRemaining: number) {
    super("otp_cooldown");
    this.secondsRemaining = secondsRemaining;
  }
}

export class OtpInvalidError extends Error {
  reason: "expired" | "wrong" | "not_found" | "too_many_attempts";
  constructor(reason: OtpInvalidError["reason"]) {
    super(reason);
    this.reason = reason;
  }
}

function hashCode(phone: string, code: string): string {
  // Bind the code to the phone number so a code is useless for another number.
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

export async function issueOtp(phone: string, purpose: OtpPurpose): Promise<IssuedOtp> {
  const resend = resendSeconds();
  const latest = await query<{ created_at: string }>(
    `SELECT created_at FROM otp_codes
      WHERE phone = $1 AND purpose = $2
      ORDER BY created_at DESC LIMIT 1`,
    [phone, purpose],
  );
  if (latest.rows.length > 0) {
    const ageMs = Date.now() - new Date(latest.rows[0].created_at).getTime();
    if (ageMs < resend * 1000) {
      throw new OtpCooldownError(Math.ceil((resend * 1000 - ageMs) / 1000));
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = await hashPassword(hashCode(phone, code));
  const expiresAt = new Date(Date.now() + ttlSeconds() * 1000);

  await query(
    `INSERT INTO otp_codes (phone, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [phone, purpose, codeHash, expiresAt.toISOString()],
  );

  return { code, expiresAt, resendAfterSeconds: resend };
}

/**
 * Verifies a code for a phone number. Marks the newest unconsumed matching
 * code as consumed on success; counts failed attempts otherwise.
 */
export async function verifyOtp(phone: string, purpose: OtpPurpose, code: string): Promise<void> {
  const { rows } = await query<{
    id: string;
    code_hash: string;
    attempts: number;
    expires_at: string;
  }>(
    `SELECT id, code_hash, attempts, expires_at
       FROM otp_codes
      WHERE phone = $1 AND purpose = $2 AND consumed_at IS NULL
      ORDER BY created_at DESC LIMIT 1`,
    [phone, purpose],
  );

  if (rows.length === 0) throw new OtpInvalidError("not_found");
  const row = rows[0];

  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new OtpInvalidError("expired");
  }
  if (row.attempts >= maxAttempts()) {
    throw new OtpInvalidError("too_many_attempts");
  }

  const matches = await verifyPassword(hashCode(phone, code), row.code_hash);
  if (!matches) {
    await query("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1", [row.id]);
    throw new OtpInvalidError("wrong");
  }

  await query("UPDATE otp_codes SET consumed_at = now() WHERE id = $1", [row.id]);
}

/** Returns true when the phone has a recently consumed signup code. */
export async function hasConsumedSignupCode(phone: string, withinMinutes = 15): Promise<boolean> {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM otp_codes
      WHERE phone = $1 AND purpose = 'donor_signup' AND consumed_at IS NOT NULL
        AND consumed_at > now() - ($2 || ' minutes')::interval
      ORDER BY consumed_at DESC LIMIT 1`,
    [phone, String(withinMinutes)],
  );
  return rows.length > 0;
}

/** Timing-safe helper used by tests. */
export function otpEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
