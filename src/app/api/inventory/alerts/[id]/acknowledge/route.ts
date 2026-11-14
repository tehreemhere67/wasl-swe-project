import { forbidden, json, unauthorized } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/csrf";
import { acknowledgeAlert } from "@/lib/inventory/monitoring";

/**
 * POST /api/inventory/alerts/[id]/acknowledge - 7.4 / FR-MON-05.
 *
 * The bank marks an alert as seen. It disappears from the dashboard and the same
 * condition is silenced for 24 hours (A-32).
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return forbidden();

  const session = await getSession();
  if (!session) return unauthorized();
  if (session.user.role !== "blood_bank") return forbidden();

  const organization = session.user.organization;
  if (!organization || organization.verificationStatus !== "verified") return forbidden();

  const { id } = await context.params;
  if (!id) return json({ ok: false, error: { code: "invalid_request" } }, 400);

  try {
    await acknowledgeAlert({
      organizationId: organization.id,
      actorUserId: session.user.id,
      alertId: id,
    });

    await recordAudit({
      actorUserId: session.user.id,
      actorRole: "blood_bank",
      action: "inventory_alert_acknowledged",
      entityType: "stock_alert",
      entityId: id,
      details: { organizationId: organization.id },
    });

    return json({ ok: true, redirect: "/bank" });
  } catch (error) {
    if ((error as Error).message === "alert_not_found") {
      return json({ ok: false, error: { code: "not_found" } }, 404);
    }
    console.error("[api/inventory/alerts/:id/acknowledge]", error);
    return json({ ok: false, error: { code: "server_error" } }, 500);
  }
}
