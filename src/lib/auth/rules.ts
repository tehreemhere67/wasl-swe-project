/**
 * Pure access and lockout rules - no framework imports, so these decisions can
 * be unit-tested directly (`node --test`).
 *
 * SRS references: FR-ADM-01 (role-scoped access), NFR-SEC-02 (lockout after
 * 5 failed attempts), FR-VER-03 (pending organizations cannot operate).
 */

import type { Role, VerificationStatus } from "@/lib/validation";

export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  hospital: "/hospital",
  blood_bank: "/bank",
  donation_org: "/organizer",
  donor: "/donor",
};

/** Where a user goes after a successful login. */
export function landingPath(
  role: Role,
  organizationStatus: VerificationStatus | null | undefined,
): string {
  if (organizationStatus && organizationStatus !== "verified") {
    return "/status";
  }
  return ROLE_HOME[role];
}

/** An organization user may only use operational screens when Verified. */
export function canOperate(role: Role, organizationStatus: VerificationStatus | null | undefined): boolean {
  if (role === "admin" || role === "donor") return true;
  return organizationStatus === "verified";
}

export function maxFailedLogins(): number {
  const parsed = Number(process.env.MAX_FAILED_LOGINS || 5);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

export function lockoutMinutes(): number {
  const parsed = Number(process.env.LOCKOUT_MINUTES || 15);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
}

export interface FailedLoginOutcome {
  attempts: number;
  lockedUntil: Date | null;
  remainingAttempts: number;
}

/**
 * NFR-SEC-02: "An account shall be locked for 15 minutes after 5 failed login
 * attempts." The lock starts on the fifth failure.
 */
export function registerFailedLogin(
  previousAttempts: number,
  now: Date = new Date(),
  maxAttempts: number = maxFailedLogins(),
  lockMinutes: number = lockoutMinutes(),
): FailedLoginOutcome {
  const attempts = Math.max(0, Math.floor(previousAttempts)) + 1;
  if (attempts >= maxAttempts) {
    return {
      attempts,
      lockedUntil: new Date(now.getTime() + lockMinutes * 60 * 1000),
      remainingAttempts: 0,
    };
  }
  return { attempts, lockedUntil: null, remainingAttempts: maxAttempts - attempts };
}

/** True while the account is still inside its lockout period. */
export function isLocked(lockedUntil: string | Date | null | undefined, now: Date = new Date()): boolean {
  if (!lockedUntil) return false;
  const time = typeof lockedUntil === "string" ? new Date(lockedUntil).getTime() : lockedUntil.getTime();
  return Number.isFinite(time) && time > now.getTime();
}

export function remainingAttempts(outcome: FailedLoginOutcome): number {
  return outcome.remainingAttempts;
}

/** Whole minutes left on a lock, rounded up, for a friendly error message. */
export function minutesUntil(lockedUntil: Date | string, now: Date = new Date()): number {
  const time = typeof lockedUntil === "string" ? new Date(lockedUntil).getTime() : lockedUntil.getTime();
  return Math.max(1, Math.ceil((time - now.getTime()) / 60000));
}
