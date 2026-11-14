import { badRequest, forbidden, json, readJson, unauthorized } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/csrf";
import { createBatch } from "@/lib/inventory/data";
import { runMonitoringSweep } from "@/lib/inventory/monitoring";
import { validateBatchInput } from "@/lib/inventory/rules";

/**
 * POST /api/inventory/batches - B-03 (FR-INV-01, FR-INV-03).
 *
 * Order required by HANDOFF.md section 5:
 *   same-origin -> role + verified check -> validation -> transaction -> audit.
 *
 * Only a verified blood bank may change its own stock (FR-INV-08, FR-VER-03);
 * a blood bank can never write another organization's inventory (A-12).
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();

  const session = await getSession();
  if (!session) return unauthorized();
  if (session.user.role !== "blood_bank") return forbidden();

  const organization = session.user.organization;
  if (!organization || organization.verificationStatus !== "verified") return forbidden();

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const validation = validateBatchInput({
    bloodGroup: typeof body.bloodGroup === "string" ? body.bloodGroup : "",
    component: typeof body.component === "string" ? body.component : "",
    units:
      typeof body.units === "number" || typeof body.units === "string"
        ? body.units
        : undefined,
    status: typeof body.status === "string" ? body.status : "",
    expiresAt: typeof body.expiresAt === "string" ? body.expiresAt : "",
  });

  if (!validation.ok) {
    // The page translates these codes; no user-visible English is sent from here.
    return badRequest(
      validation.errors.map((error) => ({ field: error.field, message: error.code })),
    );
  }

  let batchId: string;
  try {
    batchId = await createBatch({
      organizationId: organization.id,
      actorUserId: session.user.id,
      values: validation.values,
    });
  } catch (error) {
    console.error("[api/inventory/batches]", error);
    return json({ ok: false, error: { code: "server_error" } }, 500);
  }

  await recordAudit({
    actorUserId: session.user.id,
    actorRole: "blood_bank",
    action: "inventory_batch_created",
    entityType: "inventory_batch",
    entityId: batchId,
    details: {
      organizationId: organization.id,
      bloodGroup: validation.values.bloodGroup,
      component: validation.values.component,
      units: validation.values.units,
      status: validation.values.status,
      expiresAt: validation.values.expiresAt.toISOString(),
    },
  });

  // FR-MON-06: re-evaluate expiry/low stock immediately after a change.
  await runMonitoringSweep(organization.id);

  return json({ ok: true, batchId, redirect: "/bank/inventory" });
}
