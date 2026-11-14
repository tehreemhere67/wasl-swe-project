/**
 * Blood-bank inventory rules (Module 4) and expiry / low-stock monitoring rules
 * (Module 7).
 *
 * Deliberately framework-free and database-free, so that every rule below can be
 * unit-tested directly with `node:test` (see `tests/member-3/unit`). The API
 * routes and the screens call these functions; none of them re-implements the
 * maths, which is what keeps B-01, B-02, B-04 and the hospital search agreeing
 * with each other.
 *
 * SRS references:
 *  - FR-INV-01  record a batch; negative units and a past expiry are rejected
 *  - FR-INV-02  only Approved units count as available
 *  - FR-INV-04  reservations reduce availability (A-10: default hold 6 hours)
 *  - FR-INV-08  expired / unapproved / reserved / unverified never count
 *  - FR-MON-01  default warning windows (A-31)
 *  - FR-MON-03/04 low stock at or below the threshold; default 5 units (A-05)
 *  - FR-MON-05  the same alert is not repeated within 24 hours (A-32)
 *  - FR-MON-06  evaluate at least hourly, and within 1 minute of a change
 *  - DR-01      quantities are never negative; expiry dates are valid
 */

import {
  BLOOD_COMPONENTS,
  BLOOD_GROUPS,
  type BloodComponent,
  type BloodGroup,
} from "../validation";

/** Re-exported so the inventory module imports its controlled values from one place. */
export type { BloodComponent, BloodGroup };
export { BLOOD_COMPONENTS, BLOOD_GROUPS };

// ---------------------------------------------------------------------------
// Controlled values (SRS 4.2)
// ---------------------------------------------------------------------------

/** A-09: testing and approval status is entered by staff; Wasl never tests blood. */
export const TESTING_STATUSES = ["awaiting_testing", "approved", "rejected"] as const;
export type TestingStatus = (typeof TESTING_STATUSES)[number];

/** A-08: the only movement types the SRS allows. */
export const MOVEMENT_TYPES = [
  "added",
  "reserved",
  "reservation_released",
  "issued",
  "transferred_out",
  "expired",
  "discarded",
  "correction",
] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

// ---------------------------------------------------------------------------
// Defaults (SRS assumptions)
// ---------------------------------------------------------------------------

/** A-31 / FR-MON-01: days before expiry at which a batch starts warning. */
export const DEFAULT_EXPIRY_WARNING_DAYS: Record<BloodComponent, number> = {
  Platelets: 2,
  "Whole blood": 7,
  "Red blood cells": 7,
  Plasma: 30,
};

/** A-05 / FR-MON-04: used until the blood bank sets its own threshold. */
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/** A-32 / FR-MON-05: an alert is not repeated more than once in this window. */
export const ALERT_REPEAT_HOURS = 24;

/** A-10 / FR-INV-04: default reservation hold. */
export const RESERVATION_HOLD_HOURS = 6;

/** FR-MON-06: the monitoring sweep must run at least this often. */
export const MONITORING_INTERVAL_MINUTES = 60;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Karachi has no daylight saving, so a fixed offset is correct (NFR-LOC-05). */
const PKT_OFFSET = "+05:00";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** Accepts a Date or an ISO string and returns a valid Date, or null. */
export function toDate(value: Date | string | null | undefined): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parses what the batch form sends. A date-only value (`2026-11-12`) means the
 * end of that day in Pakistan time, so a batch does not expire at midnight UTC
 * in the middle of the previous evening.
 */
export function parseExpiry(value: string | null | undefined): Date | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const endOfDay = new Date(`${trimmed}T23:59:59.999${PKT_OFFSET}`);
    return Number.isNaN(endOfDay.getTime()) ? null : endOfDay;
  }
  return toDate(trimmed);
}

// ---------------------------------------------------------------------------
// FR-INV-01: validating a batch
// ---------------------------------------------------------------------------

export interface InventoryFieldError {
  field: string;
  /** A stable code the page translates (never a hard-coded English sentence). */
  code: string;
}

export interface BatchInput {
  bloodGroup?: string;
  component?: string;
  units?: string | number;
  status?: string;
  expiresAt?: string;
}

export interface BatchValues {
  bloodGroup: BloodGroup;
  component: BloodComponent;
  units: number;
  status: TestingStatus;
  expiresAt: Date;
}

export type BatchValidation =
  | { ok: true; values: BatchValues }
  | { ok: false; errors: InventoryFieldError[] };

function isBloodGroup(value: string): value is BloodGroup {
  return (BLOOD_GROUPS as readonly string[]).includes(value);
}

function isComponent(value: string): value is BloodComponent {
  return (BLOOD_COMPONENTS as readonly string[]).includes(value);
}

function isTestingStatus(value: string): value is TestingStatus {
  return (TESTING_STATUSES as readonly string[]).includes(value);
}

/**
 * FR-INV-01 / DR-01. Accepts raw form input (all strings) and returns either the
 * cleaned values or one error code per bad field.
 *
 * `previousExpiresAt` is used when editing: a batch that is already past its
 * expiry must still be editable (for example to correct its status), so an
 * unchanged past date is accepted. A newly typed past date is always rejected.
 */
export function validateBatchInput(
  input: BatchInput,
  now: Date = new Date(),
  options: { previousExpiresAt?: Date | null } = {},
): BatchValidation {
  const errors: InventoryFieldError[] = [];
  const bloodGroup = (input.bloodGroup ?? "").trim();
  const component = (input.component ?? "").trim();
  const status = (input.status ?? "").trim();
  const rawUnits = typeof input.units === "number" ? input.units : Number((input.units ?? "").trim());
  const expiresAt = parseExpiry(input.expiresAt);

  if (!isBloodGroup(bloodGroup)) {
    errors.push({ field: "bloodGroup", code: "inventory.error.bloodGroup" });
  }
  if (!isComponent(component)) {
    errors.push({ field: "component", code: "inventory.error.component" });
  }
  // DR-01: whole units, never negative.
  if (!Number.isInteger(rawUnits) || rawUnits < 0) {
    errors.push({ field: "units", code: "inventory.error.units" });
  }
  if (!isTestingStatus(status)) {
    errors.push({ field: "status", code: "inventory.error.status" });
  }
  if (!expiresAt) {
    errors.push({ field: "expiresAt", code: "inventory.error.expiryInvalid" });
  } else if (expiresAt.getTime() <= now.getTime()) {
    // FR-INV-01 test: "a past expiry date is rejected".
    const previous = options.previousExpiresAt;
    const unchanged = previous ? expiresAt.getTime() === previous.getTime() : false;
    if (!unchanged) {
      errors.push({ field: "expiresAt", code: "inventory.error.expiryPast" });
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    values: {
      bloodGroup: bloodGroup as BloodGroup,
      component: component as BloodComponent,
      units: rawUnits,
      status: status as TestingStatus,
      expiresAt: expiresAt as Date,
    },
  };
}

// ---------------------------------------------------------------------------
// FR-INV-04 / FR-INV-08: what counts as available
// ---------------------------------------------------------------------------

export interface ReservationLike {
  units: number;
  status: string;
  holdUntil: Date | string;
}

/** A reservation counts only while it is active and its hold has not run out. */
export function isReservationActive(reservation: ReservationLike, now: Date): boolean {
  if (reservation.status !== "active") return false;
  const holdUntil = toDate(reservation.holdUntil);
  return holdUntil !== null && holdUntil.getTime() > now.getTime();
}

/** Units currently set aside for a hospital (FR-INV-04). */
export function activeReservedUnits(
  reservations: readonly ReservationLike[],
  now: Date,
): number {
  let total = 0;
  for (const reservation of reservations) {
    if (isReservationActive(reservation, now)) total += reservation.units;
  }
  return total;
}

/**
 * FR-INV-08: available = units physically held minus units promised elsewhere.
 * Never negative, even if inconsistent data slips in (DR-01).
 *
 * The screens get the reserved figure from one SQL aggregate (see
 * `src/lib/inventory/data.ts`), so this variant takes the count directly.
 */
export function availableFromCounts(units: number, reservedUnits: number): number {
  return Math.max(0, units - reservedUnits);
}

/** FR-INV-08: the same rule, with the reservation rows supplied. */
export function availableUnits(
  units: number,
  reservations: readonly ReservationLike[],
  now: Date,
): number {
  return availableFromCounts(units, activeReservedUnits(reservations, now));
}

export interface BatchAvailabilityInput {
  /** `awaiting_testing` | `approved` | `rejected` */
  status: string;
  expiresAt: Date | string;
  units: number;
  reservations?: readonly ReservationLike[];
  /** FR-INV-08: stock of a non-verified organization is never available. */
  organizationVerified: boolean;
  now: Date;
}

/**
 * The single definition used by the inventory list, the dashboard and the
 * hospital search (FR-INV-02 + FR-INV-08).
 */
export function countsAsAvailable(batch: BatchAvailabilityInput): boolean {
  if (!batch.organizationVerified) return false;
  if (batch.status !== "approved") return false;

  const expiresAt = toDate(batch.expiresAt);
  if (!expiresAt || expiresAt.getTime() <= batch.now.getTime()) return false;

  return availableUnits(batch.units, batch.reservations ?? [], batch.now) > 0;
}

// ---------------------------------------------------------------------------
// FR-MON-01: expiry warning windows
// ---------------------------------------------------------------------------

/** The window this bank uses for this component (A-31 override support). */
export function expiryWarningDays(
  component: BloodComponent,
  overrides?: Partial<Record<BloodComponent, number>>,
): number {
  const custom = overrides?.[component];
  if (typeof custom === "number" && Number.isFinite(custom) && custom >= 0) return custom;
  return DEFAULT_EXPIRY_WARNING_DAYS[component];
}

/** FR-MON-02: expiry date and time have passed. */
export function isExpired(expiresAt: Date | string, now: Date): boolean {
  const expires = toDate(expiresAt);
  return expires !== null && expires.getTime() <= now.getTime();
}

/**
 * FR-MON-01: the batch is still usable but inside its warning window.
 * An already-expired batch is not "expiring soon" - it goes down the FR-MON-02 path.
 */
export function isExpiringSoon(
  expiresAt: Date | string,
  component: BloodComponent,
  now: Date,
  overrides?: Partial<Record<BloodComponent, number>>,
): boolean {
  const expires = toDate(expiresAt);
  if (!expires || expires.getTime() <= now.getTime()) return false;

  const windowMs = expiryWarningDays(component, overrides) * DAY_MS;
  return expires.getTime() - now.getTime() <= windowMs;
}

// ---------------------------------------------------------------------------
// FR-MON-03 / FR-MON-04: low stock
// ---------------------------------------------------------------------------

export interface ThresholdLike {
  bloodGroup: string;
  component: string;
  thresholdUnits: number;
}

/** The bank's own threshold, or the default of 5 (A-05). */
export function thresholdFor(
  thresholds: readonly ThresholdLike[] | undefined,
  bloodGroup: string,
  component: string,
): number {
  const match = thresholds?.find(
    (row) => row.bloodGroup === bloodGroup && row.component === component,
  );
  return match ? match.thresholdUnits : DEFAULT_LOW_STOCK_THRESHOLD;
}

/** FR-MON-03: alert when stock is AT or BELOW the threshold. */
export function isLowStock(available: number, threshold: number): boolean {
  return available <= threshold;
}

// ---------------------------------------------------------------------------
// FR-MON-05: alert identity and the 24-hour no-repeat rule
// ---------------------------------------------------------------------------

export type AlertType = "expiry" | "low_stock";

/**
 * Identifies the condition an alert is about. A different condition (another
 * batch, another blood group) produces a different key, so it is a new alert -
 * that is the "unless the condition changes" half of FR-MON-05.
 */
export function alertDedupeKey(input: {
  type: AlertType;
  batchId?: string | null;
  bloodGroup: string;
  component: string;
}): string {
  if (input.type === "expiry") {
    return `expiry:${input.batchId ?? "unknown"}`;
  }
  return `low_stock:${input.bloodGroup}:${input.component}`;
}

/** A32 / FR-MON-05: has the repeat window passed since this alert was last raised? */
export function shouldRaiseAlert(
  lastRaisedAt: Date | string | null | undefined,
  now: Date,
  repeatHours: number = ALERT_REPEAT_HOURS,
): boolean {
  if (lastRaisedAt === null || lastRaisedAt === undefined) return true;
  const last = toDate(lastRaisedAt);
  if (!last) return true;
  return now.getTime() - last.getTime() >= repeatHours * HOUR_MS;
}

// ---------------------------------------------------------------------------
// FR-INV-03 / FR-INV-05 / FR-INV-06: movements
// ---------------------------------------------------------------------------

/** Reserved / released change what is available, not how much blood is held. */
export function affectsPhysicalUnits(type: MovementType): boolean {
  return type !== "reserved" && type !== "reservation_released";
}

/**
 * The signed effect on AVAILABLE units. `correction` keeps the sign it is given
 * (a correction can add or remove); every other type is applied in the direction
 * its name implies.
 */
export function movementDelta(type: MovementType, quantity: number): number {
  const magnitude = Math.abs(quantity);
  if (type === "added" || type === "reservation_released") return magnitude;
  if (type === "correction") return quantity;
  return -magnitude;
}

/** The signed effect on units physically held in the blood bank. */
export function physicalDelta(type: MovementType, quantity: number): number {
  return affectsPhysicalUnits(type) ? movementDelta(type, quantity) : 0;
}

/**
 * The new `units` value for a batch after a movement, or null when the movement
 * would make the quantity negative (DR-01).
 */
export function nextUnitsAfterMovement(
  currentUnits: number,
  type: MovementType,
  quantity: number,
): number | null {
  const next = currentUnits + physicalDelta(type, quantity);
  return next < 0 ? null : next;
}

/** B-04 renders "+10" / "-2" next to the movement type. */
export function formatMovementQuantity(type: MovementType, quantity: number): string {
  const delta = movementDelta(type, quantity);
  if (delta === 0) return "0"; // a status-only correction
  const sign = delta > 0 ? "+" : "\u2212"; // U+2212 minus, not a hyphen
  return `${sign}${Math.abs(delta)}`;
}

// ---------------------------------------------------------------------------
// FR-INV-03: what changed when a batch is edited
// ---------------------------------------------------------------------------

export interface BatchSnapshot {
  bloodGroup: string;
  component: string;
  units: number;
  status: string;
  expiresAt: Date | string;
}

export interface BatchChange {
  from: string | number;
  to: string | number;
}

/**
 * Compares the stored batch with the submitted values. The result is what the
 * `Correction` movement records, so the history can always say what changed.
 */
export function diffBatch(
  current: BatchSnapshot,
  next: BatchValues,
): Record<string, BatchChange> {
  const changes: Record<string, BatchChange> = {};

  if (current.bloodGroup !== next.bloodGroup) {
    changes.bloodGroup = { from: current.bloodGroup, to: next.bloodGroup };
  }
  if (current.component !== next.component) {
    changes.component = { from: current.component, to: next.component };
  }
  if (Number(current.units) !== next.units) {
    changes.units = { from: Number(current.units), to: next.units };
  }
  if (current.status !== next.status) {
    changes.status = { from: current.status, to: next.status };
  }

  const currentExpiry = toDate(current.expiresAt);
  if (!currentExpiry || currentExpiry.getTime() !== next.expiresAt.getTime()) {
    changes.expiresAt = {
      from: currentExpiry ? currentExpiry.toISOString() : "",
      to: next.expiresAt.toISOString(),
    };
  }

  return changes;
}

// ---------------------------------------------------------------------------
// FR-INV-04 / FR-MON-06: holds and sweep timing
// ---------------------------------------------------------------------------

export function reservationHoldUntil(
  from: Date,
  hours: number = RESERVATION_HOLD_HOURS,
): Date {
  return new Date(from.getTime() + hours * HOUR_MS);
}

/** FR-MON-06: the hourly guard - is a sweep due for this bank? */
export function sweepDue(
  lastSweepAt: Date | string | null | undefined,
  now: Date,
  intervalMinutes: number = MONITORING_INTERVAL_MINUTES,
): boolean {
  const last = toDate(lastSweepAt);
  if (!last) return true;
  return now.getTime() - last.getTime() >= intervalMinutes * MINUTE_MS;
}

// ---------------------------------------------------------------------------
// 4.4 / FR-INV-05, FR-MON-02: manual movements that reduce a batch
// ---------------------------------------------------------------------------

/** The movement types a blood bank records by hand on B-04. */
export const MANUAL_MOVEMENT_TYPES = ["issued", "discarded", "expired", "correction"] as const;
export type ManualMovementType = (typeof MANUAL_MOVEMENT_TYPES)[number];

export interface MovementInput {
  type?: string;
  units?: string | number;
  note?: string;
}

export interface MovementValues {
  type: ManualMovementType;
  /** Absolute total for a correction, units to remove otherwise, null for expire. */
  units: number | null;
  note: string | null;
}

export type MovementValidation =
  | { ok: true; values: MovementValues }
  | { ok: false; errors: InventoryFieldError[] };

export function isManualMovementType(value: string): value is ManualMovementType {
  return (MANUAL_MOVEMENT_TYPES as readonly string[]).includes(value);
}

/**
 * The quantity a manual movement leaves behind, or null when it is impossible.
 * `expired` clears whatever is left; `correction` sets an absolute value.
 */
export function nextUnitsForManualMovement(
  currentUnits: number,
  type: ManualMovementType,
  units: number | null,
): number | null {
  if (type === "expired") return 0;
  if (units === null || !Number.isInteger(units) || units < 0) return null;
  if (type === "correction") return units;
  const next = currentUnits - units;
  return next < 0 ? null : next;
}

/**
 * 4.4: checks the units/reason for Issue, Discard, Mark expired and Correct.
 * A correction needs a reason (FR-INV-03 explains *why* the number changed).
 */
export function validateMovementInput(
  input: MovementInput,
  options: { currentUnits: number },
): MovementValidation {
  const type = (input.type ?? "").trim();
  if (!isManualMovementType(type)) {
    return { ok: false, errors: [{ field: "type", code: "inventory.error.movementType" }] };
  }

  const raw =
    input.units === "" || input.units === undefined || input.units === null
      ? null
      : Number(input.units);
  const note = (input.note ?? "").trim();

  if (type === "expired") {
    if (options.currentUnits <= 0) {
      return { ok: false, errors: [{ field: "units", code: "inventory.error.nothingToExpire" }] };
    }
    return { ok: true, values: { type, units: null, note: note || null } };
  }

  const errors: InventoryFieldError[] = [];

  if (raw === null || !Number.isInteger(raw) || raw < 0) {
    errors.push({ field: "units", code: "inventory.error.units" });
  } else if (type === "correction") {
    if (note.length < 3) errors.push({ field: "note", code: "inventory.error.reason" });
  } else if (raw === 0) {
    errors.push({ field: "units", code: "inventory.error.units" });
  } else if (raw > options.currentUnits) {
    errors.push({ field: "units", code: "inventory.error.unitsTooMany" });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, values: { type, units: raw, note: note || null } };
}

/** The signed delta a manual movement writes into `inventory_movements`. */
export function manualMovementDelta(
  currentUnits: number,
  type: ManualMovementType,
  units: number | null,
): number | null {
  const next = nextUnitsForManualMovement(currentUnits, type, units);
  return next === null ? null : next - currentUnits;
}

// ---------------------------------------------------------------------------
// 4.6 / FR-INV-04 / A-10: reservations
// ---------------------------------------------------------------------------

export const MIN_HOLD_HOURS = 1;
export const MAX_HOLD_HOURS = 72;

export interface ReservationInput {
  units?: string | number;
  holdHours?: string | number;
}

export interface ReservationValues {
  units: number;
  holdHours: number;
}

export type ReservationValidation =
  | { ok: true; values: ReservationValues }
  | { ok: false; errors: InventoryFieldError[] };

/**
 * 4.6: a reservation holds units for a period the bank chooses (A-10, default
 * 6 hours). It can never hold more than the units currently free.
 */
export function validateReservationInput(
  input: ReservationInput,
  options: { freeUnits: number },
): ReservationValidation {
  const units = Number(input.units ?? "");
  const hours =
    input.holdHours === undefined || input.holdHours === ""
      ? RESERVATION_HOLD_HOURS
      : Number(input.holdHours);

  const errors: InventoryFieldError[] = [];

  if (!Number.isInteger(units) || units < 1) {
    errors.push({ field: "units", code: "inventory.error.units" });
  } else if (units > options.freeUnits) {
    errors.push({ field: "units", code: "inventory.error.reserveTooMany" });
  }

  if (!Number.isInteger(hours) || hours < MIN_HOLD_HOURS || hours > MAX_HOLD_HOURS) {
    errors.push({ field: "holdHours", code: "inventory.error.holdHours" });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, values: { units, holdHours: hours } };
}

// ---------------------------------------------------------------------------
// 4.7 / FR-INV-06 / A-11: transfers out
// ---------------------------------------------------------------------------

export interface TransferInput {
  units?: string | number;
  receivingOrganizationId?: string;
  note?: string;
}

export interface TransferValues {
  units: number;
  receivingOrganizationId: string;
  note: string | null;
}

export type TransferValidation =
  | { ok: true; values: TransferValues }
  | { ok: false; errors: InventoryFieldError[] };

/**
 * 4.7: the sending bank records units leaving for another verified blood bank.
 * Wasl never moves stock itself - the receiving bank records its own batch
 * (A-11) - so only the sending side is validated here.
 */
export function validateTransferInput(
  input: TransferInput,
  options: { currentUnits: number },
): TransferValidation {
  const receiving = (input.receivingOrganizationId ?? "").trim();
  const units = Number(input.units ?? "");
  const note = (input.note ?? "").trim();
  const errors: InventoryFieldError[] = [];

  if (!receiving) {
    errors.push({ field: "receivingOrganizationId", code: "inventory.error.receivingBank" });
  }
  if (!Number.isInteger(units) || units < 1) {
    errors.push({ field: "units", code: "inventory.error.units" });
  } else if (units > options.currentUnits) {
    errors.push({ field: "units", code: "inventory.error.unitsTooMany" });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, values: { units, receivingOrganizationId: receiving, note: note || null } };
}

// ---------------------------------------------------------------------------
// 7.1 / 7.3: the B-05 settings form
// ---------------------------------------------------------------------------

export interface MonitoringSettingsInput {
  thresholds?: Array<{
    bloodGroup?: string;
    component?: string;
    thresholdUnits?: string | number | null;
  }>;
  warningDays?: Record<string, string | number | null | undefined>;
  smsAlerts?: boolean;
}

export interface MonitoringSettingsValues {
  thresholds: Array<{
    bloodGroup: BloodGroup;
    component: BloodComponent;
    thresholdUnits: number | null;
  }>;
  expiryWarningDays: Record<BloodComponent, number>;
  smsAlerts: boolean;
}

export type MonitoringSettingsValidation =
  | { ok: true; values: MonitoringSettingsValues }
  | { ok: false; errors: InventoryFieldError[] };

/**
 * B-05 (FR-MON-01, FR-MON-03/04). An empty threshold means "use the default";
 * an empty warning window means "keep the SRS default".
 */
export function validateMonitoringSettings(
  input: MonitoringSettingsInput,
): MonitoringSettingsValidation {
  const errors: InventoryFieldError[] = [];
  const thresholds: MonitoringSettingsValues["thresholds"] = [];

  for (const [index, row] of (input.thresholds ?? []).entries()) {
    const bloodGroup = String(row.bloodGroup ?? "").trim();
    const component = String(row.component ?? "").trim();

    if (!isBloodGroup(bloodGroup)) {
      errors.push({
        field: `thresholds.${index}.bloodGroup`,
        code: "inventory.error.bloodGroup",
      });
      continue;
    }
    if (!isComponent(component)) {
      errors.push({
        field: `thresholds.${index}.component`,
        code: "inventory.error.component",
      });
      continue;
    }

    const raw = row.thresholdUnits;
    if (raw === null || raw === undefined || String(raw).trim() === "") {
      thresholds.push({ bloodGroup, component, thresholdUnits: null });
      continue;
    }

    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0 || value > 1000) {
      errors.push({
        field: `thresholds.${index}.thresholdUnits`,
        code: "inventory.error.threshold",
      });
      continue;
    }
    thresholds.push({ bloodGroup, component, thresholdUnits: value });
  }

  const expiryWarningDays: Record<BloodComponent, number> = { ...DEFAULT_EXPIRY_WARNING_DAYS };

  for (const component of BLOOD_COMPONENTS) {
    const raw = input.warningDays?.[component];
    if (raw === undefined || raw === null || String(raw).trim() === "") continue;

    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0 || value > 365) {
      errors.push({
        field: `warningDays.${component}`,
        code: "inventory.error.warningDays",
      });
      continue;
    }
    expiryWarningDays[component] = value;
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    values: { thresholds, expiryWarningDays, smsAlerts: Boolean(input.smsAlerts) },
  };
}
