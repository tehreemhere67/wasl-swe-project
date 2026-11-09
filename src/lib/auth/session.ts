import "server-only";

import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { query, transaction } from "@/lib/db";
import type { Language, Role, VerificationStatus } from "@/lib/validation";
import { randomToken } from "./password";

/**
 * Sessions - FR-ADM-01 (login required, role-scoped access) and
 * NFR-SEC-02 (a session ends after 30 minutes without activity).
 *
 * The browser holds an opaque random token in an httpOnly cookie. The database
 * stores only its SHA-256 hash, so a leaked database dump cannot be replayed.
 */

export const SESSION_COOKIE = "wasl_session";

const DEFAULT_IDLE_MINUTES = Number(process.env.SESSION_IDLE_MINUTES || 30);

export interface SessionOrganization {
  id: string;
  type: "hospital" | "blood_bank" | "donation_org";
  name: string;
  area: string | null;
  verificationStatus: VerificationStatus;
  statusReason: string | null;
}

export interface SessionUser {
  id: string;
  role: Role;
  email: string | null;
  phone: string | null;
  fullName: string;
  preferredLanguage: Language;
  organization: SessionOrganization | null;
}

export interface SessionContext {
  user: SessionUser;
  sessionId: string;
  idleExpiresAt: Date;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function idleMinutes(): number {
  return Number.isFinite(DEFAULT_IDLE_MINUTES) && DEFAULT_IDLE_MINUTES > 0
    ? DEFAULT_IDLE_MINUTES
    : 30;
}

/** Reads the client address and user agent for audit records. */
export async function requestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]!.trim() : store.get("x-real-ip");
  return { ip: ip || null, userAgent: store.get("user-agent") };
}

type SessionRow = {
  session_id: string;
  last_seen_at: string;
  expires_at: string;
  user_id: string;
  role: Role;
  email: string | null;
  phone: string | null;
  full_name: string;
  status: string;
  preferred_language: Language;
  organization_id: string | null;
  organization_type: SessionOrganization["type"] | null;
  organization_name: string | null;
  organization_area: string | null;
  verification_status: VerificationStatus | null;
  status_reason: string | null;
};

/**
 * Resolves the current session, or null. Sliding expiry: an activity extends
 * the session by another idle window (at most once a minute to avoid a write
 * on every request).
 */
export async function getSession(): Promise<SessionContext | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { rows } = await query<SessionRow>(
    `SELECT s.id AS session_id, s.last_seen_at, s.expires_at,
            u.id AS user_id, u.role, u.email, u.phone, u.full_name, u.status,
            u.preferred_language,
            o.id AS organization_id, o.type AS organization_type,
            o.name AS organization_name, o.area AS organization_area,
            o.verification_status, o.status_reason
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN organizations o ON o.id = u.organization_id
      WHERE s.token_hash = $1
      LIMIT 1`,
    [hashToken(token)],
  );

  if (rows.length === 0) return null;
  const row = rows[0];

  if (row.status !== "active") return null;

  const now = Date.now();
  const expiresAt = new Date(row.expires_at).getTime();
  if (expiresAt <= now) {
    await query("DELETE FROM sessions WHERE id = $1", [row.session_id]);
    return null;
  }

  const idleMs = idleMinutes() * 60 * 1000;
  const lastSeen = new Date(row.last_seen_at).getTime();
  const nextExpiry = new Date(now + idleMs);
  if (now - lastSeen > 60_000) {
    await query(
      "UPDATE sessions SET last_seen_at = now(), expires_at = $2 WHERE id = $1",
      [row.session_id, nextExpiry.toISOString()],
    );
  }

  return {
    sessionId: row.session_id,
    idleExpiresAt: nextExpiry,
    user: {
      id: row.user_id,
      role: row.role,
      email: row.email,
      phone: row.phone,
      fullName: row.full_name,
      preferredLanguage: row.preferred_language,
      organization: row.organization_id
        ? {
            id: row.organization_id,
            type: row.organization_type as SessionOrganization["type"],
            name: row.organization_name ?? "",
            area: row.organization_area,
            verificationStatus: (row.verification_status ?? "pending") as VerificationStatus,
            statusReason: row.status_reason,
          }
        : null,
    },
  };
}

export async function createSession(
  userId: string,
  meta: { ip?: string | null; userAgent?: string | null } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken(32);
  const idleMs = idleMinutes() * 60 * 1000;
  const expiresAt = new Date(Date.now() + idleMs);

  await query(
    `INSERT INTO sessions (user_id, token_hash, last_seen_at, expires_at, ip_address, user_agent)
     VALUES ($1, $2, now(), $3, $4, $5)`,
    [userId, hashToken(token), expiresAt.toISOString(), meta.ip ?? null, meta.userAgent ?? null],
  );

  // Opportunistic cleanup so the table cannot grow without bound.
  await query("DELETE FROM sessions WHERE expires_at < now() - interval '1 day'");

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // The database enforces the 30 minute idle rule; the cookie may outlive it.
    maxAge: 60 * 60 * 12,
  });

  return { token, expiresAt };
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
  }
  store.delete(SESSION_COOKIE);
}

/** Invalidates every other session for a user (used after a password reset). */
export async function destroyAllSessionsForUser(userId: string): Promise<void> {
  await query("DELETE FROM sessions WHERE user_id = $1", [userId]);
}

/** Updates the language preference both on the account and on the donor profile. */
export async function savePreferredLanguage(userId: string, language: Language): Promise<void> {
  await transaction(async (tx) => {
    await tx.query("UPDATE users SET preferred_language = $2, updated_at = now() WHERE id = $1", [
      userId,
      language,
    ]);
    await tx.query(
      `UPDATE donors SET preferred_language = $2, updated_at = now()
        WHERE user_id = $1`,
      [userId, language],
    );
  });
}
