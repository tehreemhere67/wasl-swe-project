/**
 * Unit tests for src/lib/admin/rules.ts - Member 2, Sprint 1.
 *
 * SRS references:
 *   FR-ADM-02 - view / search / deactivate / reactivate accounts
 *   FR-ADM-03/04 - administrator reviews and hides/rejects content with a reason
 *   FR-ADM-05 - every administrator action is recorded
 *
 * Run directly:  node tests/member-2/admin.test.ts
 * Run the suite: node tests/run-all.ts
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  ACCOUNT_ACTIONS,
  CAMPAIGN_DECISIONS,
  CAMPAIGN_STATUSES,
  campaignStatusFor,
  campaignStatusTone,
  canChangeAccountStatus,
  isAccountAction,
  isCampaignDecision,
  isReviewableCampaignStatus,
  matchesAccountQuery,
  normalizeQuery,
  validateAccountAction,
  validateCampaignDecision,
  type AccountChangeInput,
  type RuleResult,
} from "../../src/lib/admin/rules.ts";

function codes(result: RuleResult, field: string): string[] {
  return result.errors.filter((error) => error.field === field).map((error) => error.message);
}

function changeInput(overrides: Partial<AccountChangeInput> = {}): AccountChangeInput {
  return {
    actorId: "admin-1",
    targetId: "user-2",
    targetRole: "donor",
    targetStatus: "active",
    activeAdminCount: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
describe("normalizeQuery", () => {
  test("trims, lower-cases and collapses whitespace", () => {
    assert.equal(normalizeQuery("  Aga   KHAN  "), "aga khan");
  });

  test("returns an empty string for non-strings", () => {
    assert.equal(normalizeQuery(undefined), "");
    assert.equal(normalizeQuery(null), "");
    assert.equal(normalizeQuery(42), "");
  });
});

describe("matchesAccountQuery", () => {
  const donor = {
    fullName: "Ali Raza",
    email: null,
    phone: "+923001111003",
    organizationName: null,
  };
  const organization = {
    fullName: "Dr. Sana Ahmed",
    email: "hospital@demo.wasl",
    phone: "+923001111001",
    organizationName: "Aga Khan University Hospital",
  };

  test("matches a name case-insensitively", () => {
    assert.equal(matchesAccountQuery(donor, "ali"), true);
    assert.equal(matchesAccountQuery(organization, "  SANA "), true);
  });

  test("matches an email", () => {
    assert.equal(matchesAccountQuery(organization, "demo.wasl"), true);
  });

  test("matches a local and an international phone fragment", () => {
    assert.equal(matchesAccountQuery(donor, "0300"), true);
    assert.equal(matchesAccountQuery(donor, "92300"), true);
  });

  test("matches an organization name", () => {
    assert.equal(matchesAccountQuery(organization, "khan university"), true);
  });

  test("an empty query matches every account", () => {
    assert.equal(matchesAccountQuery(donor, ""), true);
    assert.equal(matchesAccountQuery(donor, "   "), true);
  });

  test("returns false when nothing matches", () => {
    assert.equal(matchesAccountQuery(donor, "hospital"), false);
  });

  test("treats regex and SQL wildcard characters as literal text", () => {
    assert.equal(matchesAccountQuery(donor, ".*"), false);
    assert.equal(matchesAccountQuery(donor, "%"), false);
  });
});

// ---------------------------------------------------------------------------
// A-03 - account actions
// ---------------------------------------------------------------------------
describe("validateAccountAction", () => {
  test("requires a user id", () => {
    const result = validateAccountAction({ action: "deactivate" });
    assert.equal(result.ok, false);
    assert.deepEqual(codes(result, "userId"), ["required"]);
  });

  test("requires an action", () => {
    const result = validateAccountAction({ userId: "u1" });
    assert.deepEqual(codes(result, "action"), ["required"]);
  });

  test("rejects an action outside the whitelist", () => {
    const result = validateAccountAction({ userId: "u1", action: "delete" });
    assert.equal(result.ok, false);
    assert.deepEqual(codes(result, "action"), ["invalid"]);
  });

  test("accepts deactivate and reactivate", () => {
    for (const action of ACCOUNT_ACTIONS) {
      const result = validateAccountAction({ userId: "u1", action });
      assert.equal(result.ok, true);
      assert.equal(result.values.action, action);
    }
  });

  test("trims the user id", () => {
    const result = validateAccountAction({ userId: "  u1  ", action: "deactivate" });
    assert.equal(result.values.userId, "u1");
  });
});

describe("canChangeAccountStatus", () => {
  test("refuses to change your own account", () => {
    const decision = canChangeAccountStatus(changeInput({ targetId: "admin-1" }), "deactivate");
    assert.deepEqual(decision, { ok: false, reason: "self" });
  });

  test("refuses to deactivate the last active administrator", () => {
    const decision = canChangeAccountStatus(
      changeInput({ targetRole: "admin", activeAdminCount: 1 }),
      "deactivate",
    );
    assert.deepEqual(decision, { ok: false, reason: "last_admin" });
  });

  test("allows deactivating an administrator when another one stays active", () => {
    const decision = canChangeAccountStatus(
      changeInput({ targetRole: "admin", activeAdminCount: 2 }),
      "deactivate",
    );
    assert.deepEqual(decision, { ok: true });
  });

  test("allows deactivating a donor or an organization user", () => {
    assert.deepEqual(canChangeAccountStatus(changeInput(), "deactivate"), { ok: true });
    assert.deepEqual(
      canChangeAccountStatus(changeInput({ targetRole: "hospital" }), "deactivate"),
      { ok: true },
    );
  });

  test("refuses to deactivate an already deactivated account", () => {
    const decision = canChangeAccountStatus(
      changeInput({ targetStatus: "deactivated" }),
      "deactivate",
    );
    assert.deepEqual(decision, { ok: false, reason: "already_deactivated" });
  });

  test("allows reactivating a deactivated account", () => {
    const decision = canChangeAccountStatus(
      changeInput({ targetStatus: "deactivated" }),
      "reactivate",
    );
    assert.deepEqual(decision, { ok: true });
  });

  test("refuses to reactivate an account that is already active", () => {
    const decision = canChangeAccountStatus(changeInput(), "reactivate");
    assert.deepEqual(decision, { ok: false, reason: "already_active" });
  });
});

// ---------------------------------------------------------------------------
// A-04 - campaign review
// ---------------------------------------------------------------------------
describe("validateCampaignDecision", () => {
  test("approving needs no reason", () => {
    const result = validateCampaignDecision({ campaignId: "c1", decision: "approve" });
    assert.equal(result.ok, true);
  });

  test("requires a reason to reject or return", () => {
    for (const decision of ["reject", "return"]) {
      const empty = validateCampaignDecision({ campaignId: "c1", decision });
      assert.deepEqual(codes(empty, "reason"), ["required"]);
      const short = validateCampaignDecision({ campaignId: "c1", decision, reason: "no" });
      assert.deepEqual(codes(short, "reason"), ["required"]);
    }
  });

  test("accepts a reason of three or more characters", () => {
    const result = validateCampaignDecision({
      campaignId: "c1",
      decision: "reject",
      reason: "  expired licence  ",
    });
    assert.equal(result.ok, true);
    assert.equal(result.values.reason, "expired licence");
  });

  test("rejects an unknown decision", () => {
    const result = validateCampaignDecision({ campaignId: "c1", decision: "cancel" });
    assert.equal(result.ok, false);
    assert.deepEqual(codes(result, "decision"), ["invalid"]);
    assert.deepEqual(codes(result, "reason"), []);
  });

  test("requires a campaign id", () => {
    const result = validateCampaignDecision({ decision: "approve" });
    assert.deepEqual(codes(result, "campaignId"), ["required"]);
  });
});

describe("campaign decision mapping", () => {
  test("approve -> approved, reject -> rejected, return -> draft", () => {
    assert.equal(campaignStatusFor("approve"), "approved");
    assert.equal(campaignStatusFor("reject"), "rejected");
    assert.equal(campaignStatusFor("return"), "draft");
  });

  test("only pending_approval is reviewable", () => {
    for (const status of CAMPAIGN_STATUSES) {
      assert.equal(isReviewableCampaignStatus(status), status === "pending_approval");
    }
    assert.equal(isReviewableCampaignStatus("anything"), false);
  });

  test("keeps the six SRS statuses", () => {
    assert.equal(CAMPAIGN_STATUSES.length, 6);
    assert.deepEqual([...CAMPAIGN_STATUSES], [
      "draft",
      "pending_approval",
      "approved",
      "rejected",
      "cancelled",
      "completed",
    ]);
  });

  test("maps statuses to badge tones", () => {
    assert.equal(campaignStatusTone("approved"), "verified");
    assert.equal(campaignStatusTone("pending_approval"), "pending");
    assert.equal(campaignStatusTone("rejected"), "rejected");
    assert.equal(campaignStatusTone("cancelled"), "suspended");
    assert.equal(campaignStatusTone("draft"), "neutral");
    assert.equal(campaignStatusTone("completed"), "neutral");
  });
});

describe("type guards", () => {
  test("isAccountAction accepts only deactivate/reactivate", () => {
    assert.equal(isAccountAction("deactivate"), true);
    assert.equal(isAccountAction("reactivate"), true);
    assert.equal(isAccountAction("suspend"), false);
    assert.equal(isAccountAction(undefined), false);
  });

  test("isCampaignDecision accepts only approve/reject/return", () => {
    for (const decision of CAMPAIGN_DECISIONS) assert.equal(isCampaignDecision(decision), true);
    assert.equal(isCampaignDecision("hide"), false);
    assert.equal(isCampaignDecision(1), false);
  });
});