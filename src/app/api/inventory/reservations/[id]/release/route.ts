import { forbidden, json, unauthorized } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/csrf";
import { releaseReservation } from "@/lib/inventory/data";
import { runMonitoringSweep } from "@/lib/inventory/monitoring";

/**
 * POST /api/inventory/reservations/[id]/release - 4.6 (FR-INV-04).
 *
 * A bank can release a hold it made. The reservation must belong to the signed-in
 * organization; another bank's id is reported as not found (A-12).
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
    const result = await releaseReservation({
      organizationId: organization.id,
      actorUserId: session.user.id,
      reservationId: id,
    });

    await recordAudit({
      actorUserId: session.user.id,
      actorRole: "blood_bank",
      action: "inventory_movement_recorded",
      entityType: "inventory_batch",
      entityId: result.batchId,
      details: {
        organizationId: organization.id,
        type: "reservation_released",
        reservationId: id,
      },
    });

    // FR-MON-06: releasing a hold changes what is available.
    await runMonitoringSweep(organization.id);

    return json({ ok: true, redirect: `/bank/inventory/${result.batchId}` });
  } catch (error) {
    const message = (error as Error).message;
    if (message === "reservation_not_found") {
      return json({ ok: false, error: { code: "not_found" } }, 404);
    }
    if (message === "reservation_not_active") {
      return json({ ok: false, error: { code: "not_active" } }, 409);
    }
    console.error("[api/inventory/reservations/:id/release]", error);
    return json({ ok: false, error: { code: "server_error" } }, 500);
  }
}
