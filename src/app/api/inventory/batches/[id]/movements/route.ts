import { badRequest, forbidden, json, readJson, unauthorized } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/csrf";
import { getBatchUnits, recordManualMovement } from "@/lib/inventory/data";
import { runMonitoringSweep } from "@/lib/inventory/monitoring";
import { validateMovementInput } from "@/lib/inventory/rules";

/**
 * POST /api/inventory/batches/[id]/movements - 4.4 (FR-INV-05, FR-MON-02).
 *
 * Records units issued to a hospital, discarded, marked expired, or a corrected
 * total. The batch belongs to the signed-in blood bank; any other bank's batch
 * is reported as not found (A-12).
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

  const currentUnits = await getBatchUnits(organization.id, id);
  if (currentUnits === null) {
    return json({ ok: false, error: { code: "not_found" } }, 404);
  }

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const validation = validateMovementInput(
    {
      type: typeof body.type === "string" ? body.type : "",
      units:
        typeof body.units === "number" || typeof body.units === "string"
          ? body.units
          : undefined,
      note: typeof body.note === "string" ? body.note : "",
    },
    { currentUnits },
  );

  if (!validation.ok) {
    return badRequest(
      validation.errors.map((error) => ({ field: error.field, message: error.code })),
    );
  }

  try {
    const result = await recordManualMovement({
      organizationId: organization.id,
      actorUserId: session.user.id,
      batchId: id,
      values: validation.values,
    });

    if (result.changed) {
      await recordAudit({
        actorUserId: session.user.id,
        actorRole: "blood_bank",
        action: "inventory_movement_recorded",
        entityType: "inventory_batch",
        entityId: id,
        details: {
          organizationId: organization.id,
          type: validation.values.type,
          unitsBefore: result.unitsBefore,
          unitsAfter: result.unitsAfter,
          note: validation.values.note,
        },
      });

      // FR-MON-06: re-evaluate expiry/low stock immediately after a change.
      await runMonitoringSweep(organization.id);
    }

    return json({ ok: true, changed: result.changed, redirect: `/bank/inventory/${id}` });
  } catch (error) {
    const message = (error as Error).message;
    if (message === "batch_not_found") {
      return json({ ok: false, error: { code: "not_found" } }, 404);
    }
    if (message === "invalid_quantity") {
      return badRequest([{ field: "units", message: "inventory.error.units" }]);
    }
    console.error("[api/inventory/batches/:id/movements]", error);
    return json({ ok: false, error: { code: "server_error" } }, 500);
  }
}
