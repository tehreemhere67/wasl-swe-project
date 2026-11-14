/**
 * Member 3 - Module 4 unit tests: batch validation, availability, movements.
 *
 * Pure functions only (no database, no Next.js), so these run in milliseconds.
 * Requirement IDs are named in each test so the traceability table stays honest.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  availableFromCounts,
  availableUnits,
  activeReservedUnits,
  countsAsAvailable,
  diffBatch,
  formatMovementQuantity,
  isReservationActive,
  manualMovementDelta,
  movementDelta,
  nextUnitsAfterMovement,
  nextUnitsForManualMovement,
  parseExpiry,
  physicalDelta,
  reservationHoldUntil,
  validateBatchInput,
  validateMovementInput,
  validateReservationInput,
  validateTransferInput,
  type ReservationLike,
} from "../../../src/lib/inventory/rules.ts";

const NOW = new Date("2026-11-14T12:00:00+05:00");

function hoursFromNow(hours: number): Date {
  return new Date(NOW.getTime() + hours * 60 * 60 * 1000);
}

describe("validateBatchInput - FR-INV-01 / DR-01", () => {
  const valid = {
    bloodGroup: "O-",
    component: "Red blood cells",
    units: "6",
    status: "approved",
    expiresAt: "2026-12-20",
  };

  test("accepts a complete batch and parses the date as end of day PKT", () => {
    const result = validateBatchInput(valid, NOW);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.values.bloodGroup, "O-");
    assert.equal(result.values.component, "Red blood cells");
    assert.equal(result.values.units, 6);
    assert.equal(result.values.status, "approved");
    // 2026-12-20 23:59:59.999 +05:00
    assert.equal(result.values.expiresAt.toISOString(), "2026-12-20T18:59:59.999Z");
  });

  test("rejects a negative quantity", () => {
    const result = validateBatchInput({ ...valid, units: "-5" }, NOW);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.deepEqual(
      result.errors.map((error) => error.code),
      ["inventory.error.units"],
    );
  });

  test("rejects a fractional quantity", () => {
    const result = validateBatchInput({ ...valid, units: "1.5" }, NOW);
    assert.equal(result.ok, false);
  });

  test("rejects a past expiry date", () => {
    const result = validateBatchInput({ ...valid, expiresAt: "2026-10-01" }, NOW);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.deepEqual(
      result.errors.map((error) => error.code),
      ["inventory.error.expiryPast"],
    );
  });

  test("rejects unknown controlled values (SRS 4.2)", () => {
    const result = validateBatchInput(
      { ...valid, bloodGroup: "C+", component: "Bone marrow", status: "tested" },
      NOW,
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.deepEqual(result.errors.map((error) => error.code).sort(), [
      "inventory.error.bloodGroup",
      "inventory.error.component",
      "inventory.error.status",
    ]);
  });

  test("editing accepts an unchanged past expiry but not a newly typed one", () => {
    const past = parseExpiry("2026-10-01");
    assert.ok(past);

    const unchanged = validateBatchInput(
      { ...valid, expiresAt: "2026-10-01" },
      NOW,
      { previousExpiresAt: past },
    );
    assert.equal(unchanged.ok, true);

    const typed = validateBatchInput(
      { ...valid, expiresAt: "2026-09-01" },
      NOW,
      { previousExpiresAt: past },
    );
    assert.equal(typed.ok, false);
  });
});

describe("availability - FR-INV-02 / FR-INV-04 / FR-INV-08 (4.8)", () => {
  const activeHold: ReservationLike = {
    units: 2,
    status: "active",
    holdUntil: hoursFromNow(6),
  };
  const expiredHold: ReservationLike = {
    units: 2,
    status: "active",
    holdUntil: hoursFromNow(-1),
  };
  const releasedHold: ReservationLike = {
    units: 2,
    status: "released",
    holdUntil: hoursFromNow(6),
  };

  test("counts only active, unexpired holds", () => {
    assert.equal(isReservationActive(activeHold, NOW), true);
    assert.equal(isReservationActive(expiredHold, NOW), false);
    assert.equal(isReservationActive(releasedHold, NOW), false);
    assert.equal(activeReservedUnits([activeHold, expiredHold, releasedHold], NOW), 2);
  });

  test("available = units - active holds, never negative", () => {
    assert.equal(availableUnits(6, [activeHold], NOW), 4);
    assert.equal(availableFromCounts(6, 2), 4);
    assert.equal(availableFromCounts(1, 3), 0);
  });

  test("only approved, unexpired, unreserved stock of a verified bank counts", () => {
    const base = {
      status: "approved",
      expiresAt: hoursFromNow(48),
      units: 6,
      reservations: [] as ReservationLike[],
      organizationVerified: true,
      now: NOW,
    };

    assert.equal(countsAsAvailable(base), true);
    assert.equal(countsAsAvailable({ ...base, status: "awaiting_testing" }), false);
    assert.equal(countsAsAvailable({ ...base, status: "rejected" }), false);
    assert.equal(countsAsAvailable({ ...base, expiresAt: hoursFromNow(-1) }), false);
    assert.equal(countsAsAvailable({ ...base, reservations: [activeHold] }), true);
    assert.equal(
      countsAsAvailable({ ...base, units: 2, reservations: [activeHold] }),
      false,
    );
    assert.equal(countsAsAvailable({ ...base, organizationVerified: false }), false);
  });
});

describe("movements - FR-INV-03 / FR-INV-05 / FR-INV-06 / A-08", () => {
  test("signs the quantity by movement type", () => {
    assert.equal(movementDelta("added", 10), 10);
    assert.equal(movementDelta("issued", 2), -2);
    assert.equal(movementDelta("transferred_out", 3), -3);
    assert.equal(movementDelta("expired", 4), -4);
    assert.equal(movementDelta("discarded", 1), -1);
    assert.equal(movementDelta("reserved", 2), -2);
    assert.equal(movementDelta("reservation_released", 2), 2);
    assert.equal(movementDelta("correction", -3), -3);
  });

  test("reservations change availability, not physical units", () => {
    assert.equal(physicalDelta("reserved", 2), 0);
    assert.equal(physicalDelta("reservation_released", 2), 0);
    assert.equal(physicalDelta("issued", 2), -2);
  });

  test("a movement can never drive the quantity below zero (DR-01)", () => {
    assert.equal(nextUnitsAfterMovement(3, "issued", 5), null);
    assert.equal(nextUnitsAfterMovement(3, "issued", 2), 1);
    assert.equal(nextUnitsAfterMovement(3, "added", 4), 7);
  });

  test("formats the B-04 summary values", () => {
    assert.equal(formatMovementQuantity("added", 10), "+10");
    assert.equal(formatMovementQuantity("issued", 2), "\u22122");
    assert.equal(formatMovementQuantity("correction", 0), "0");
  });
});

describe("manual movements - 4.4", () => {
  test("issue and discard are limited to the units held", () => {
    const tooMany = validateMovementInput(
      { type: "issued", units: "5" },
      { currentUnits: 3 },
    );
    assert.equal(tooMany.ok, false);
    if (tooMany.ok) return;
    assert.deepEqual(
      tooMany.errors.map((error) => error.code),
      ["inventory.error.unitsTooMany"],
    );

    const ok = validateMovementInput({ type: "discarded", units: "2" }, { currentUnits: 3 });
    assert.equal(ok.ok, true);
  });

  test("zero units is not a removal", () => {
    const result = validateMovementInput({ type: "issued", units: "0" }, { currentUnits: 3 });
    assert.equal(result.ok, false);
  });

  test("a correction needs a reason and sets an absolute total", () => {
    const missingReason = validateMovementInput(
      { type: "correction", units: "4", note: "" },
      { currentUnits: 5 },
    );
    assert.equal(missingReason.ok, false);

    const ok = validateMovementInput(
      { type: "correction", units: "4", note: "Recount" },
      { currentUnits: 5 },
    );
    assert.equal(ok.ok, true);
    if (!ok.ok) return;
    assert.equal(nextUnitsForManualMovement(5, "correction", ok.values.units), 4);
    assert.equal(manualMovementDelta(5, "correction", 4), -1);
  });

  test("expire clears the batch and refuses an empty one", () => {
    assert.equal(nextUnitsForManualMovement(6, "expired", null), 0);
    const empty = validateMovementInput({ type: "expired" }, { currentUnits: 0 });
    assert.equal(empty.ok, false);
    if (empty.ok) return;
    assert.equal(empty.errors[0].code, "inventory.error.nothingToExpire");
  });
});

describe("reservations - FR-INV-04 / A-10", () => {
  test("cannot reserve more than is free", () => {
    const result = validateReservationInput({ units: "3" }, { freeUnits: 2 });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.errors[0].code, "inventory.error.reserveTooMany");
  });

  test("hold defaults to 6 hours and is limited to 1-72", () => {
    const ok = validateReservationInput({ units: "2" }, { freeUnits: 5 });
    assert.equal(ok.ok, true);
    if (!ok.ok) return;
    assert.equal(ok.values.holdHours, 6);

    assert.equal(validateReservationInput({ units: "2", holdHours: "0" }, { freeUnits: 5 }).ok, false);
    assert.equal(validateReservationInput({ units: "2", holdHours: "73" }, { freeUnits: 5 }).ok, false);
  });

  test("hold end is exactly six hours later by default", () => {
    const until = reservationHoldUntil(NOW);
    assert.equal(until.getTime() - NOW.getTime(), 6 * 60 * 60 * 1000);
  });
});

describe("transfers - FR-INV-06 / A-11", () => {
  test("requires a receiving bank", () => {
    const result = validateTransferInput({ units: "1" }, { currentUnits: 5 });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.deepEqual(
      result.errors.map((error) => error.code),
      ["inventory.error.receivingBank"],
    );
  });

  test("cannot send more than the batch holds", () => {
    const result = validateTransferInput(
      { units: "9", receivingOrganizationId: "bank-2" },
      { currentUnits: 5 },
    );
    assert.equal(result.ok, false);
  });

  test("accepts a valid transfer", () => {
    const result = validateTransferInput(
      { units: "2", receivingOrganizationId: "bank-2", note: "Driver" },
      { currentUnits: 5 },
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.values.units, 2);
    assert.equal(result.values.note, "Driver");
  });
});

describe("diffBatch - FR-INV-03", () => {
  const current = {
    bloodGroup: "A+",
    component: "Platelets",
    units: 5,
    status: "awaiting_testing",
    expiresAt: "2026-12-01T18:59:59.999Z",
  };

  test("reports nothing when nothing changed", () => {
    const changes = diffBatch(current, {
      bloodGroup: "A+",
      component: "Platelets",
      units: 5,
      status: "awaiting_testing",
      expiresAt: new Date("2026-12-01T18:59:59.999Z"),
    });
    assert.deepEqual(changes, {});
  });

  test("reports units, status and expiry changes", () => {
    const changes = diffBatch(current, {
      bloodGroup: "A+",
      component: "Platelets",
      units: 4,
      status: "approved",
      expiresAt: new Date("2026-12-01T18:59:59.999Z"),
    });
    assert.deepEqual(changes.units, { from: 5, to: 4 });
    assert.deepEqual(changes.status, { from: "awaiting_testing", to: "approved" });
    assert.equal(changes.expiresAt, undefined);
  });
});
