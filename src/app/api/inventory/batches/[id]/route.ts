import { badRequest, forbidden, json, readJson, unauthorized } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/csrf";
import { getBatchExpiry, updateBatch } from "@/lib/inventory/data";
import { runMonitoringSweep } from "@/lib/inventory/monitoring";
import { validateBatchInput } from "@/lib/inventory/rules";

/**
 * PATCH /api/inventory/batches/[id] - 4.3 (FR-INV-03).
 *
 * Order: same-origin -> role + verified check -> ownership -> validation ->
 * transaction -> audit. Owning the batch is decided by
 * `organization_id = session organization`, so a bank can only ever edit its
 * own stock (A-12).
 */
export async function PATCH(
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

  const previousExpiresAt = await getBatchExpiry(organization.id, id);
  if (!previousExpiresAt) {
    return json({ ok: false, error: { code: "not_found" } }, 404);
  }

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const validation = validateBatchInput(
    {
      bloodGroup: typeof body.bloodGroup === "string" ? body.bloodGroup : "",
      component: typeof body.component === "string" ? body.component : "",
      units:
        typeof body.units === "number" || typeof body.units === "string"
          ? body.units
          : undefined,
      status: typeof body.status === "string" ? body.status : "",
      expiresAt: typeof body.expiresAt === "string" ? body.expiresAt : "",
    },
    new Date(),
    { previousExpiresAt },
  );

  if (!validation.ok) {
    return badRequest(
      validation.errors.map((error) => ({ field: error.field, message: error.code })),
    );
  }

  try {
    const result = await updateBatch({
      organizationId: organization.id,
      actorUserId: session.user.id,
      batchId: id,
      values: validation.values,
    });

    if (result.changed) {
      await recordAudit({
        actorUserId: session.user.id,
        actorRole: "blood_bank",
        action: "inventory_batch_updated",
        entityType: "inventory_batch",
        entityId: id,
        details: { organizationId: organization.id, changes: result.changes },
      });

      // FR-MON-06: re-evaluate expiry/low stock immediately after a change.
      await runMonitoringSweep(organization.id);
    }

    return json({ ok: true, changed: result.changed, redirect: `/bank/inventory/${id}` });
  } catch (error) {
    if ((error as Error).message === "batch_not_found") {
      return json({ ok: false, error: { code: "not_found" } }, 404);
    }
    console.error("[api/inventory/batches/:id]", error);
    return json({ ok: false, error: { code: "server_error" } }, 500);
  }
}
