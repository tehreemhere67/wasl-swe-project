import "server-only";

import { query } from "@/lib/db";
import type { Language, Role, VerificationStatus } from "@/lib/validation";
import { normalizeMobile } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { verifyPassword } from "./password";
import { isLocked, registerFailedLogin, remainingAttempts } from "./rules";
import { type SessionUser, createSession } from "./session";

/**
 * Login - FR-ADM-01.
 *
 * NFR-SEC-02: "An account shall be locked for 15 minutes after 5 failed login
 * attempts." The lock is stored on the user row, so it survives restarts.
 */

export type LoginOutcome =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "invalid"; attemptsLeft?: number }
  | { ok: false; reason: "locked"; lockedUntil: Date }
  | { ok: false; reason: "deactivated" };

interface UserRow {
  id: string;
  role: Role;
  email: string | null;
  phone: string | null;
  password_hash: string;
  full_name: string;
  status: string;
  preferred_language: Language;
  failed_login_attempts: number;
  locked_until: string | null;
}

interface OrganizationRow {
  id: string;
  type: "hospital" | "blood_bank" | "donation_org";
  name: string;
  area: string | null;
  verification_status: VerificationStatus;
  status_reason: string | null;
}

/** Turns whatever the user typed into the value stored on the account. */
export function normalizeIdentifier(identifier: string): string {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  return normalizeMobile(trimmed) ?? trimmed;
}

export async function loadOrganizationForUser(userId: string): Promise<OrganizationRow | null> {
  const { rows } = await query<OrganizationRow>(
    `SELECT o.id, o.type, o.name, o.area, o.verification_status, o.status_reason
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
      WHERE u.id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

function toSessionUser(user: UserRow, organization: OrganizationRow | null): SessionUser {
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
    fullName: user.full_name,
    preferredLanguage: user.preferred_language,
    organization: organization
      ? {
          id: organization.id,
          type: organization.type,
          name: organization.name,
          area: organization.area,
          verificationStatus: organization.verification_status,
          statusReason: organization.status_reason,
        }
      : null,
  };
}

export async function authenticate(
  identifier: string,
  password: string,
  meta: { ip?: string | null; userAgent?: string | null } = {},
): Promise<LoginOutcome> {
  const normalized = normalizeIdentifier(identifier);

  const { rows } = await query<UserRow>(
    `SELECT id, role, email, phone, password_hash, full_name, status,
            preferred_language, failed_login_attempts, locked_until
       FROM users
      WHERE lower(email) = lower($1) OR phone = $1
      LIMIT 1`,
    [normalized],
  );

  if (rows.length === 0) {
    await recordAudit({
      action: "login_failed",
      details: { identifier: normalized, reason: "unknown_account" },
      ip: meta.ip,
    });
    // Same message for an unknown account and a wrong password: no account probing.
    return { ok: false, reason: "invalid" };
  }

  const user = rows[0];

  if (user.status !== "active") {
    await recordAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: "login_failed",
      details: { reason: "deactivated" },
      ip: meta.ip,
    });
    return { ok: false, reason: "deactivated" };
  }

  if (isLocked(user.locked_until)) {
    await recordAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: "login_locked",
      details: { lockedUntil: user.locked_until },
      ip: meta.ip,
    });
    return { ok: false, reason: "locked", lockedUntil: new Date(user.locked_until as string) };
  }

  const valid = await verifyPassword(password, user.password_hash);

  if (!valid) {
    const outcome = registerFailedLogin(user.failed_login_attempts);
    if (outcome.lockedUntil) {
      await query(
        `UPDATE users
            SET failed_login_attempts = $2, locked_until = $3, updated_at = now()
          WHERE id = $1`,
        [user.id, outcome.attempts, outcome.lockedUntil.toISOString()],
      );
      await recordAudit({
        actorUserId: user.id,
        actorRole: user.role,
        action: "login_locked",
        details: { attempts: outcome.attempts, lockedUntil: outcome.lockedUntil.toISOString() },
        ip: meta.ip,
      });
      return { ok: false, reason: "locked", lockedUntil: outcome.lockedUntil };
    }

    await query(
      "UPDATE users SET failed_login_attempts = $2, updated_at = now() WHERE id = $1",
      [user.id, outcome.attempts],
    );
    await recordAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: "login_failed",
      details: { attempts: outcome.attempts, reason: "wrong_password" },
      ip: meta.ip,
    });
    return { ok: false, reason: "invalid", attemptsLeft: remainingAttempts(outcome) };
  }

  // Success: clear the counters and start a fresh session.
  await query(
    `UPDATE users
        SET failed_login_attempts = 0, locked_until = NULL, last_login_at = now(), updated_at = now()
      WHERE id = $1`,
    [user.id],
  );
  await createSession(user.id, meta);
  await recordAudit({
    actorUserId: user.id,
    actorRole: user.role,
    action: "login_success",
    ip: meta.ip,
  });

  const organization = await loadOrganizationForUser(user.id);
  return { ok: true, user: toSessionUser(user, organization) };
}
