import { badRequest, forbidden, json, unauthorized } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/csrf";
import { archiveBatch } from "@/lib/inventory/data";

/**
 * POST /api/inventory/batches/[id]/archive - 4.4 soft delete.
 *
 * Only an EMPTY batch of the signed-in blood bank can be removed from the list.
 * Nothing is deleted: `archived_at` hides it from B-02 and the movement history
 * stays reachable (DR-05).
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

  try {
    const result = await archiveBatch({
      organizationId: organization.id,
      actorUserId: session.user.id,
      batchId: id,
    });

    if (result.archived) {
      await recordAudit({
        actorUserId: session.user.id,
        actorRole: "blood_bank",
        action: "inventory_batch_archived",
        entityType: "inventory_batch",
        entityId: id,
        details: { organizationId: organization.id },
      });
    }

    return json({ ok: true, redirect: "/bank/inventory" });
  } catch (error) {
    const message = (error as Error).message;
    if (message === "batch_not_found") {
      return json({ ok: false, error: { code: "not_found" } }, 404);
    }
    if (message === "batch_not_empty") {
      return badRequest([{ field: "units", message: "inventory.error.batchNotEmpty" }]);
    }
    console.error("[api/inventory/batches/:id/archive]", error);
    return json({ ok: false, error: { code: "server_error" } }, 500);
  }
}
