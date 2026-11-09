import { getSession } from "@/lib/auth/session";
import { createSession, requestMeta } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { OtpInvalidError, verifyOtp } from "@/lib/auth/otp";
import { recordAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { isSameOrigin } from "@/lib/csrf";
import { transaction } from "@/lib/db";
import { normalizeMobile, validateDonorSignup } from "@/lib/validation";
import { badRequest, forbidden, json, readJson, serverError } from "@/lib/api";

/**
 * POST /api/auth/donor/signup - G-03 (name, mobile, OTP, consent, password).
 * FR-DON-01: the mobile number is confirmed with a one-time passcode.
 * DR-03: the consent to share contact details after responding Willing is recorded.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const validation = validateDonorSignup(body);
  if (!validation.ok || !validation.values) return badRequest(validation.errors);

  const { name, mobile: rawMobile, password } = validation.values;
  const mobile = normalizeMobile(rawMobile);
  if (!mobile) return badRequest([{ field: "mobile", message: "invalidMobile" }]);

  const code = String(body.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) return badRequest([{ field: "code", message: "required" }]);

  try {
    await verifyOtp(mobile, "donor_signup", code);
  } catch (error) {
    if (error instanceof OtpInvalidError) {
      return json({ ok: false, error: { code: "otp", reason: error.reason } }, 400);
    }
    throw error;
  }

  const passwordHash = await hashPassword(password);
  const meta = await requestMeta();

  const existing = await getSession();
  if (existing) return json({ ok: false, error: { code: "already_signed_in" } }, 409);

  let userId: string;
  try {
    userId = await transaction(async (tx) => {
      const inserted = await tx.query<{ id: string }>(
        `INSERT INTO users (role, phone, password_hash, full_name, status)
         VALUES ('donor', $1, $2, $3, 'active')
         RETURNING id`,
        [mobile, passwordHash, name],
      );
      const newUserId = inserted.rows[0].id;
      await tx.query(
        `INSERT INTO donors (user_id, name, mobile, availability, consent_share_contact_at)
         VALUES ($1, $2, $3, 'available', now())`,
        [newUserId, name, mobile],
      );
      return newUserId;
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return json({ ok: false, error: { code: "mobile_taken" } }, 409);
    }
    console.error("[donor/signup]", error);
    return serverError();
  }

  await createSession(userId, meta);
  await recordAudit({
    actorUserId: userId,
    actorRole: "donor",
    action: "donor_signup_completed",
    entityType: "user",
    entityId: userId,
    ip: meta.ip,
  });
  await createNotification({
    userId,
    category: "account",
    titleEn: "Welcome to Wasl",
    titleUr: "واصل میں خوش آمدید",
    bodyEn: "Complete your profile to be considered for nearby requests and campaigns.",
    bodyUr: "قریبی درخواستوں اور مہموں کے لیے زیرِ غور آنے کے لیے اپنا پروفائل مکمل کریں۔",
    link: "/donor/profile",
  });

  return json({ ok: true, redirect: "/donor" });
}
