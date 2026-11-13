import { destroyAllSessionsForUser, getSession } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { isSameOrigin } from "@/lib/csrf";
import { query, transaction } from "@/lib/db";
import { badRequest, forbidden, json, readJson, unauthorized } from "@/lib/api";
import {
  canChangeAccountStatus,
  isAccountStatus,
  validateAccountAction,
  type AccountAction,
  type AccountStatus,
  type AccountBlockReason,
} from "@/lib/admin/rules";

/**
 * POST /api/admin/accounts/status - A-03 account management (FR-ADM-02).
 *
 * Deactivates or reactivates an account. A deactivated account is refused at
 * login and by getSession(); its sessions are deleted here so it is signed out
 * immediately. Every change is audited (FR-ADM-05 / NFR-SEC-05).
 */

const BLOCK_STATUS: Record<AccountBlockReason, number> = {
  self: 403,
  last_admin: 409,
  already_deactivated: 409,
  already_active: 409,
};

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();

  const session = await getSession();
  if (!session) return unauthorized();
  if (session.user.role !== "admin") return forbidden();

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const validation = validateAccountAction(body);
  if (!validation.ok) return badRequest(validation.errors);

  const userId = validation.values.userId;
  const action = validation.values.action as AccountAction;

  const { rows } = await query<{ id: string; role: string; status: string }>(
    "SELECT id, role, status FROM users WHERE id = $1",
    [userId],
  );
  const target = rows[0];
  if (!target) return json({ ok: false, error: { code: "not_found" } }, 404);
  if (!isAccountStatus(target.status)) {
    return json({ ok: false, error: { code: "server_error" } }, 500);
  }

  const adminCount = await query<{ count: string }>(
    "SELECT count(*)::text AS count FROM users WHERE role = 'admin' AND status = 'active'",
  );
  const activeAdminCount = Number(adminCount.rows[0]?.count ?? 0);

  const decision = canChangeAccountStatus(
    {
      actorId: session.user.id,
      targetId: target.id,
      targetRole: target.role,
      targetStatus: target.status,
      activeAdminCount,
    },
    action,
  );

  if (!decision.ok) {
    return json({ ok: false, error: { code: decision.reason } }, BLOCK_STATUS[decision.reason]);
  }

  const nextStatus: AccountStatus = action === "deactivate" ? "deactivated" : "active";

  await transaction(async (tx) => {
    await tx.query("UPDATE users SET status = $2, updated_at = now() WHERE id = $1", [
      userId,
      nextStatus,
    ]);
  });

  if (nextStatus === "deactivated") {
    await destroyAllSessionsForUser(userId);
  }

  await recordAudit({
    actorUserId: session.user.id,
    actorRole: "admin",
    action: nextStatus === "deactivated" ? "account_deactivated" : "account_reactivated",
    entityType: "user",
    entityId: userId,
    details: { previousStatus: target.status, nextStatus, targetRole: target.role },
  });

  return json({ ok: true, status: nextStatus });
}