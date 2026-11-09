import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicShell } from "@/components/shell/app-shell";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { Card, PageHeader } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { landingPathFor } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/** Forgot password - secure reset through a one-time passcode. */
export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session) redirect(landingPathFor(session.user));

  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <PublicShell locale={locale}>
      <div className="mx-auto w-full max-w-md">
        <PageHeader title={t("forgot.title")} subtitle={t("forgot.description")} />

        <Card className="card-pad">
          <ForgotPasswordForm
            labels={{
              mobile: t("forgot.mobile"),
              sendCode: t("forgot.sendCode"),
              resend: t("donorSignup.resend"),
              code: t("forgot.code"),
              newPassword: t("forgot.newPassword"),
              confirmPassword: t("forgot.confirmPassword"),
              reset: t("forgot.reset"),
              resetting: t("forgot.resetting"),
              success: t("forgot.success"),
              errorOtpWrong: t("donorSignup.errorOtpWrong"),
              errorCooldown: t("donorSignup.errorCooldown"),
              errorGeneric: t("state.error"),
              validation: {
                required: t("validation.required"),
                tooShort: t("validation.tooShort"),
                mismatch: t("validation.mismatch"),
              },
              devCodeNote: t("notice.devMode"),
            }}
          />
        </Card>

        <p className="mt-4 text-center">
          <Link href="/" className="text-sm font-semibold text-ink-700 underline-offset-2 hover:underline">
            {t("action.backToLogin")}
          </Link>
        </p>
      </div>
    </PublicShell>
  );
}
