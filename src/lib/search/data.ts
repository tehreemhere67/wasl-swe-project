import "server-only";

import { query } from "@/lib/db";
import {
  groupAvailability,
  type BloodBankResult,
  type CandidateBatch,
  type SearchValues,
} from "./rules";

/**
 * Database access for the hospital blood availability search (Module 5).
 *
 * It only READS Member 3's inventory tables; it never writes stock (A-12: a hospital
 * can see cross-bank inventory but not change it). The query keeps the candidate set
 * small - verified blood banks, the chosen group and component, batches not archived -
 * and `groupAvailability` in `./rules` then applies FR-INV-08 so the exclusion logic
 * exists in exactly one place.
 */

interface CandidateRow {
  batch_id: string;
  organization_id: string;
  name: string;
  verification_status: string;
  area: string | null;
  address_karachi: string;
  official_phone: string;
  official_email: string;
  units: number | string;
  reserved_units: number | string | null;
  status: string;
  expires_at: Date | string;
  last_updated_at: Date | string | null;
}

export interface AvailabilitySearch {
  values: SearchValues;
  results: BloodBankResult[];
  /** When the search ran, so the screen can show how fresh the answer is. */
  searchedAt: string;
}

/**
 * FR-INV-07, FR-INV-08, FR-INV-09 / UC-03: search all verified blood banks.
 *
 * Reserved units come from one aggregate over reservations that are still active and
 * whose hold has not run out (the same projection the blood bank's own list uses), and
 * the bank's "last updated" time is the newest change to any of its batches or movements.
 */
export async function searchAvailability(
  values: SearchValues,
  now: Date = new Date(),
): Promise<AvailabilitySearch> {
  const result = await query<CandidateRow>(
    `SELECT b.id                      AS batch_id,
            o.id                      AS organization_id,
            o.name,
            o.verification_status,
            o.area,
            o.address_karachi,
            o.official_phone,
            o.official_email,
            b.units,
            COALESCE(r.reserved_units, 0) AS reserved_units,
            b.status,
            b.expires_at,
            GREATEST(
              (SELECT MAX(x.updated_at) FROM inventory_batches x WHERE x.organization_id = o.id),
              (SELECT MAX(m.created_at) FROM inventory_movements m WHERE m.organization_id = o.id)
            )                         AS last_updated_at
       FROM inventory_batches b
       JOIN organizations o ON o.id = b.organization_id
       LEFT JOIN (
         SELECT batch_id, SUM(units) AS reserved_units
           FROM inventory_reservations
          WHERE status = 'active'
            AND hold_until > now()
          GROUP BY batch_id
       ) r ON r.batch_id = b.id
      WHERE o.type = 'blood_bank'
        AND o.verification_status = 'verified'
        AND b.blood_group = $1
        AND b.component = $2
        AND b.archived_at IS NULL`,
    [values.bloodGroup, values.component],
  );

  const candidates: CandidateBatch[] = result.rows.map((row) => ({
    batchId: row.batch_id,
    organizationId: row.organization_id,
    organizationName: row.name,
    verificationStatus: row.verification_status,
    area: row.area,
    address: row.address_karachi,
    phone: row.official_phone,
    email: row.official_email,
    units: Number(row.units),
    reservedUnits: Number(row.reserved_units ?? 0),
    status: row.status,
    expiresAt: row.expires_at,
    lastUpdatedAt: row.last_updated_at,
  }));

  return {
    values,
    results: groupAvailability(candidates, now),
    searchedAt: now.toISOString(),
  };
}
