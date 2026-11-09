import { getSession } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { notifyOrganizationDecision } from "@/lib/notifications";
import { isSameOrigin } from "@/lib/csrf";
import { transaction } from "@/lib/db";
import { badRequest, forbidden, json, readJson, unauthorized } from "@/lib/api";

/**
 * POST /api/admin/verify - A-02 baseline (FR-VER-02, FR-VER-04).
 *
 * The administrator records a decision on an organization. The status, the
 * verification history row and the audit entry are written in one transaction,
 * then the applicant is notified (FR-VER-06).
 */

type Decision = "approved" | "rejected" | "suspended" | "reinstated";

const DECISIONS: Decision[] = ["approved", "rejected", "suspended", "reinstated"];

const STATUS_FOR: Record<Decision, "verified" | "rejected" | "suspended"> = {
  approved: "verified",
  rejected: "rejected",
  suspended: "suspended",
  reinstated: "verified",
};

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();

  const session = await getSession();
  if (!session) return unauthorized();
  if (session.user.role !== "admin") return forbidden();

  const body = await readJson<{ organizationId?: string; decision?: string; reason?: string }>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const organizationId = String(body.organizationId ?? "");
  const decision = String(body.decision ?? "") as Decision;
  const reason = String(body.reason ?? "").trim();

  if (!organizationId) return badRequest([{ field: "organizationId", message: "required" }]);
  if (!DECISIONS.includes(decision)) return badRequest([{ field: "decision", message: "invalid" }]);
  if ((decision === "rejected" || decision === "suspended") && reason.length < 3) {
    return badRequest([{ field: "reason", message: "required" }]);
  }

  try {
    await transaction(async (tx) => {
      const updated = await tx.query<{ id: string }>(
        `UPDATE organizations
            SET verification_status = $2,
                status_reason = $3,
                verified_at = CASE WHEN $2 = 'verified' THEN now() ELSE verified_at END,
                updated_at = now()
          WHERE id = $1
          RETURNING id`,
        [organizationId, STATUS_FOR[decision], decision === "rejected" || decision === "suspended" ? reason : null],
      );
      if (updated.rows.length === 0) throw new Error("organization_not_found");

      await tx.query(
        `INSERT INTO verification_history (organization_id, admin_user_id, decision, reason)
         VALUES ($1, $2, $3, $4)`,
        [organizationId, session.user.id, decision, reason || null],
      );
    });
  } catch (error) {
    if ((error as Error).message === "organization_not_found") {
      return json({ ok: false, error: { code: "not_found" } }, 404);
    }
    console.error("[admin/verify]", error);
    return json({ ok: false, error: { code: "server_error" } }, 500);
  }

  await recordAudit({
    actorUserId: session.user.id,
    actorRole: "admin",
    action:
      decision === "approved"
        ? "organization_approved"
        : decision === "rejected"
          ? "organization_rejected"
          : decision === "suspended"
            ? "organization_suspended"
            : "organization_reinstated",
    entityType: "organization",
    entityId: organizationId,
    details: { decision, reason: reason || null },
  });

  await notifyOrganizationDecision(organizationId, decision, reason || null);

  return json({ ok: true });
}
