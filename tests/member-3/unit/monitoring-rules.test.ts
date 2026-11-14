/**
 * Member 3 - Module 7 unit tests: expiry windows, low stock, alert repeat rules
 * and the B-05 settings validation.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  DEFAULT_EXPIRY_WARNING_DAYS,
  DEFAULT_LOW_STOCK_THRESHOLD,
  alertDedupeKey,
  expiryWarningDays,
  isExpired,
  isExpiringSoon,
  isLowStock,
  shouldRaiseAlert,
  sweepDue,
  thresholdFor,
  validateMonitoringSettings,
} from "../../../src/lib/inventory/rules.ts";

const NOW = new Date("2026-11-14T12:00:00+05:00");

function days(n: number): Date {
  return new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);
}

describe("expiry warning windows - FR-MON-01 / A-31", () => {
  test("uses the SRS defaults: platelets 2, whole blood 7, red cells 7, plasma 30", () => {
    assert.deepEqual(DEFAULT_EXPIRY_WARNING_DAYS, {
      Platelets: 2,
      "Whole blood": 7,
      "Red blood cells": 7,
      Plasma: 30,
    });
  });

  test("a bank can override one component without touching the others", () => {
    const overrides = { Platelets: 5 };
    assert.equal(expiryWarningDays("Platelets", overrides), 5);
    assert.equal(expiryWarningDays("Plasma", overrides), 30);
  });

  test("platelets expiring tomorrow warn, red cells 20 days out do not", () => {
    assert.equal(isExpiringSoon(days(1), "Platelets", NOW), true);
    assert.equal(isExpiringSoon(days(20), "Red blood cells", NOW), false);
    assert.equal(isExpiringSoon(days(5), "Red blood cells", NOW), true);
  });

  test("an already expired batch is not 'expiring soon'", () => {
    assert.equal(isExpired(days(-1), NOW), true);
    assert.equal(isExpiringSoon(days(-1), "Platelets", NOW), false);
  });

  test("an override widens the window", () => {
    assert.equal(isExpiringSoon(days(4), "Platelets", NOW), false);
    assert.equal(isExpiringSoon(days(4), "Platelets", NOW, { Platelets: 5 }), true);
  });
});

describe("low stock - FR-MON-03 / FR-MON-04 / A-05", () => {
  const thresholds = [
    { bloodGroup: "A+", component: "Platelets", thresholdUnits: 10 },
    { bloodGroup: "O-", component: "Red blood cells", thresholdUnits: 0 },
  ];

  test("defaults to 5 units where the bank set nothing", () => {
    assert.equal(DEFAULT_LOW_STOCK_THRESHOLD, 5);
    assert.equal(thresholdFor(thresholds, "B+", "Plasma"), 5);
  });

  test("uses the bank's own threshold", () => {
    assert.equal(thresholdFor(thresholds, "A+", "Platelets"), 10);
    assert.equal(thresholdFor(thresholds, "O-", "Red blood cells"), 0);
  });

  test("alerts AT or BELOW the threshold, not only below", () => {
    assert.equal(isLowStock(5, 5), true);
    assert.equal(isLowStock(6, 5), false);
    assert.equal(isLowStock(0, 0), true);
  });
});

describe("alert identity and the 24-hour rule - FR-MON-05 / A-32", () => {
  test("expiry alerts are per batch; low-stock alerts are per group + component", () => {
    assert.equal(
      alertDedupeKey({
        type: "expiry",
        batchId: "batch-1",
        bloodGroup: "A+",
        component: "Platelets",
      }),
      "expiry:batch-1",
    );
    assert.equal(
      alertDedupeKey({ type: "low_stock", bloodGroup: "A+", component: "Platelets" }),
      "low_stock:A+:Platelets",
    );
  });

  test("a first alert always raises", () => {
    assert.equal(shouldRaiseAlert(null, NOW), true);
  });

  test("the same alert does not repeat within 24 hours", () => {
    const oneHourAgo = new Date(NOW.getTime() - 60 * 60 * 1000);
    const twentyFiveHoursAgo = new Date(NOW.getTime() - 25 * 60 * 60 * 1000);
    assert.equal(shouldRaiseAlert(oneHourAgo, NOW), false);
    assert.equal(shouldRaiseAlert(twentyFiveHoursAgo, NOW), true);
  });
});

describe("sweep timing - FR-MON-06", () => {
  test("sweeps when no sweep has run yet", () => {
    assert.equal(sweepDue(null, NOW), true);
  });

  test("does not sweep again within the hour", () => {
    const thirtyMinutesAgo = new Date(NOW.getTime() - 30 * 60 * 1000);
    assert.equal(sweepDue(thirtyMinutesAgo, NOW), false);
  });

  test("sweeps once an hour has passed", () => {
    const sixtyOneMinutesAgo = new Date(NOW.getTime() - 61 * 60 * 1000);
    assert.equal(sweepDue(sixtyOneMinutesAgo, NOW), true);
  });
});

describe("B-05 settings validation - FR-MON-01 / FR-MON-03", () => {
  test("an empty threshold box means 'use the default'", () => {
    const result = validateMonitoringSettings({
      thresholds: [{ bloodGroup: "A+", component: "Platelets", thresholdUnits: "" }],
      warningDays: {},
      smsAlerts: true,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.values.thresholds[0].thresholdUnits, null);
    assert.equal(result.values.smsAlerts, true);
  });

  test("fills the warning windows with the defaults when left empty", () => {
    const result = validateMonitoringSettings({ thresholds: [], warningDays: {} });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.values.expiryWarningDays, DEFAULT_EXPIRY_WARNING_DAYS);
  });

  test("accepts a valid threshold and window", () => {
    const result = validateMonitoringSettings({
      thresholds: [{ bloodGroup: "O+", component: "Whole blood", thresholdUnits: "12" }],
      warningDays: { Platelets: "3", Plasma: "30" },
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.values.thresholds[0].thresholdUnits, 12);
    assert.equal(result.values.expiryWarningDays.Platelets, 3);
  });

  test("rejects a negative threshold and an absurd window", () => {
    const result = validateMonitoringSettings({
      thresholds: [{ bloodGroup: "O+", component: "Whole blood", thresholdUnits: "-1" }],
      warningDays: { Platelets: "400" },
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.deepEqual(
      result.errors.map((error) => error.code).sort(),
      ["inventory.error.threshold", "inventory.error.warningDays"],
    );
  });
});
