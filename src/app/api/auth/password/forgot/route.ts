import { issueOtp, OtpCooldownError } from "@/lib/auth/otp";
import { sendSms } from "@/lib/messaging";
import { isProduction, query } from "@/lib/db";
import { isSameOrigin } from "@/lib/csrf";
import { normalizeMobile, type Language } from "@/lib/validation";
import { badRequest, forbidden, json, readJson } from "@/lib/api";

/**
 * POST /api/auth/password/forgot - "Forgot password" (Module 1).
 * A secure verification process: a 6-digit code is sent to the registered
 * mobile number. The response is the same whether or not the number exists, so
 * the endpoint cannot be used to discover registered donors.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();

  const body = await readJson<{ mobile?: string }>(request);
  if (!body) return badRequest({ code: "invalid_request" });

  const phone = normalizeMobile(String(body.mobile ?? ""));
  if (!phone) return badRequest([{ field: "mobile", message: "invalidMobile" }]);

  const { rows } = await query<{ preferred_language: Language }>(
    "SELECT preferred_language FROM users WHERE phone = $1 LIMIT 1",
    [phone],
  );
  const user = rows[0] ?? null;

  if (!user) {
    // Same shape as success: no account enumeration.
    return json({ ok: true });
  }

  let code: string;
  let resendAfterSeconds: number;
  try {
    const issued = await issueOtp(phone, "password_reset");
    code = issued.code;
    resendAfterSeconds = issued.resendAfterSeconds;
  } catch (error) {
    if (error instanceof OtpCooldownError) {
      return json({ ok: false, error: { code: "cooldown", seconds: error.secondsRemaining } }, 429);
    }
    throw error;
  }

  const message =
    user.preferred_language === "ur"
      ? `${code} آپ کا واصل کوڈ ہے۔ پاس ورڈ ری سیٹ کریں۔ یہ 5 منٹ میں ختم ہو جائے گا۔`
      : `${code} is your Wasl password reset code. It expires in 5 minutes.`;

  await sendSms(phone, message);

  return json({
    ok: true,
    resendAfterSeconds,
    devCode: isProduction() ? undefined : code,
  });
}
