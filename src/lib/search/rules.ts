/**
 * Hospital blood availability search rules (Module 5, screen H-02).
 *
 * Deliberately framework-free and database-free, like `src/lib/inventory/rules.ts`,
 * so every rule can be unit-tested directly with `node:test`
 * (see `tests/member-5/unit`). The page, the JSON route and the database layer
 * call these functions; none of them re-implements an exclusion rule.
 *
 * SRS references:
 *  - FR-INV-07  a verified hospital searches by blood group and component and sees, for each
 *               matching blood bank: bank, verification status, available quantity,
 *               earliest expiry, area and contact details            [A-12]
 *  - FR-INV-08  expired, not-Approved and reserved units are excluded, and so is any
 *               inventory of an organization that is not Verified    (BR-1)
 *  - FR-INV-09  every result shows when the bank's inventory was last updated and the
 *               "as reported by the blood bank" statement             (BR-4)
 *  - FR-VER-03  a hospital that is not Verified cannot search
 *  - A-12       donors and the public never see inventory
 *
 * The availability rule itself is Member 3's `countsAsAvailable`, reused as it is, so the
 * blood bank's own list (B-02) and the hospital search can never disagree.
 */

import {
  BLOOD_COMPONENTS,
  BLOOD_GROUPS,
  countsAsAvailable,
  toDate,
  type BloodComponent,
  type BloodGroup,
} from "../inventory/rules";

export { BLOOD_COMPONENTS, BLOOD_GROUPS };
export type { BloodComponent, BloodGroup };

// ---------------------------------------------------------------------------
// FR-INV-07: validating the search form
// ---------------------------------------------------------------------------

export interface SearchFieldError {
  field: "bloodGroup" | "component";
  /** A stable code the page translates (never a hard-coded English sentence). */
  code: "required" | "invalid";
}

export interface SearchValues {
  bloodGroup: BloodGroup;
  component: BloodComponent;
}

export type SearchValidation =
  | { ok: true; values: SearchValues }
  | { ok: false; errors: SearchFieldError[] };

/** Anything a query string or JSON body can hold for one field. */
type RawValue = string | string[] | null | undefined;

function single(value: RawValue): string {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" ? first.trim() : "";
}

/**
 * FR-INV-07: both the blood group and the component are required and must be one of the
 * controlled values in SRS 4.2. A missing field is `required`; anything else is `invalid`.
 */
export function validateSearchInput(input: {
  bloodGroup?: RawValue;
  component?: RawValue;
}): SearchValidation {
  const errors: SearchFieldError[] = [];
  const bloodGroup = single(input.bloodGroup);
  const component = single(input.component);

  if (bloodGroup === "") errors.push({ field: "bloodGroup", code: "required" });
  else if (!(BLOOD_GROUPS as readonly string[]).includes(bloodGroup))
    errors.push({ field: "bloodGroup", code: "invalid" });

  if (component === "") errors.push({ field: "component", code: "required" });
  else if (!(BLOOD_COMPONENTS as readonly string[]).includes(component))
    errors.push({ field: "component", code: "invalid" });

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    values: { bloodGroup: bloodGroup as BloodGroup, component: component as BloodComponent },
  };
}

/**
 * True when the request carries any search input at all. The empty form (a first visit to
 * H-02) shows no errors; a submitted form with a missing field does.
 */
export function hasSearchInput(input: { bloodGroup?: RawValue; component?: RawValue }): boolean {
  return input.bloodGroup !== undefined || input.component !== undefined;
}

// ---------------------------------------------------------------------------
// FR-INV-07 / FR-INV-08: turning candidate batches into one row per blood bank
// ---------------------------------------------------------------------------

/**
 * One stored batch of a blood bank plus everything the exclusion rules need. The database
 * layer supplies these rows; deciding what counts is done here, in one place.
 */
export interface CandidateBatch {
  batchId: string;
  organizationId: string;
  organizationName: string;
  /** `pending` | `verified` | `rejected` | `suspended` - only `verified` ever counts. */
  verificationStatus: string;
  area: string | null;
  address: string;
  phone: string;
  email: string;
  units: number;
  /** Units held by reservations that are still active (hold not run out). */
  reservedUnits: number;
  /** `awaiting_testing` | `approved` | `rejected` */
  status: string;
  expiresAt: Date | string;
  /** When this blood bank's inventory last changed (any batch, any movement). */
  lastUpdatedAt: Date | string | null;
}

export interface BloodBankResult {
  organizationId: string;
  name: string;
  /** FR-INV-07: always `verified` - an unverified bank never appears. */
  verificationStatus: "verified";
  /** Units that count as available across the bank's matching batches. */
  availableUnits: number;
  /** How many batches those units come from. */
  batchCount: number;
  /** The soonest expiry among the batches that count. ISO string. */
  earliestExpiry: string;
  area: string;
  phone: string;
  email: string;
  /** FR-INV-09. ISO string, or null if the bank has never recorded anything. */
  lastUpdatedAt: string | null;
}

/**
 * Applies FR-INV-08 batch by batch, then groups by blood bank.
 *
 * - A batch counts only if Member 3's `countsAsAvailable` says so: bank Verified, status
 *   Approved, not expired, and at least one unit left after active reservations.
 * - The quantity added for a batch is `units - reservedUnits` (never negative).
 * - Banks are listed with the largest available quantity first; ties go to the sooner
 *   expiry, then to the bank name, so the order is stable.
 */
export function groupAvailability(
  batches: readonly CandidateBatch[],
  now: Date = new Date(),
): BloodBankResult[] {
  const byBank = new Map<string, BloodBankResult & { expiryMs: number }>();

  for (const batch of batches) {
    const free = Math.max(0, batch.units - batch.reservedUnits);
    const counts = countsAsAvailable({
      status: batch.status,
      expiresAt: batch.expiresAt,
      units: batch.units,
      // The reserved quantity is already summed by the query; one active hold that never
      // runs out inside this call represents it.
      reservations:
        batch.reservedUnits > 0
          ? [{ units: batch.reservedUnits, status: "active", holdUntil: new Date(now.getTime() + 1000 * 60) }]
          : [],
      organizationVerified: batch.verificationStatus === "verified",
      now,
    });
    if (!counts || free <= 0) continue;

    const expires = toDate(batch.expiresAt);
    if (!expires) continue;
    const expiryMs = expires.getTime();
    const updated = toDate(batch.lastUpdatedAt);

    const existing = byBank.get(batch.organizationId);
    if (existing) {
      existing.availableUnits += free;
      existing.batchCount += 1;
      if (expiryMs < existing.expiryMs) {
        existing.expiryMs = expiryMs;
        existing.earliestExpiry = expires.toISOString();
      }
    } else {
      byBank.set(batch.organizationId, {
        organizationId: batch.organizationId,
        name: batch.organizationName,
        verificationStatus: "verified",
        availableUnits: free,
        batchCount: 1,
        earliestExpiry: expires.toISOString(),
        expiryMs,
        // FR-INV-07: area; the full address is the fallback when no area was entered.
        area: (batch.area && batch.area.trim()) || batch.address,
        phone: batch.phone,
        email: batch.email,
        lastUpdatedAt: updated ? updated.toISOString() : null,
      });
    }
  }

  return [...byBank.values()]
    .sort(
      (a, b) =>
        b.availableUnits - a.availableUnits ||
        a.expiryMs - b.expiryMs ||
        a.name.localeCompare(b.name),
    )
    .map(({ expiryMs: _expiryMs, ...result }) => result);
}

/** FR-INV-07: a phone number as a `tel:` link target (digits and a leading +). */
export function telHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}

/** 5.5: where "create a blood request" leads, carrying what was searched. */
export function createRequestHref(values: SearchValues): string {
  const params = new URLSearchParams({
    bloodGroup: values.bloodGroup,
    component: values.component,
  });
  return `/hospital/requests/new?${params.toString()}`;
}
