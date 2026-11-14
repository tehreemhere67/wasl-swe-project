import "server-only";

import { query, transaction } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { translate } from "@/lib/i18n";
import { createNotification } from "@/lib/notifications";
import { sendSms } from "@/lib/messaging";
import { releaseExpiredHolds } from "./data";
import { COMPONENT_LABEL_KEY } from "./labels";
import {
  alertDedupeKey,
  isExpiringSoon,
  isLowStock,
  movementDelta,
  shouldRaiseAlert,
  sweepDue,
  thresholdFor,
  toDate,
  type BloodComponent,
  type ThresholdLike,
} from "./rules";

/**
 * Module 7 - expiry (7.1/7.2) and low-stock (7.3) monitoring, the settings that
 * drive them (B-05), and acknowledgement (7.4).
 *
 * `runMonitoringSweep` is the one clock: it runs when B-01 loads and after every
 * inventory change, which is how FR-MON-06's "within 1 minute of a change" is met
 * without a background worker. Every step is idempotent.
 */

export interface BankMonitoringSettings {
  /** Per-component override of the SRS 2/7/7/30-day windows (A-31). */
  expiryWarningDays: Partial<Record<BloodComponent, number>>;
  smsAlerts: boolean;
  lastSweepAt: string | null;
}

export async function getBankMonitoringSettings(
  organizationId: string,
): Promise<BankMonitoringSettings> {
  const result = await query<{
    expiry_warning_days: Record<string, number> | null;
    sms_alerts: boolean;
    last_sweep_at: Date | string | null;
  }>(
    `SELECT expiry_warning_days, sms_alerts, last_sweep_at
       FROM bank_monitoring_settings
      WHERE organization_id = $1`,
    [organizationId],
  );

  const row = result.rows[0];
  return {
    expiryWarningDays: (row?.expiry_warning_days ?? {}) as Partial<Record<BloodComponent, number>>,
    smsAlerts: Boolean(row?.sms_alerts),
    lastSweepAt: row?.last_sweep_at ? (toDate(row.last_sweep_at)?.toISOString() ?? null) : null,
  };
}

export interface SaveMonitoringSettingsInput {
  expiryWarningDays: Partial<Record<BloodComponent, number>>;
  smsAlerts: boolean;
}

/** B-05: save this bank's warning windows and SMS preference. */
export async function saveBankMonitoringSettings(
  organizationId: string,
  actorUserId: string,
  input: SaveMonitoringSettingsInput,
): Promise<void> {
  await query(
    `INSERT INTO bank_monitoring_settings
       (organization_id, expiry_warning_days, sms_alerts, updated_by, updated_at)
     VALUES ($1, $2::jsonb, $3, $4, now())
     ON CONFLICT (organization_id)
     DO UPDATE SET expiry_warning_days = EXCLUDED.expiry_warning_days,
                   sms_alerts = EXCLUDED.sms_alerts,
                   updated_by = EXCLUDED.updated_by,
                   updated_at = now()`,
    [organizationId, JSON.stringify(input.expiryWarningDays), input.smsAlerts, actorUserId],
  );
}

/** 7.3: this bank's own thresholds; a missing row means "use the default of 5". */
export async function getStockThresholds(organizationId: string): Promise<ThresholdLike[]> {
  const result = await query<{
    blood_group: string;
    component: string;
    threshold_units: number | string;
  }>(
    `SELECT blood_group, component, threshold_units
       FROM stock_thresholds
      WHERE organization_id = $1`,
    [organizationId],
  );

  return result.rows.map((row) => ({
    bloodGroup: row.blood_group,
    component: row.component,
    thresholdUnits: Number(row.threshold_units),
  }));
}

export interface ThresholdRow {
  bloodGroup: string;
  component: string;
  /** null removes the override, so the default of 5 applies again. */
  thresholdUnits: number | null;
}

export async function saveStockThresholds(
  organizationId: string,
  actorUserId: string,
  rows: ThresholdRow[],
): Promise<void> {
  await transaction(async (tx) => {
    for (const row of rows) {
      if (row.thresholdUnits === null) {
        await tx.query(
          `DELETE FROM stock_thresholds
            WHERE organization_id = $1
              AND blood_group = $2
              AND component = $3`,
          [organizationId, row.bloodGroup, row.component],
        );
      } else {
        await tx.query(
          `INSERT INTO stock_thresholds
             (organization_id, blood_group, component, threshold_units, updated_by, updated_at)
           VALUES ($1, $2, $3, $4, $5, now())
           ON CONFLICT (organization_id, blood_group, component)
           DO UPDATE SET threshold_units = EXCLUDED.threshold_units,
                         updated_by = EXCLUDED.updated_by,
                         updated_at = now()`,
          [organizationId, row.bloodGroup, row.component, row.thresholdUnits, actorUserId],
        );
      }
    }
  });
}

export interface SweepResult {
  expired: number;
  alertsRaised: number;
}

interface ExpiringBatchRow {
  id: string;
  units: number | string;
  blood_group: string;
  component: string;
  expires_at: Date | string;
}

interface BankStaff {
  id: string;
  phone: string | null;
  preferredLanguage: string;
}

/** Everyone who should see this bank's alerts. */
async function bankStaff(organizationId: string): Promise<BankStaff[]> {
  const staff = await query<{
    id: string;
    phone: string | null;
    preferred_language: string;
  }>(
    `SELECT id, phone, preferred_language
       FROM users
      WHERE organization_id = $1
        AND status = 'active'`,
    [organizationId],
  );

  return staff.rows.map((row) => ({
    id: row.id,
    phone: row.phone,
    preferredLanguage: row.preferred_language,
  }));
}

type AlertKind = "expiry" | "low_stock";

interface AlertInput {
  organizationId: string;
  kind: AlertKind;
  batchId: string | null;
  bloodGroup: string;
  component: BloodComponent;
  quantity: number;
  expiresAt: Date | null;
  dedupeKey: string;
  now: Date;
}

async function notifyAlert(input: AlertInput): Promise<void> {
  const recipients = await bankStaff(input.organizationId);
  if (recipients.length === 0) return;

  const settings = await getBankMonitoringSettings(input.organizationId);

  const componentEn = translate("en", COMPONENT_LABEL_KEY[input.component]);
  const componentUr = translate("ur", COMPONENT_LABEL_KEY[input.component]);

  const titleKey =
    input.kind === "expiry" ? "inventory.alert.expiryTitle" : "inventory.alert.lowStockTitle";
  const titleEn = translate("en", titleKey, { group: input.bloodGroup, component: componentEn });
  const titleUr = translate("ur", titleKey, { group: input.bloodGroup, component: componentUr });

  const bodyEn =
    input.kind === "expiry"
      ? translate("en", "inventory.alert.expiryBody", {
          units: input.quantity,
          date: formatDate(input.expiresAt, "en"),
        })
      : translate("en", "inventory.alert.lowStockBody", { units: input.quantity });
  const bodyUr =
    input.kind === "expiry"
      ? translate("ur", "inventory.alert.expiryBody", {
          units: input.quantity,
          date: formatDate(input.expiresAt, "ur"),
        })
      : translate("ur", "inventory.alert.lowStockBody", { units: input.quantity });

  for (const member of recipients) {
    await createNotification({
      userId: member.id,
      category: "general",
      titleEn,
      titleUr,
      bodyEn,
      bodyUr,
      link: input.batchId ? `/bank/inventory/${input.batchId}` : "/bank/inventory",
    });

    // 7.5: optional SMS, only when the bank turned it on (A-32). The messaging
    // adapter falls back to the Dev Outbox when no provider is configured.
    if (settings.smsAlerts && member.phone) {
      const prefersUrdu = member.preferredLanguage === "ur";
      const title = prefersUrdu ? titleUr : titleEn;
      const body = prefersUrdu ? bodyUr : bodyEn;
      await sendSms(member.phone, `${title} - ${body}`);
    }
  }
}

/**
 * FR-MON-05 / A-32: one active alert per condition; a repeat is allowed only after
 * 24 hours, or immediately when the condition changes (a different batch, or a
 * different quantity). Acknowledging silences the condition for the same window.
 */
async function raiseAlert(input: AlertInput): Promise<boolean> {
  const latest = await query<{
    id: string;
    status: string;
    quantity: number | string;
    last_raised_at: Date | string;
  }>(
    `SELECT id, status, quantity, last_raised_at
       FROM stock_alerts
      WHERE organization_id = $1
        AND dedupe_key = $2
      ORDER BY raised_at DESC
      LIMIT 1`,
    [input.organizationId, input.dedupeKey],
  );

  const current = latest.rows[0];
  let notify = false;

  if (current && current.status === "active") {
    // Keep the displayed quantity current without re-notifying.
    if (Number(current.quantity) !== input.quantity) {
      await query(`UPDATE stock_alerts SET quantity = $2 WHERE id = $1`, [
        current.id,
        input.quantity,
      ]);
    }
    if (shouldRaiseAlert(current.last_raised_at, input.now)) {
      await query(`UPDATE stock_alerts SET last_raised_at = now() WHERE id = $1`, [current.id]);
      notify = true;
    }
  } else if (!current || shouldRaiseAlert(current.last_raised_at, input.now)) {
    await query(
      `INSERT INTO stock_alerts
         (organization_id, alert_type, batch_id, blood_group, component,
          quantity, expires_at, dedupe_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        input.organizationId,
        input.kind,
        input.batchId,
        input.bloodGroup,
        input.component,
        input.quantity,
        input.expiresAt ? input.expiresAt.toISOString() : null,
        input.dedupeKey,
      ],
    );
    notify = true;
  }

  if (notify) await notifyAlert(input);
  return notify;
}

/** 7.1 + 7.2 + 7.3 + FR-MON-06. Safe to call often: every step is idempotent. */
export async function runMonitoringSweep(
  organizationId: string,
  now: Date = new Date(),
): Promise<SweepResult> {
  await releaseExpiredHolds(organizationId);

  // --- 7.2: mark batches whose expiry date and time have passed -------------
  let expired = 0;
  const overdue = await query<ExpiringBatchRow>(
    `SELECT id, units, blood_group, component, expires_at
       FROM inventory_batches
      WHERE organization_id = $1
        AND expires_at <= $2
        AND units > 0`,
    [organizationId, now.toISOString()],
  );

  for (const batch of overdue.rows) {
    const written = await transaction(async (tx) => {
      const current = await tx.query<{ units: number | string }>(
        `SELECT units
           FROM inventory_batches
          WHERE id = $1
            AND organization_id = $2
          FOR UPDATE`,
        [batch.id, organizationId],
      );
      const units = Number(current.rows[0]?.units ?? 0);
      if (units <= 0) return false;

      await tx.query(
        `UPDATE inventory_batches
            SET units = 0,
                updated_at = now()
          WHERE id = $1
            AND organization_id = $2`,
        [batch.id, organizationId],
      );

      await tx.query(
        `INSERT INTO inventory_movements
           (batch_id, organization_id, movement_type, quantity, note)
         VALUES ($1, $2, 'expired', $3, $4)`,
        [batch.id, organizationId, movementDelta("expired", units), JSON.stringify({ auto: true })],
      );

      return true;
    });

    if (written) {
      expired += 1;
      await query(
        `UPDATE stock_alerts
            SET status = 'resolved'
          WHERE organization_id = $1
            AND batch_id = $2
            AND status = 'active'`,
        [organizationId, batch.id],
      );
    }
  }

  // A batch holding no units, or an archived one, cannot have an active alert.
  await query(
    `UPDATE stock_alerts a
        SET status = 'resolved'
       FROM inventory_batches b
      WHERE a.batch_id = b.id
        AND a.organization_id = $1
        AND a.status = 'active'
        AND (b.units <= 0 OR b.archived_at IS NOT NULL)`,
    [organizationId],
  );

  const settings = await getBankMonitoringSettings(organizationId);
  let alertsRaised = 0;

  // --- 7.1: approved batches inside their expiry warning window -------------
  const expiring = await query<ExpiringBatchRow>(
    `SELECT id, units, blood_group, component, expires_at
       FROM inventory_batches
      WHERE organization_id = $1
        AND status = 'approved'
        AND units > 0
        AND expires_at > $2
      ORDER BY expires_at ASC`,
    [organizationId, now.toISOString()],
  );

  const expiringKeys = new Set<string>();

  for (const batch of expiring.rows) {
    const expiresAt = toDate(batch.expires_at);
    const component = batch.component as BloodComponent;
    if (!expiresAt) continue;
    if (!isExpiringSoon(expiresAt, component, now, settings.expiryWarningDays)) continue;

    const dedupeKey = alertDedupeKey({
      type: "expiry",
      batchId: batch.id,
      bloodGroup: batch.blood_group,
      component: batch.component,
    });
    expiringKeys.add(dedupeKey);

    const raised = await raiseAlert({
      organizationId,
      kind: "expiry",
      batchId: batch.id,
      bloodGroup: batch.blood_group,
      component,
      quantity: Number(batch.units),
      expiresAt,
      dedupeKey,
      now,
    });
    if (raised) alertsRaised += 1;
  }

  // Raise the window, then close warnings whose batch is no longer in it (for
  // example the status changed to Rejected, or the expiry date was corrected).
  const activeExpiry = await query<{ id: string; dedupe_key: string }>(
    `SELECT id, dedupe_key
       FROM stock_alerts
      WHERE organization_id = $1
        AND status = 'active'
        AND alert_type = 'expiry'`,
    [organizationId],
  );
  for (const alert of activeExpiry.rows) {
    if (!expiringKeys.has(alert.dedupe_key)) {
      await query(`UPDATE stock_alerts SET status = 'resolved' WHERE id = $1`, [alert.id]);
    }
  }

  // --- 7.3: low stock per blood group + component ---------------------------
  const stock = await query<{
    blood_group: string;
    component: string;
    units: number | string;
    reserved: number | string;
  }>(
    `SELECT b.blood_group,
            b.component,
            SUM(b.units) AS units,
            COALESCE(SUM(r.reserved), 0) AS reserved
       FROM inventory_batches b
       LEFT JOIN (
         SELECT batch_id, SUM(units) AS reserved
           FROM inventory_reservations
          WHERE status = 'active'
            AND hold_until > now()
          GROUP BY batch_id
       ) r ON r.batch_id = b.id
      WHERE b.organization_id = $1
        AND b.archived_at IS NULL
        AND b.status = 'approved'
        AND b.expires_at > $2
      GROUP BY b.blood_group, b.component`,
    [organizationId, now.toISOString()],
  );

  const thresholds = await getStockThresholds(organizationId);
  const available = new Map<string, { bloodGroup: string; component: string; units: number }>();

  for (const row of stock.rows) {
    available.set(`${row.blood_group}|${row.component}`, {
      bloodGroup: row.blood_group,
      component: row.component,
      units: Math.max(0, Number(row.units) - Number(row.reserved)),
    });
  }

  // A combination the bank set a threshold for is watched even with zero stock.
  for (const threshold of thresholds) {
    const key = `${threshold.bloodGroup}|${threshold.component}`;
    if (!available.has(key)) {
      available.set(key, {
        bloodGroup: threshold.bloodGroup,
        component: threshold.component,
        units: 0,
      });
    }
  }

  const lowKeys = new Set<string>();

  for (const item of available.values()) {
    const threshold = thresholdFor(thresholds, item.bloodGroup, item.component);
    if (!isLowStock(item.units, threshold)) continue;

    const dedupeKey = alertDedupeKey({
      type: "low_stock",
      bloodGroup: item.bloodGroup,
      component: item.component,
    });
    lowKeys.add(dedupeKey);

    const raised = await raiseAlert({
      organizationId,
      kind: "low_stock",
      batchId: null,
      bloodGroup: item.bloodGroup,
      component: item.component as BloodComponent,
      quantity: item.units,
      expiresAt: null,
      dedupeKey,
      now,
    });
    if (raised) alertsRaised += 1;
  }

  // Stock was refilled or the threshold was lowered: close the stale warning.
  const activeLow = await query<{ id: string; dedupe_key: string }>(
    `SELECT id, dedupe_key
       FROM stock_alerts
      WHERE organization_id = $1
        AND status = 'active'
        AND alert_type = 'low_stock'`,
    [organizationId],
  );
  for (const alert of activeLow.rows) {
    if (!lowKeys.has(alert.dedupe_key)) {
      await query(`UPDATE stock_alerts SET status = 'resolved' WHERE id = $1`, [alert.id]);
    }
  }

  await query(
    `INSERT INTO bank_monitoring_settings (organization_id, last_sweep_at)
     VALUES ($1, now())
     ON CONFLICT (organization_id)
     DO UPDATE SET last_sweep_at = now()`,
    [organizationId],
  );

  return { expired, alertsRaised };
}

export interface StockAlertView {
  id: string;
  type: AlertKind;
  batchId: string | null;
  bloodGroup: string;
  component: string;
  quantity: number;
  expiresAt: string | null;
  raisedAt: string;
}

/** Active alerts for B-01. */
export async function listActiveAlerts(organizationId: string): Promise<StockAlertView[]> {
  const result = await query<{
    id: string;
    alert_type: AlertKind;
    batch_id: string | null;
    blood_group: string;
    component: string;
    quantity: number | string;
    expires_at: Date | string | null;
    raised_at: Date | string;
  }>(
    `SELECT id, alert_type, batch_id, blood_group, component, quantity, expires_at, raised_at
       FROM stock_alerts
      WHERE organization_id = $1
        AND status = 'active'
      ORDER BY expires_at ASC NULLS LAST, raised_at DESC`,
    [organizationId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.alert_type,
    batchId: row.batch_id,
    bloodGroup: row.blood_group,
    component: row.component,
    quantity: Number(row.quantity),
    expiresAt: row.expires_at ? (toDate(row.expires_at)?.toISOString() ?? null) : null,
    raisedAt: (toDate(row.raised_at) ?? new Date(0)).toISOString(),
  }));
}

/** 7.4: the bank has seen this alert. It will not nag again for 24 hours. */
export async function acknowledgeAlert(input: {
  organizationId: string;
  actorUserId: string;
  alertId: string;
}): Promise<void> {
  const result = await query<{ id: string }>(
    `UPDATE stock_alerts
        SET status = 'acknowledged',
            acknowledged_by = $3,
            acknowledged_at = now()
      WHERE id = $1
        AND organization_id = $2
        AND status = 'active'
      RETURNING id`,
    [input.alertId, input.organizationId, input.actorUserId],
  );

  if (result.rows.length === 0) throw new Error("alert_not_found");
}

/**
 * FR-MON-06: any page in the blood-bank area refreshes monitoring, but at most
 * once an hour. Inventory changes still sweep immediately - they call
 * `runMonitoringSweep` directly - so an alert follows a change within seconds,
 * while an idle bank is re-evaluated hourly on its next page view.
 */
export async function ensureMonitoringFresh(
  organizationId: string,
  now: Date = new Date(),
): Promise<SweepResult | null> {
  const settings = await getBankMonitoringSettings(organizationId);
  if (!sweepDue(settings.lastSweepAt, now)) return null;
  return runMonitoringSweep(organizationId, now);
}
