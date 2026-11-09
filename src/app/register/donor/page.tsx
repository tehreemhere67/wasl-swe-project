import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicShell } from "@/components/shell/app-shell";
import { DonorSignupForm } from "@/components/forms/donor-signup-form";
import { Alert, Card, PageHeader } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { landingPathFor } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/** G-03 - Donor signup + OTP. */
export default async function DonorRegisterPage() {
  const session = await getSession();
  if (session) redirect(landingPathFor(session.user));

  const locale = await getLocale();
  const t = createTranslator(locale);

  const validation = {
    required: t("validation.required"),
    invalid: t("validation.invalid"),
    invalidMobile: t("validation.invalidMobile"),
    tooShort: t("validation.tooShort"),
    mismatch: t("validation.mismatch"),
  };

  return (
    <PublicShell locale={locale}>
      <div className="mx-auto w-full max-w-md">
        <PageHeader title={t("donorSignup.title")} subtitle={t("donorSignup.subtitle")} />

        <Card className="card-pad">
          <DonorSignupForm
            labels={{
              name: t("donorSignup.name"),
              mobile: t("donorSignup.mobile"),
              sendCode: t("donorSignup.sendCode"),
              resend: t("donorSignup.resend"),
              code: t("donorSignup.code"),
              codeHint: t("donorSignup.codeHint"),
              codeSent: t("donorSignup.codeSent"),
              consent: t("donorSignup.consent"),
              agree: t("donorSignup.agree"),
              password: t("donorSignup.password"),
              confirmPassword: t("donorSignup.confirmPassword"),
              create: t("donorSignup.create"),
              creating: t("donorSignup.creating"),
              errorOtpWrong: t("donorSignup.errorOtpWrong"),
              errorOtpExpired: t("donorSignup.errorOtpExpired"),
              errorOtpTooMany: t("donorSignup.errorOtpTooMany"),
              errorCooldown: t("donorSignup.errorCooldown"),
              errorMobileTaken: t("donorSignup.errorMobileTaken"),
              errorConsent: t("donorSignup.errorConsent"),
              errorCodeRequired: t("donorSignup.codeRequired"),
              errorGeneric: t("state.error"),
              validation,
              devCodeNote: t("notice.devMode"),
            }}
          />
        </Card>

        <div className="mt-4 space-y-3">
          <Alert tone="info">{t("donorSignup.profileNote")}</Alert>
          <p className="text-center text-sm text-ink-600">
            {t("donorSignup.haveAccount")}{" "}
            <Link href="/" className="font-semibold text-wasl-700 underline-offset-2 hover:underline">
              {t("donorSignup.login")}
            </Link>
          </p>
        </div>
      </div>
    </PublicShell>
  );
}
