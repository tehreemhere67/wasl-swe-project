import "server-only";

import { getSession, type SessionContext } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/csrf";
import { forbidden, unauthorized } from "@/lib/api";

/**
 * Shared checks for the campaign and donor API routes: same origin -> signed in -> right role.
 * A GET has no CSRF check (it changes nothing); every other method is checked.
 */

export type GuardResult<T extends SessionContext> = { session: T } | { response: Response };

/** Verified blood banks and donation organizations are the campaign organizers (FR-CAM-01). */
export async function organizerGuard(
  request: Request,
): Promise<GuardResult<SessionContext & { organizationId: string }> | { response: Response }> {
  if (request.method !== "GET" && !isSameOrigin(request)) return { response: forbidden() };
  const session = await getSession();
  if (!session) return { response: unauthorized() };
  const org = session.user.organization;
  if (
    (session.user.role !== "donation_org" && session.user.role !== "blood_bank") ||
    !org ||
    org.verificationStatus !== "verified"
  )
    return { response: forbidden() };
  return { session: Object.assign(session, { organizationId: org.id }) };
}

export async function donorGuard(request: Request): Promise<GuardResult<SessionContext> | { response: Response }> {
  if (request.method !== "GET" && !isSameOrigin(request)) return { response: forbidden() };
  const session = await getSession();
  if (!session) return { response: unauthorized() };
  if (session.user.role !== "donor") return { response: forbidden() };
  return { session };
}
