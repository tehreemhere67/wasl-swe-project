/**
 * Unit tests for src/lib/auth/rules.ts
 *
 * SRS references:
 *   FR-ADM-01 - each user class gets access only to its own features
 *   FR-VER-03 - a pending organization cannot operate before it is Verified
 *   NFR-SEC-02 - lock for 15 minutes after 5 failed login attempts;
 *                a session ends after 30 minutes without activity
 *
 * No .env file is loaded when these tests run, so the documented defaults
 * (5 attempts, 15 minutes) are the values used below.
 *
 * Run directly:  node tests/rules.test.ts
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  ROLE_HOME,
  canOperate,
  isLocked,
  landingPath,
  lockoutMinutes,
  maxFailedLogins,
  minutesUntil,
  registerFailedLogin,
  remainingAttempts,
} from "../../../src/lib/auth/rules.ts";
import { ROLES } from "../../../src/lib/validation.ts";

describe("ROLE_HOME", () => {
  test("every role has exactly one home", () => {
    assert.deepEqual(ROLE_HOME, {
      admin: "/admin",
      hospital: "/hospital",
      blood_bank: "/bank",
      donation_org: "/organizer",
      donor: "/donor",
    });
    assert.equal(Object.keys(ROLE_HOME).length, ROLES.length);
  });
});

describe("landingPath", () => {
  test("a verified organization goes to its own home", () => {
    assert.equal(landingPath("hospital", "verified"), "/hospital");
    assert.equal(landingPath("blood_bank", "verified"), "/bank");
    assert.equal(landingPath("donation_org", "verified"), "/organizer");
  });

  test("pending, rejected and suspended organizations go to the status screen (G-04)", () => {
    for (const status of ["pending", "rejected", "suspended"] as const) {
      assert.equal(landingPath("hospital", status), "/status");
      assert.equal(landingPath("blood_bank", status), "/status");
      assert.equal(landingPath("donation_org", status), "/status");
    }
  });

  test("admin and donor have no organization and go to their own home", () => {
    assert.equal(landingPath("admin", null), "/admin");
    assert.equal(landingPath("donor", null), "/donor");
    assert.equal(landingPath("admin", undefined), "/admin");
  });
});

describe("canOperate (FR-VER-03)", () => {
  test("only a Verified organization may use operational features", () => {
    assert.equal(canOperate("hospital", "verified"), true);
    assert.equal(canOperate("blood_bank", "verified"), true);
    assert.equal(canOperate("donation_org", "verified"), true);
  });

  test("pending, rejected and suspended organizations are blocked", () => {
    for (const role of ["hospital", "blood_bank", "donation_org"] as const) {
      for (const status of ["pending", "rejected", "suspended"] as const) {
        assert.equal(canOperate(role, status), false, `${role}/${status}`);
      }
    }
  });

  test("a missing organization status blocks an organization user", () => {
    assert.equal(canOperate("hospital", null), false);
    assert.equal(canOperate("blood_bank", undefined), false);
  });

  test("admin and donor are not organization users and are not blocked", () => {
    assert.equal(canOperate("admin", null), true);
    assert.equal(canOperate("donor", null), true);
  });
});

describe("login lockout thresholds (NFR-SEC-02)", () => {
  test("5 failed attempts and a 15-minute lock are the documented defaults", () => {
    assert.equal(maxFailedLogins(), 5);
    assert.equal(lockoutMinutes(), 15);
  });

  test("an account is locked after exactly 5 failed attempts", () => {
    const now = new Date("2026-11-12T18:00:00.000Z");
    let outcome = registerFailedLogin(0, now, 5, 15);
    assert.equal(outcome.lockedUntil, null, "1 failure must not lock");

    for (let attempts = 1; attempts < 4; attempts += 1) {
      outcome = registerFailedLogin(attempts, now, 5, 15);
      assert.equal(outcome.lockedUntil, null, `${attempts} failures must not lock`);
      assert.equal(outcome.attempts, attempts + 1);
    }

    // The fifth failure starts the lock.
    const fifth = registerFailedLogin(4, now, 5, 15);
    assert.equal(fifth.attempts, 5);
    assert.notEqual(fifth.lockedUntil, null);
    assert.equal(fifth.remainingAttempts, 0);
  });

  test("the lock lasts exactly 15 minutes", () => {
    const now = new Date("2026-11-12T18:00:00.000Z");
    const outcome = registerFailedLogin(4, now, 5, 15);
    assert.ok(outcome.lockedUntil);
    assert.equal(outcome.lockedUntil.getTime() - now.getTime(), 15 * 60 * 1000);
  });

  test("remaining attempts count down from 4 to 0", () => {
    const now = new Date();
    const expected = [4, 3, 2, 1, 0];
    for (let previous = 0; previous < 5; previous += 1) {
      const outcome = registerFailedLogin(previous, now, 5, 15);
      assert.equal(remainingAttempts(outcome), expected[previous], `after ${previous + 1} failures`);
    }
  });

  test("a custom threshold and lock length are respected", () => {
    const now = new Date("2026-11-12T18:00:00.000Z");
    const locked = registerFailedLogin(2, now, 3, 30);
    assert.equal(locked.attempts, 3);
    assert.ok(locked.lockedUntil);
    assert.equal(locked.lockedUntil.getTime() - now.getTime(), 30 * 60 * 1000);
    assert.equal(locked.remainingAttempts, 0);
  });

  test("a negative or fractional previous count cannot produce a negative attempt count", () => {
    const outcome = registerFailedLogin(-5, new Date(), 5, 15);
    assert.equal(outcome.attempts, 1);
    const fractional = registerFailedLogin(1.9, new Date(), 5, 15);
    assert.equal(fractional.attempts, 2);
  });
});

describe("isLocked", () => {
  const now = new Date("2026-11-12T18:00:00.000Z");

  test("true while the lock has not expired", () => {
    assert.equal(isLocked(new Date(now.getTime() + 60_000), now), true);
    assert.equal(isLocked("2026-11-12T18:15:00.000Z", now), true);
  });

  test("false once the lock has expired", () => {
    assert.equal(isLocked(new Date(now.getTime() - 1), now), false);
    assert.equal(isLocked("2026-11-12T17:45:00.000Z", now), false);
  });

  test("false when there is no lock", () => {
    assert.equal(isLocked(null, now), false);
    assert.equal(isLocked(undefined, now), false);
  });

  test("false for an unparseable timestamp", () => {
    assert.equal(isLocked("not-a-date", now), false);
  });
});

describe("minutesUntil", () => {
  const now = new Date("2026-11-12T18:00:00.000Z");

  test("rounds a partial minute up", () => {
    assert.equal(minutesUntil(new Date(now.getTime() + 10.5 * 60_000), now), 11);
  });

  test("reports 15 for a full 15-minute lock", () => {
    assert.equal(minutesUntil(new Date(now.getTime() + 15 * 60_000), now), 15);
  });

  test("never reports less than 1 minute", () => {
    assert.equal(minutesUntil(new Date(now.getTime() - 5 * 60_000), now), 1);
  });

  test("accepts an ISO string", () => {
    assert.equal(minutesUntil("2026-11-12T18:03:00.000Z", now), 3);
  });
});
