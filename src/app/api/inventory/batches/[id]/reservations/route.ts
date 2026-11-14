import { badRequest, forbidden, json, readJson, unauthorized } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/csrf";
import { createReservation, getBatchUnits, listReservations } from "@/lib/inventory/data";
import { runMonitoringSweep } from "@/lib/inventory/monitoring";
import { validateReservationInput } from "@/lib/inventory/rules";

/**
 * POST /api/inventory/batches/[id]/reservations - 4.6 (FR-INV-04, A-10).
 *
 * Sets units aside for a hold period. Only a verified blood bank may reserve its
 * own stock, and never more than the units that are currently free.
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
  if (!id) return badRequest({ code: "invalid_request" });

  const units = await getBatchUnits(organization.id, id);
  if (units === null) {
    return json({ ok: false, error: { code: "not_found" } }, 404);
  }

  const existing = await listReservations(organization.id, id);
  const freeUnits = units - existing.reduce((total, reservation) => total + reservation.units, 0);

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const validation = validateReservationInput(
    {
      units:
        typeof body.units === "number" || typeof body.units === "string"
          ? body.units
          : undefined,
      holdHours:
        typeof body.holdHours === "number" || typeof body.holdHours === "string"
          ? body.holdHours
          : undefined,
    },
    { freeUnits },
  );

  if (!validation.ok) {
    return badRequest(
      validation.errors.map((error) => ({ field: error.field, message: error.code })),
    );
  }

  try {
    const created = await createReservation({
      organizationId: organization.id,
      actorUserId: session.user.id,
      batchId: id,
      units: validation.values.units,
      holdHours: validation.values.holdHours,
    });

    await recordAudit({
      actorUserId: session.user.id,
      actorRole: "blood_bank",
      action: "inventory_movement_recorded",
      entityType: "inventory_batch",
      entityId: id,
      details: {
        organizationId: organization.id,
        type: "reserved",
        units: validation.values.units,
        holdHours: validation.values.holdHours,
        reservationId: created.id,
      },
    });

    // FR-MON-06: a reservation changes what is available, so re-evaluate.
    await runMonitoringSweep(organization.id);

    return json({ ok: true, redirect: `/bank/inventory/${id}` });
  } catch (error) {
    const message = (error as Error).message;
    if (message === "not_enough_units") {
      return badRequest([{ field: "units", message: "inventory.error.reserveTooMany" }]);
    }
    if (message === "batch_not_found") {
      return json({ ok: false, error: { code: "not_found" } }, 404);
    }
    console.error("[api/inventory/batches/:id/reservations]", error);
    return json({ ok: false, error: { code: "server_error" } }, 500);
  }
}
