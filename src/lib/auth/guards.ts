import "server-only";

import { redirect } from "next/navigation";
import { getSession, type SessionContext, type SessionUser } from "./session";
import { landingPath, ROLE_HOME } from "./rules";
import type { Role } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

/**
 * Role-based access - FR-ADM-01 ("give each user class access only to the
 * features for that class. Any other action shall be refused.") and
 * FR-VER-03 (a pending organization cannot use operational features).
 */

export { ROLE_HOME };

/** Where a user goes after login. Pending/rejected organizations go to G-04. */
export function landingPathFor(user: SessionUser): string {
  return landingPath(user.role, user.organization?.verificationStatus ?? null);
}

export function isOperational(session: SessionContext): boolean {
  if (session.user.role === "admin" || session.user.role === "donor") return true;
  return session.user.organization?.verificationStatus === "verified";
}

export async function getOptionalSession(): Promise<SessionContext | null> {
  return getSession();
}

/** Any signed-in user. Sends visitors to the landing page, preserving intent. */
export async function requireUser(nextPath?: string): Promise<SessionContext> {
  const session = await getSession();
  if (!session) {
    const target = nextPath ? `/?next=${encodeURIComponent(nextPath)}` : "/";
    redirect(target);
  }
  return session;
}

/** Restricts a page to the given roles. Others are sent to their own home. */
export async function requireRole(roles: Role[], nextPath?: string): Promise<SessionContext> {
  const session = await requireUser(nextPath);
  if (!roles.includes(session.user.role)) {
    await recordAudit({
      actorUserId: session.user.id,
      actorRole: session.user.role,
      action: "access_refused",
      details: { requested: nextPath ?? null, allowedRoles: roles },
    });
    redirect(landingPathFor(session.user));
  }
  return session;
}

/**
 * Organization pages: the organization must be Verified (FR-VER-03). Pending,
 * rejected and suspended organizations are sent to the status screen (G-04).
 */
export async function requireVerifiedOrganization(nextPath?: string): Promise<
  SessionContext & { user: SessionUser & { organization: NonNullable<SessionUser["organization"]> } }
> {
  const session = await requireUser(nextPath);
  if (!session.user.organization) {
    redirect(landingPathFor(session.user));
  }
  if (session.user.organization.verificationStatus !== "verified") {
    await recordAudit({
      actorUserId: session.user.id,
      actorRole: session.user.role,
      action: "access_refused",
      details: {
        requested: nextPath ?? null,
        reason: "organization_not_verified",
        verificationStatus: session.user.organization.verificationStatus,
      },
    });
    redirect("/status");
  }
  return session as SessionContext & {
    user: SessionUser & { organization: NonNullable<SessionUser["organization"]> };
  };
}

export async function requireAdmin(): Promise<SessionContext> {
  return requireRole(["admin"], "/admin");
}
