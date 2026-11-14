import type { BloodComponent, MovementType, TestingStatus } from "./rules";

/**
 * Maps the SRS controlled values (SRS 4.2) to translation keys.
 *
 * The keys live in `src/lib/i18n/parts/bloodbank.ts`; keeping the mapping here
 * means the table and the form show the same wording in both languages.
 */

export const COMPONENT_LABEL_KEY: Record<BloodComponent, string> = {
  "Whole blood": "component.wholeBlood",
  "Red blood cells": "component.redCells",
  Platelets: "component.platelets",
  Plasma: "component.plasma",
};

export const TESTING_STATUS_LABEL_KEY: Record<TestingStatus, string> = {
  awaiting_testing: "inventory.status.awaiting",
  approved: "inventory.status.approved",
  rejected: "inventory.status.rejected",
};

/** Badge tone for a testing status, reusing the shared design tokens. */
export const TESTING_STATUS_TONE: Record<
  TestingStatus,
  "neutral" | "verified" | "pending" | "rejected" | "suspended"
> = {
  awaiting_testing: "pending",
  approved: "verified",
  rejected: "rejected",
};

/** B-04: the eight movement types from SRS 4.2 (A-08). */
export const MOVEMENT_LABEL_KEY: Record<MovementType, string> = {
  added: "inventory.movement.added",
  reserved: "inventory.movement.reserved",
  reservation_released: "inventory.movement.reservation_released",
  issued: "inventory.movement.issued",
  transferred_out: "inventory.movement.transferred_out",
  expired: "inventory.movement.expired",
  discarded: "inventory.movement.discarded",
  correction: "inventory.movement.correction",
};
