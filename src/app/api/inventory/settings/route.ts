import { badRequest, forbidden, json, readJson, unauthorized } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/csrf";
import {
  runMonitoringSweep,
  saveBankMonitoringSettings,
  saveStockThresholds,
} from "@/lib/inventory/monitoring";
import { validateMonitoringSettings } from "@/lib/inventory/rules";

/**
 * POST /api/inventory/settings - B-05 (FR-MON-01, FR-MON-03/04).
 *
 * Saves the low-stock thresholds and the expiry warning windows for this bank,
 * then re-runs the sweep so the new thresholds take effect immediately.
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

  const validation = validateMonitoringSettings({
    thresholds: Array.isArray(body.thresholds)
      ? (body.thresholds as Array<{
          bloodGroup?: string;
          component?: string;
          thresholdUnits?: string | number | null;
        }>)
      : [],
    warningDays:
      body.warningDays && typeof body.warningDays === "object"
        ? (body.warningDays as Record<string, string | number | null | undefined>)
        : {},
    smsAlerts: Boolean(body.smsAlerts),
  });

  if (!validation.ok) {
    return badRequest(
      validation.errors.map((error) => ({ field: error.field, message: error.code })),
    );
  }

  try {
    await saveStockThresholds(organization.id, session.user.id, validation.values.thresholds);
    await saveBankMonitoringSettings(organization.id, session.user.id, {
      expiryWarningDays: validation.values.expiryWarningDays,
      smsAlerts: validation.values.smsAlerts,
    });

    await recordAudit({
      actorUserId: session.user.id,
      actorRole: "blood_bank",
      action: "inventory_settings_updated",
      entityType: "organization",
      entityId: organization.id,
      details: {
        thresholds: validation.values.thresholds,
        expiryWarningDays: validation.values.expiryWarningDays,
        smsAlerts: validation.values.smsAlerts,
      },
    });

    // New thresholds must take effect at once (FR-MON-06).
    await runMonitoringSweep(organization.id);

    return json({ ok: true, redirect: "/bank/settings" });
  } catch (error) {
    console.error("[api/inventory/settings]", error);
    return json({ ok: false, error: { code: "server_error" } }, 500);
  }
}
