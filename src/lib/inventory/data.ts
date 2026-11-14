import "server-only";

import { query, transaction } from "@/lib/db";
import {
  availableFromCounts,
  diffBatch,
  manualMovementDelta,
  movementDelta,
  reservationHoldUntil,
  toDate,
  type BatchChange,
  type BatchValues,
  type BloodComponent,
  type BloodGroup,
  type MovementType,
  type MovementValues,
  type TestingStatus,
} from "./rules";

/**
 * Database access for blood-bank inventory (Module 4).
 *
 * Screens and API routes call these functions; the arithmetic itself stays in
 * `./rules` so the list, the dashboard and the hospital search cannot disagree.
 */

/** A batch as the screens need it: stored columns plus the derived quantities. */
export interface InventoryBatchView {
  id: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  units: number;
  reservedUnits: number;
  availableUnits: number;
  status: TestingStatus;
  expiresAt: string;
}

export interface InventoryMovementView {
  id: string;
  type: MovementType;
  quantity: number;
  note: string | null;
  /** 4.7: the blood bank that received a transfer out. */
  relatedOrganizationName: string | null;
  actorName: string | null;
  createdAt: string;
}

export interface InventoryBatchDetail extends InventoryBatchView {
  createdByName: string | null;
  createdAt: string;
  /** 4.4 soft delete: the batch is hidden from the list but its history stays. */
  archivedAt: string | null;
}

interface BatchQueryRow {
  id: string;
  blood_group: string;
  component: string;
  units: number | string;
  status: string;
  expires_at: Date | string;
  reserved_units: number | string | null;
}

/** Shared projection: stored columns + the active reserved quantity. */
const BATCH_SELECT = `
  SELECT b.id,
         b.blood_group,
         b.component,
         b.units,
         b.status,
         b.expires_at,
         COALESCE(r.reserved_units, 0) AS reserved_units
    FROM inventory_batches b
    LEFT JOIN (
      SELECT batch_id, SUM(units) AS reserved_units
        FROM inventory_reservations
       WHERE status = 'active'
         AND hold_until > now()
       GROUP BY batch_id
    ) r ON r.batch_id = b.id
`;

function toView(row: BatchQueryRow): InventoryBatchView {
  const units = Number(row.units);
  const reservedUnits = Number(row.reserved_units ?? 0);
  return {
    id: row.id,
    bloodGroup: row.blood_group as BloodGroup,
    component: row.component as BloodComponent,
    units,
    reservedUnits,
    availableUnits: availableFromCounts(units, reservedUnits),
    status: row.status as TestingStatus,
    expiresAt: (toDate(row.expires_at) ?? new Date(0)).toISOString(),
  };
}

/**
 * B-02 (FR-INV-02, FR-INV-04): every batch of one blood bank.
 *
 * Reserved units come from one aggregate over reservations that are still
 * active and have not passed their hold, so the number matches what
 * `activeReservedUnits` would compute from the rows.
 */
export async function listBatches(organizationId: string): Promise<InventoryBatchView[]> {
  // A hold that has run out stops counting the moment anyone looks (FR-INV-04).
  await releaseExpiredHolds(organizationId);

  const result = await query<BatchQueryRow>(
    `${BATCH_SELECT}
      WHERE b.organization_id = $1
        AND b.archived_at IS NULL
      ORDER BY b.expires_at ASC, b.created_at DESC`,
    [organizationId],
  );

  return result.rows.map(toView);
}

/**
 * 4.1 (FR-INV-01, FR-INV-03): create a batch and its `Added` movement in one
 * transaction. If either insert fails, neither is stored.
 */
export async function createBatch(input: {
  organizationId: string;
  actorUserId: string;
  values: BatchValues;
}): Promise<string> {
  const { organizationId, actorUserId, values } = input;

  return transaction(async (tx) => {
    const inserted = await tx.query<{ id: string }>(
      `INSERT INTO inventory_batches
         (organization_id, blood_group, component, units, status, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        organizationId,
        values.bloodGroup,
        values.component,
        values.units,
        values.status,
        values.expiresAt.toISOString(),
        actorUserId,
      ],
    );

    const batchId = inserted.rows[0]?.id;
    if (!batchId) throw new Error("batch_insert_failed");

    // A zero-unit batch has no movement to record for its quantity.
    if (values.units > 0) {
      await tx.query(
        `INSERT INTO inventory_movements
           (batch_id, organization_id, movement_type, quantity, actor_user_id)
         VALUES ($1, $2, 'added', $3, $4)`,
        [batchId, organizationId, values.units, actorUserId],
      );
    }

    return batchId;
  });
}

interface MovementQueryRow {
  id: string;
  movement_type: string;
  quantity: number | string;
  note: string | null;
  created_at: Date | string;
  actor_name: string | null;
  related_organization_name: string | null;
}

/**
 * B-04 (FR-INV-03/05/06): one batch of this blood bank plus its movement
 * history. Returns null when the batch does not exist *or* belongs to another
 * organization, so a bank can never read another bank's stock (A-12).
 */
export async function getBatch(
  organizationId: string,
  batchId: string,
): Promise<{ batch: InventoryBatchDetail; movements: InventoryMovementView[] } | null> {
  await releaseExpiredHolds(organizationId);

  const found = await query<
    BatchQueryRow & {
      created_at: Date | string;
      created_by_name: string | null;
      archived_at: Date | string | null;
    }
  >(
    `SELECT b.id, b.blood_group, b.component, b.units, b.status, b.expires_at,
            b.created_at, b.archived_at, u.full_name AS created_by_name,
            COALESCE(r.reserved_units, 0) AS reserved_units
       FROM inventory_batches b
       LEFT JOIN users u ON u.id = b.created_by
       LEFT JOIN (
         SELECT batch_id, SUM(units) AS reserved_units
           FROM inventory_reservations
          WHERE status = 'active'
            AND hold_until > now()
          GROUP BY batch_id
       ) r ON r.batch_id = b.id
      WHERE b.id = $1
        AND b.organization_id = $2`,
    [batchId, organizationId],
  );

  const row = found.rows[0];
  if (!row) return null;

  const movements = await query<MovementQueryRow>(
    `SELECT m.id, m.movement_type, m.quantity, m.note, m.created_at,
            u.full_name AS actor_name,
            ro.name AS related_organization_name
       FROM inventory_movements m
       LEFT JOIN users u ON u.id = m.actor_user_id
       LEFT JOIN organizations ro ON ro.id = m.related_organization_id
      WHERE m.batch_id = $1
        AND m.organization_id = $2
      ORDER BY m.created_at DESC, m.id DESC`,
    [batchId, organizationId],
  );

  return {
    batch: {
      ...toView(row),
      createdByName: row.created_by_name,
      createdAt: (toDate(row.created_at) ?? new Date(0)).toISOString(),
      archivedAt: row.archived_at
        ? (toDate(row.archived_at)?.toISOString() ?? null)
        : null,
    },
    movements: movements.rows.map((movement) => ({
      id: movement.id,
      type: movement.movement_type as MovementType,
      quantity: Number(movement.quantity),
      note: movement.note,
      relatedOrganizationName: movement.related_organization_name,
      actorName: movement.actor_name,
      createdAt: (toDate(movement.created_at) ?? new Date(0)).toISOString(),
    })),
  };
}

export interface UpdateBatchResult {
  changed: boolean;
  changes: Record<string, BatchChange>;
}

/** The stored expiry of one batch of this bank, or null when it is not theirs. */
export async function getBatchExpiry(
  organizationId: string,
  batchId: string,
): Promise<Date | null> {
  const found = await query<{ expires_at: Date | string }>(
    `SELECT expires_at
       FROM inventory_batches
      WHERE id = $1
        AND organization_id = $2`,
    [batchId, organizationId],
  );
  const row = found.rows[0];
  return row ? toDate(row.expires_at) : null;
}

/** The units a batch currently holds, or null when it is not this bank's batch. */
export async function getBatchUnits(
  organizationId: string,
  batchId: string,
): Promise<number | null> {
  const found = await query<{ units: number | string }>(
    `SELECT units
       FROM inventory_batches
      WHERE id = $1
        AND organization_id = $2`,
    [batchId, organizationId],
  );
  const row = found.rows[0];
  return row ? Number(row.units) : null;
}

export interface ManualMovementResult {
  changed: boolean;
  unitsBefore: number;
  unitsAfter: number;
}

/**
 * 4.4 (FR-INV-05, FR-MON-02, DR-05): issue, discard, expire or correct units.
 *
 * The batch quantity and the movement row are written in one transaction, and
 * the batch is never deleted. The movement quantity is the signed difference, so
 * `Added +6`, `Issued -2`, `Correction +1` always explain the current total.
 */
export async function recordManualMovement(input: {
  organizationId: string;
  actorUserId: string;
  batchId: string;
  values: MovementValues;
}): Promise<ManualMovementResult> {
  const { organizationId, actorUserId, batchId, values } = input;

  return transaction(async (tx) => {
    const found = await tx.query<{ units: number | string }>(
      `SELECT units
         FROM inventory_batches
        WHERE id = $1
          AND organization_id = $2
        FOR UPDATE`,
      [batchId, organizationId],
    );

    const row = found.rows[0];
    if (!row) throw new Error("batch_not_found");

    const current = Number(row.units);
    const delta = manualMovementDelta(current, values.type, values.units);
    if (delta === null) throw new Error("invalid_quantity");
    if (delta === 0) return { changed: false, unitsBefore: current, unitsAfter: current };

    const after = current + delta;

    await tx.query(
      `UPDATE inventory_batches
          SET units = $3,
              updated_at = now()
        WHERE id = $1
          AND organization_id = $2`,
      [batchId, organizationId, after],
    );

    await tx.query(
      `INSERT INTO inventory_movements
         (batch_id, organization_id, movement_type, quantity, note, actor_user_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [batchId, organizationId, values.type, delta, values.note, actorUserId],
    );

    return { changed: true, unitsBefore: current, unitsAfter: after };
  });
}

// ---------------------------------------------------------------------------
// 4.6 / FR-INV-04 / A-10: reservations
// ---------------------------------------------------------------------------

export interface ReservationView {
  id: string;
  units: number;
  holdUntil: string;
  createdAt: string;
  createdByName: string | null;
}

/**
 * A hold that passed its `hold_until` stops counting immediately; the row is
 * marked released and a `Reservation released` movement is written so the
 * history still explains the quantity.
 *
 * This runs before a batch or the list is read, which is how the automatic
 * release works without a background worker. Module 7 adds the hourly sweep on
 * top (FR-MON-06).
 */
export async function releaseExpiredHolds(organizationId: string): Promise<number> {
  const expired = await query<{ id: string; batch_id: string; units: number | string }>(
    `UPDATE inventory_reservations
        SET status = 'released',
            released_at = now()
      WHERE organization_id = $1
        AND status = 'active'
        AND hold_until <= now()
      RETURNING id, batch_id, units`,
    [organizationId],
  );

  for (const row of expired.rows) {
    await query(
      `INSERT INTO inventory_movements
         (batch_id, organization_id, movement_type, quantity, note)
       VALUES ($1, $2, 'reservation_released', $3, $4)`,
      [
        row.batch_id,
        organizationId,
        movementDelta("reservation_released", Number(row.units)),
        JSON.stringify({ auto: true }),
      ],
    );
  }

  return expired.rows.length;
}

/** The holds still in force on one batch (FR-INV-04). */
export async function listReservations(
  organizationId: string,
  batchId: string,
): Promise<ReservationView[]> {
  const result = await query<{
    id: string;
    units: number | string;
    hold_until: Date | string;
    created_at: Date | string;
    created_by_name: string | null;
  }>(
    `SELECT r.id, r.units, r.hold_until, r.created_at, u.full_name AS created_by_name
       FROM inventory_reservations r
       LEFT JOIN users u ON u.id = r.created_by
      WHERE r.organization_id = $1
        AND r.batch_id = $2
        AND r.status = 'active'
        AND r.hold_until > now()
      ORDER BY r.hold_until ASC`,
    [organizationId, batchId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    units: Number(row.units),
    holdUntil: (toDate(row.hold_until) ?? new Date(0)).toISOString(),
    createdAt: (toDate(row.created_at) ?? new Date(0)).toISOString(),
    createdByName: row.created_by_name,
  }));
}

/**
 * Sets units aside for a period the bank chooses (A-10, default 6 hours) and
 * records a `Reserved` movement. Never more than the units currently free.
 */
export async function createReservation(input: {
  organizationId: string;
  actorUserId: string;
  batchId: string;
  units: number;
  holdHours: number;
}): Promise<{ id: string; holdUntil: string }> {
  const { organizationId, actorUserId, batchId, units, holdHours } = input;

  return transaction(async (tx) => {
    const batch = await tx.query<{ units: number | string }>(
      `SELECT units
         FROM inventory_batches
        WHERE id = $1
          AND organization_id = $2
        FOR UPDATE`,
      [batchId, organizationId],
    );
    const row = batch.rows[0];
    if (!row) throw new Error("batch_not_found");

    const reserved = await tx.query<{ reserved: number | string }>(
      `SELECT COALESCE(SUM(units), 0) AS reserved
         FROM inventory_reservations
        WHERE batch_id = $1
          AND status = 'active'
          AND hold_until > now()`,
      [batchId],
    );

    const free = Number(row.units) - Number(reserved.rows[0]?.reserved ?? 0);
    if (units > free) throw new Error("not_enough_units");

    const holdUntil = reservationHoldUntil(new Date(), holdHours);

    const inserted = await tx.query<{ id: string }>(
      `INSERT INTO inventory_reservations
         (batch_id, organization_id, units, hold_until, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [batchId, organizationId, units, holdUntil.toISOString(), actorUserId],
    );

    const id = inserted.rows[0]?.id;
    if (!id) throw new Error("reservation_insert_failed");

    await tx.query(
      `INSERT INTO inventory_movements
         (batch_id, organization_id, movement_type, quantity, actor_user_id)
       VALUES ($1, $2, 'reserved', $3, $4)`,
      [batchId, organizationId, movementDelta("reserved", units), actorUserId],
    );

    return { id, holdUntil: holdUntil.toISOString() };
  });
}

/** Releases a hold before its time is up, recording the matching movement. */
export async function releaseReservation(input: {
  organizationId: string;
  actorUserId: string;
  reservationId: string;
}): Promise<{ batchId: string }> {
  const { organizationId, actorUserId, reservationId } = input;

  return transaction(async (tx) => {
    const found = await tx.query<{
      id: string;
      batch_id: string;
      units: number | string;
      status: string;
    }>(
      `SELECT id, batch_id, units, status
         FROM inventory_reservations
        WHERE id = $1
          AND organization_id = $2
        FOR UPDATE`,
      [reservationId, organizationId],
    );

    const row = found.rows[0];
    if (!row) throw new Error("reservation_not_found");
    if (row.status !== "active") throw new Error("reservation_not_active");

    await tx.query(
      `UPDATE inventory_reservations
          SET status = 'released',
              released_at = now()
        WHERE id = $1`,
      [row.id],
    );

    await tx.query(
      `INSERT INTO inventory_movements
         (batch_id, organization_id, movement_type, quantity, actor_user_id)
       VALUES ($1, $2, 'reservation_released', $3, $4)`,
      [
        row.batch_id,
        organizationId,
        movementDelta("reservation_released", Number(row.units)),
        actorUserId,
      ],
    );

    return { batchId: row.batch_id };
  });
}

// ---------------------------------------------------------------------------
// 4.7 / FR-INV-06 / A-11: transfers out
// ---------------------------------------------------------------------------

export interface TransferTarget {
  id: string;
  name: string;
  area: string | null;
}

/** Other VERIFIED blood banks a transfer can be sent to (FR-INV-06). */
export async function listTransferTargets(organizationId: string): Promise<TransferTarget[]> {
  const result = await query<{ id: string; name: string; area: string | null }>(
    `SELECT id, name, area
       FROM organizations
      WHERE type = 'blood_bank'
        AND verification_status = 'verified'
        AND id <> $1
      ORDER BY name ASC`,
    [organizationId],
  );

  return result.rows;
}

/**
 * Records units transferred out to another verified blood bank and reduces this
 * bank's batch. Wasl never moves stock itself: the receiving bank records its own
 * incoming batch (A-11, BR-4).
 */
export async function transferOut(input: {
  organizationId: string;
  actorUserId: string;
  batchId: string;
  units: number;
  receivingOrganizationId: string;
  note: string | null;
}): Promise<{ unitsAfter: number }> {
  const { organizationId, actorUserId, batchId, units, receivingOrganizationId, note } = input;

  return transaction(async (tx) => {
    // The receiving side must be another verified blood bank.
    const target = await tx.query<{ id: string }>(
      `SELECT id
         FROM organizations
        WHERE id = $1
          AND type = 'blood_bank'
          AND verification_status = 'verified'
          AND id <> $2`,
      [receivingOrganizationId, organizationId],
    );
    if (target.rows.length === 0) throw new Error("invalid_receiving_bank");

    const found = await tx.query<{ units: number | string }>(
      `SELECT units
         FROM inventory_batches
        WHERE id = $1
          AND organization_id = $2
        FOR UPDATE`,
      [batchId, organizationId],
    );
    const row = found.rows[0];
    if (!row) throw new Error("batch_not_found");

    const current = Number(row.units);
    if (units > current) throw new Error("not_enough_units");
    const after = current - units;

    await tx.query(
      `UPDATE inventory_batches
          SET units = $3,
              updated_at = now()
        WHERE id = $1
          AND organization_id = $2`,
      [batchId, organizationId, after],
    );

    await tx.query(
      `INSERT INTO inventory_movements
         (batch_id, organization_id, movement_type, quantity, note,
          related_organization_id, actor_user_id)
       VALUES ($1, $2, 'transferred_out', $3, $4, $5, $6)`,
      [
        batchId,
        organizationId,
        movementDelta("transferred_out", units),
        note,
        receivingOrganizationId,
        actorUserId,
      ],
    );

    return { unitsAfter: after };
  });
}

/**
 * 4.4 soft delete: an empty batch can be "removed" from the working list without
 * losing its history. The row stays, `archived_at` hides it from B-02, and the
 * detail page still opens so the movements remain auditable (DR-05).
 */
export async function archiveBatch(input: {
  organizationId: string;
  actorUserId: string;
  batchId: string;
}): Promise<{ archived: boolean }> {
  const { organizationId, batchId } = input;

  return transaction(async (tx) => {
    const found = await tx.query<{
      units: number | string;
      archived_at: Date | string | null;
    }>(
      `SELECT units, archived_at
         FROM inventory_batches
        WHERE id = $1
          AND organization_id = $2
        FOR UPDATE`,
      [batchId, organizationId],
    );

    const row = found.rows[0];
    if (!row) throw new Error("batch_not_found");
    if (row.archived_at) return { archived: false };
    if (Number(row.units) > 0) throw new Error("batch_not_empty");

    await tx.query(
      `UPDATE inventory_batches
          SET archived_at = now(),
              updated_at = now()
        WHERE id = $1
          AND organization_id = $2`,
      [batchId, organizationId],
    );

    // An archived batch can no longer raise a warning.
    await tx.query(
      `UPDATE stock_alerts
          SET status = 'resolved'
        WHERE organization_id = $1
          AND batch_id = $2
          AND status = 'active'`,
      [organizationId, batchId],
    );

    return { archived: true };
  });
}

/**
 * 4.3 (FR-INV-03): edit a batch and record the change as one `Correction`
 * movement. The movement quantity is the signed difference in units, so a
 * status-only edit records 0 and the note carries what changed.
 */
export async function updateBatch(input: {
  organizationId: string;
  actorUserId: string;
  batchId: string;
  values: BatchValues;
}): Promise<UpdateBatchResult> {
  const { organizationId, actorUserId, batchId, values } = input;

  return transaction(async (tx) => {
    const found = await tx.query<{
      blood_group: string;
      component: string;
      units: number | string;
      status: string;
      expires_at: Date | string;
    }>(
      `SELECT blood_group, component, units, status, expires_at
         FROM inventory_batches
        WHERE id = $1
          AND organization_id = $2
        FOR UPDATE`,
      [batchId, organizationId],
    );

    const current = found.rows[0];
    if (!current) throw new Error("batch_not_found");

    const changes = diffBatch(
      {
        bloodGroup: current.blood_group,
        component: current.component,
        units: Number(current.units),
        status: current.status,
        expiresAt: current.expires_at,
      },
      values,
    );

    if (Object.keys(changes).length === 0) {
      return { changed: false, changes };
    }

    await tx.query(
      `UPDATE inventory_batches
          SET blood_group = $3,
              component = $4,
              units = $5,
              status = $6,
              expires_at = $7,
              updated_at = now()
        WHERE id = $1
          AND organization_id = $2`,
      [
        batchId,
        organizationId,
        values.bloodGroup,
        values.component,
        values.units,
        values.status,
        values.expiresAt.toISOString(),
      ],
    );

    const unitsChange = changes.units ? values.units - Number(current.units) : 0;

    await tx.query(
      `INSERT INTO inventory_movements
         (batch_id, organization_id, movement_type, quantity, note, actor_user_id)
       VALUES ($1, $2, 'correction', $3, $4, $5)`,
      [batchId, organizationId, unitsChange, JSON.stringify(changes), actorUserId],
    );

    return { changed: true, changes };
  });
}
