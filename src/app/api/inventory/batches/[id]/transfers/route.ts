import { badRequest, forbidden, json, readJson, unauthorized } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/csrf";
import { getBatchUnits, transferOut } from "@/lib/inventory/data";
import { runMonitoringSweep } from "@/lib/inventory/monitoring";
import { validateTransferInput } from "@/lib/inventory/rules";

/**
 * POST /api/inventory/batches/[id]/transfers - 4.7 (FR-INV-06, A-11).
 *
 * The sending blood bank records that units went to another VERIFIED blood bank.
 * The receiving bank records its own incoming batch separately; Wasl never moves
 * stock between organizations itself (BR-4).
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

  const validation = validateTransferInput(
    {
      units:
        typeof body.units === "number" || typeof body.units === "string"
          ? body.units
          : undefined,
      receivingOrganizationId:
        typeof body.receivingOrganizationId === "string"
          ? body.receivingOrganizationId
          : "",
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
    const result = await transferOut({
      organizationId: organization.id,
      actorUserId: session.user.id,
      batchId: id,
      units: validation.values.units,
      receivingOrganizationId: validation.values.receivingOrganizationId,
      note: validation.values.note,
    });

    await recordAudit({
      actorUserId: session.user.id,
      actorRole: "blood_bank",
      action: "inventory_movement_recorded",
      entityType: "inventory_batch",
      entityId: id,
      details: {
        organizationId: organization.id,
        type: "transferred_out",
        units: validation.values.units,
        receivingOrganizationId: validation.values.receivingOrganizationId,
        unitsAfter: result.unitsAfter,
      },
    });

    // FR-MON-06: a transfer changes the quantity, so re-evaluate.
    await runMonitoringSweep(organization.id);

    return json({ ok: true, redirect: `/bank/inventory/${id}` });
  } catch (error) {
    const message = (error as Error).message;
    if (message === "invalid_receiving_bank") {
      return badRequest([
        { field: "receivingOrganizationId", message: "inventory.error.receivingBank" },
      ]);
    }
    if (message === "not_enough_units") {
      return badRequest([{ field: "units", message: "inventory.error.unitsTooMany" }]);
    }
    if (message === "batch_not_found") {
      return json({ ok: false, error: { code: "not_found" } }, 404);
    }
    console.error("[api/inventory/batches/:id/transfers]", error);
    return json({ ok: false, error: { code: "server_error" } }, 500);
  }
}
