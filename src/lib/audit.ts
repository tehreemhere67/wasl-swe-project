import "server-only";

import { query } from "@/lib/db";
import type { Role } from "@/lib/validation";

/**
 * Audit log - FR-ADM-05 and NFR-SEC-05.
 *
 * Significant actions are recorded with the actor, time and details. Failed
 * logins and refused actions are recorded too, so administrators can review
 * them (NFR-SEC-05).
 */

export type AuditAction =
  | "login_success"
  | "login_failed"
  | "login_locked"
  | "logout"
  | "account_created"
  | "donor_signup_started"
  | "donor_signup_completed"
  | "organization_registered"
  | "organization_reapply"
  | "password_reset_requested"
  | "password_reset_completed"
  | "password_changed"
  | "language_changed"
  | "organization_approved"
  | "organization_rejected"
  | "organization_suspended"
  | "organization_reinstated"
  | "account_deactivated"
  | "account_reactivated"
  | "campaign_approved" //34-36 added by Member 2 Sprint 1: A-04 campaign review
  | "campaign_rejected"
  | "campaign_returned"
  // Member 3 Sprint 1: M4 inventory / M7 monitoring. Additive only.
  | "inventory_batch_created"
  | "inventory_batch_updated"
  | "inventory_batch_archived"
  | "inventory_movement_recorded"
  | "inventory_settings_updated"
  | "inventory_alert_acknowledged"
  | "access_refused";

export interface AuditEntry {
  actorUserId?: string | null;
  actorRole?: Role | null;
  action: AuditAction;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ip?: string | null;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_log (actor_user_id, actor_role, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
      [
        entry.actorUserId ?? null,
        entry.actorRole ?? null,
        entry.action,
        entry.entityType ?? null,
        entry.entityId ?? null,
        JSON.stringify(entry.details ?? {}),
        entry.ip ?? null,
      ],
    );
  } catch (error) {
    // Auditing must never break the user's action.
    console.error("[audit] failed to record", entry.action, error);
  }
}

export interface AuditRow {
  id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export async function listAuditLog(limit = 100): Promise<AuditRow[]> {
  const { rows } = await query<AuditRow>(
    `SELECT a.id, a.actor_user_id, a.actor_role, u.full_name AS actor_name,
            a.action, a.entity_type, a.entity_id, a.details, a.ip_address, a.created_at
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.actor_user_id
      ORDER BY a.created_at DESC
      LIMIT $1`,
    [limit],
  );
  return rows;
}
