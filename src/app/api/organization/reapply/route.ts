import { getSession } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { isSameOrigin } from "@/lib/csrf";
import { transaction } from "@/lib/db";
import { forbidden, redirectTo, unauthorized } from "@/lib/api";

/**
 * POST /api/organization/reapply - A-04: "A Rejected organization may apply
 * again." The registration returns to Pending and the attempt is recorded in
 * the verification history so administrators can see it.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();

  const session = await getSession();
  if (!session) return unauthorized();

  const organization = session.user.organization;
  if (!organization) return forbidden();
  if (organization.verificationStatus !== "rejected") {
    return redirectTo(request, "/status");
  }

  await transaction(async (tx) => {
    await tx.query(
      `UPDATE organizations
          SET verification_status = 'pending', status_reason = NULL, updated_at = now()
        WHERE id = $1`,
      [organization.id],
    );
    await tx.query(
      `INSERT INTO verification_history (organization_id, admin_user_id, decision)
       VALUES ($1, NULL, 'reapplied')`,
      [organization.id],
    );
  });

  await recordAudit({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    action: "organization_reapply",
    entityType: "organization",
    entityId: organization.id,
  });

  return redirectTo(request, "/status");
}
