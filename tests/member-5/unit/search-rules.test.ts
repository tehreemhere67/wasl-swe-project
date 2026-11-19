/**
 * Member 5 - Module 5 unit tests: search validation, exclusions, grouping, ordering.
 * Pure functions only (no database, no Next.js).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  BLOOD_COMPONENTS,
  BLOOD_GROUPS,
  createRequestHref,
  groupAvailability,
  hasSearchInput,
  telHref,
  validateSearchInput,
  type CandidateBatch,
} from "../../../src/lib/search/rules";

const NOW = new Date("2026-11-10T09:00:00Z");
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

function batch(over: Partial<CandidateBatch> = {}): CandidateBatch {
  return {
    batchId: "b1",
    organizationId: "bankA",
    organizationName: "Bank A",
    verificationStatus: "verified",
    area: "Saddar",
    address: "Saddar, Karachi",
    phone: "+92 21 111 2222",
    email: "a@bank.test",
    units: 5,
    reservedUnits: 0,
    status: "approved",
    expiresAt: day(10),
    lastUpdatedAt: day(-1),
    ...over,
  };
}

describe("5.1 validateSearchInput (FR-INV-07)", () => {
  test("accepts every group x component combination", () => {
    for (const g of BLOOD_GROUPS)
      for (const c of BLOOD_COMPONENTS) {
        const r = validateSearchInput({ bloodGroup: g, component: c });
        assert.equal(r.ok, true);
      }
  });
  test("both fields missing -> two required errors", () => {
    const r = validateSearchInput({});
    assert.equal(r.ok, false);
    if (!r.ok) assert.deepEqual(r.errors.map((e) => `${e.field}:${e.code}`), ["bloodGroup:required", "component:required"]);
  });
  test("blank / whitespace counts as missing", () => {
    const r = validateSearchInput({ bloodGroup: "  ", component: "" });
    assert.equal(r.ok, false);
  });
  test("only group missing", () => {
    const r = validateSearchInput({ bloodGroup: "", component: BLOOD_COMPONENTS[0] });
    assert.equal(r.ok, false);
    if (!r.ok) assert.deepEqual(r.errors, [{ field: "bloodGroup", code: "required" }]);
  });
  test("unknown values are invalid, not required", () => {
    const r = validateSearchInput({ bloodGroup: "Z+", component: "plasma-ish" });
    assert.equal(r.ok, false);
    if (!r.ok) assert.deepEqual(r.errors.map((e) => e.code), ["invalid", "invalid"]);
  });
  test("SQL-looking input is rejected as invalid", () => {
    const r = validateSearchInput({ bloodGroup: "A+' OR '1'='1", component: BLOOD_COMPONENTS[0] });
    assert.equal(r.ok, false);
  });
  test("repeated query params use the first value", () => {
    const r = validateSearchInput({ bloodGroup: [BLOOD_GROUPS[0], "Z+"], component: BLOOD_COMPONENTS[0] });
    assert.equal(r.ok, true);
  });
  test("hasSearchInput distinguishes first visit from submitted form", () => {
    assert.equal(hasSearchInput({}), false);
    assert.equal(hasSearchInput({ bloodGroup: "" }), true);
  });
});

describe("5.2 grouping, quantity, expiry, ordering (FR-INV-07)", () => {
  test("sums batches of one bank and keeps earliest expiry", () => {
    const r = groupAvailability(
      [batch({ batchId: "1", units: 3, expiresAt: day(20) }), batch({ batchId: "2", units: 4, expiresAt: day(5) })],
      NOW,
    );
    assert.equal(r.length, 1);
    assert.equal(r[0].availableUnits, 7);
    assert.equal(r[0].batchCount, 2);
    assert.equal(r[0].earliestExpiry, new Date(day(5)).toISOString());
  });
  test("sorted by quantity desc", () => {
    const r = groupAvailability(
      [
        batch({ organizationId: "x", organizationName: "X", units: 2 }),
        batch({ organizationId: "y", organizationName: "Y", units: 9 }),
        batch({ organizationId: "z", organizationName: "Z", units: 5 }),
      ],
      NOW,
    );
    assert.deepEqual(r.map((b) => b.name), ["Y", "Z", "X"]);
  });
  test("ties: sooner expiry first, then name", () => {
    const r = groupAvailability(
      [
        batch({ organizationId: "x", organizationName: "B", units: 4, expiresAt: day(9) }),
        batch({ organizationId: "y", organizationName: "A", units: 4, expiresAt: day(9) }),
        batch({ organizationId: "z", organizationName: "C", units: 4, expiresAt: day(3) }),
      ],
      NOW,
    );
    assert.deepEqual(r.map((b) => b.name), ["C", "A", "B"]);
  });
  test("result carries name, verified status, area, phone, email, last updated", () => {
    const [r] = groupAvailability([batch()], NOW);
    assert.equal(r.name, "Bank A");
    assert.equal(r.verificationStatus, "verified");
    assert.equal(r.area, "Saddar");
    assert.equal(r.phone, "+92 21 111 2222");
    assert.equal(r.email, "a@bank.test");
    assert.equal(r.lastUpdatedAt, day(-1));
  });
  test("area falls back to address when blank", () => {
    const [r] = groupAvailability([batch({ area: "  " })], NOW);
    assert.equal(r.area, "Saddar, Karachi");
    const [r2] = groupAvailability([batch({ area: null })], NOW);
    assert.equal(r2.area, "Saddar, Karachi");
  });
  test("null last-updated stays null (page shows 'not recorded')", () => {
    const [r] = groupAvailability([batch({ lastUpdatedAt: null })], NOW);
    assert.equal(r.lastUpdatedAt, null);
  });
  test("empty input -> empty list", () => {
    assert.deepEqual(groupAvailability([], NOW), []);
  });
});

describe("5.3 exclusions (FR-INV-08)", () => {
  test("expired stock excluded", () => {
    assert.equal(groupAvailability([batch({ expiresAt: day(-1) })], NOW).length, 0);
  });
  test("expiring exactly now is excluded", () => {
    assert.equal(groupAvailability([batch({ expiresAt: NOW.toISOString() })], NOW).length, 0);
  });
  test("awaiting-testing excluded", () => {
    assert.equal(groupAvailability([batch({ status: "awaiting_testing" })], NOW).length, 0);
  });
  test("rejected excluded", () => {
    assert.equal(groupAvailability([batch({ status: "rejected" })], NOW).length, 0);
  });
  test("fully reserved excluded", () => {
    assert.equal(groupAvailability([batch({ units: 5, reservedUnits: 5 })], NOW).length, 0);
  });
  test("partly reserved shows only the free units", () => {
    const [r] = groupAvailability([batch({ units: 5, reservedUnits: 2 })], NOW);
    assert.equal(r.availableUnits, 3);
  });
  test("over-reserved never goes negative / appears", () => {
    assert.equal(groupAvailability([batch({ units: 2, reservedUnits: 9 })], NOW).length, 0);
  });
  test("zero units excluded", () => {
    assert.equal(groupAvailability([batch({ units: 0 })], NOW).length, 0);
  });
  for (const status of ["pending", "rejected", "suspended"]) {
    test(`bank ${status} excluded`, () => {
      assert.equal(groupAvailability([batch({ verificationStatus: status })], NOW).length, 0);
    });
  }
  test("bad batches are skipped, good batches of the same bank still count", () => {
    const [r] = groupAvailability(
      [batch({ batchId: "1", units: 4 }), batch({ batchId: "2", units: 9, expiresAt: day(-3) }), batch({ batchId: "3", units: 9, status: "awaiting_testing" })],
      NOW,
    );
    assert.equal(r.availableUnits, 4);
    assert.equal(r.batchCount, 1);
  });
  test("unparseable expiry skipped", () => {
    assert.equal(groupAvailability([batch({ expiresAt: "not-a-date" })], NOW).length, 0);
  });
});

describe("helpers", () => {
  test("telHref strips spaces and punctuation", () => {
    assert.equal(telHref("+92 (21) 111-2222"), "tel:+92211112222");
  });
  test("5.5 createRequestHref carries the search", () => {
    const href = createRequestHref({ bloodGroup: BLOOD_GROUPS[0], component: BLOOD_COMPONENTS[0] });
    assert.ok(href.startsWith("/hospital/requests/new?"));
    assert.ok(href.includes("bloodGroup="));
    assert.ok(href.includes("component="));
  });
});
