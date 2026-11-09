import { issueOtp, OtpCooldownError } from "@/lib/auth/otp";
import { sendSms } from "@/lib/messaging";
import { isProduction } from "@/lib/db";
import { query } from "@/lib/db";
import { isSameOrigin } from "@/lib/csrf";
import { normalizeMobile, type Language } from "@/lib/validation";
import { badRequest, forbidden, json, readJson } from "@/lib/api";

/**
 * POST /api/auth/otp/send - FR-DON-01 / IR-07.
 *
 * `purpose` is `donor_signup` (G-03 "Send code") or `password_reset`
 * (forgot password). The code is generated here, hashed at rest, and sent
 * through the messaging layer. In development the code is also returned so the
 * flow can be demonstrated without a paid SMS provider.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();

  const body = await readJson<{ phone?: string; purpose?: string }>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const phone = normalizeMobile(String(body.phone ?? ""));
  if (!phone) return badRequest([{ field: "mobile", message: "invalidMobile" }]);

  const purpose = body.purpose === "password_reset" ? "password_reset" : "donor_signup";

  const { rows } = await query<{ id: string; preferred_language: Language }>(
    "SELECT id, preferred_language FROM users WHERE phone = $1 LIMIT 1",
    [phone],
  );
  const existing = rows[0] ?? null;

  if (purpose === "donor_signup" && existing) {
    return json({ ok: false, error: { code: "mobile_taken" } }, 409);
  }

  let code: string;
  let resendAfterSeconds: number;
  try {
    const issued = await issueOtp(phone, purpose);
    code = issued.code;
    resendAfterSeconds = issued.resendAfterSeconds;
  } catch (error) {
    if (error instanceof OtpCooldownError) {
      return json({ ok: false, error: { code: "cooldown", seconds: error.secondsRemaining } }, 429);
    }
    throw error;
  }

  const language = existing?.preferred_language ?? "en";
  const message =
    language === "ur"
      ? `${code} آپ کا واصل کوڈ ہے۔ یہ 5 منٹ میں ختم ہو جائے گا۔ کسی کو نہ بتائیں۔`
      : `${code} is your Wasl verification code. It expires in 5 minutes. Do not share it.`;

  const delivery = await sendSms(phone, message);

  return json({
    ok: true,
    resendAfterSeconds,
    delivery: delivery.status,
    // Development aid only; never returned in production.
    devCode: isProduction() ? undefined : code,
  });
}
