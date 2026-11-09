import { OtpInvalidError, verifyOtp } from "@/lib/auth/otp";
import { hashPassword } from "@/lib/auth/password";
import { destroyAllSessionsForUser } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { isSameOrigin } from "@/lib/csrf";
import { query } from "@/lib/db";
import { normalizeMobile, validatePasswordReset } from "@/lib/validation";
import { badRequest, forbidden, json, readJson } from "@/lib/api";

/**
 * POST /api/auth/password/reset - completes the forgot-password flow.
 * The code is verified first (secure verification process), then the password
 * is replaced and every existing session is invalidated.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const validation = validatePasswordReset(body);
  if (!validation.ok || !validation.values) return badRequest(validation.errors);

  const phone = normalizeMobile(String(body.mobile ?? ""));
  if (!phone) return badRequest([{ field: "mobile", message: "invalidMobile" }]);

  const code = String(body.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) return badRequest([{ field: "code", message: "required" }]);

  const { rows } = await query<{ id: string; role: string }>(
    "SELECT id, role FROM users WHERE phone = $1 LIMIT 1",
    [phone],
  );
  const user = rows[0] ?? null;
  if (!user) return json({ ok: false, error: { code: "otp", reason: "not_found" } }, 400);

  try {
    await verifyOtp(phone, "password_reset", code);
  } catch (error) {
    if (error instanceof OtpInvalidError) {
      return json({ ok: false, error: { code: "otp", reason: error.reason } }, 400);
    }
    throw error;
  }

  const passwordHash = await hashPassword(validation.values.password);
  await query(
    `UPDATE users
        SET password_hash = $2, failed_login_attempts = 0, locked_until = NULL, updated_at = now()
      WHERE id = $1`,
    [user.id, passwordHash],
  );
  await destroyAllSessionsForUser(user.id);
  await recordAudit({
    actorUserId: user.id,
    actorRole: user.role as never,
    action: "password_reset_completed",
    entityType: "user",
    entityId: user.id,
  });

  return json({ ok: true, redirect: "/?reset=1" });
}
