import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicShell } from "@/components/shell/app-shell";
import { OrgRegistrationForm } from "@/components/forms/org-registration-form";
import { Card, PageHeader } from "@/components/ui";
import { getSession } from "@/lib/auth/session";
import { landingPathFor } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/** G-02 - Organization registration. */
export default async function OrganizationRegisterPage() {
  const session = await getSession();
  if (session) redirect(landingPathFor(session.user));

  const locale = await getLocale();
  const t = createTranslator(locale);

  const validation = {
    required: t("validation.required"),
    invalid: t("validation.invalid"),
    invalidEmail: t("validation.invalidEmail"),
    invalidMobile: t("validation.invalidMobile"),
    tooShort: t("validation.tooShort"),
    mismatch: t("validation.mismatch"),
  };

  return (
    <PublicShell locale={locale}>
      <div className="mx-auto w-full max-w-2xl">
        <PageHeader title={t("orgReg.title")} subtitle={t("orgReg.subtitle")} />

        <Card className="card-pad">
          <OrgRegistrationForm
            labels={{
              title: t("orgReg.title"),
              subtitle: t("orgReg.reviewNote"),
              type: t("orgReg.type"),
              typeSelect: t("orgReg.typeSelect"),
              typeHospital: t("orgReg.typeHospital"),
              typeBloodBank: t("orgReg.typeBloodBank"),
              typeOrganiser: t("orgReg.typeOrganiser"),
              name: t("orgReg.name"),
              namePlaceholder: t("orgReg.namePlaceholder"),
              address: t("orgReg.address"),
              addressPlaceholder: t("orgReg.addressPlaceholder"),
              officialPhone: t("orgReg.officialPhone"),
              phoneHint: t("orgReg.phoneHint"),
              officialEmail: t("orgReg.officialEmail"),
              licence: t("orgReg.licence"),
              licencePlaceholder: t("orgReg.licencePlaceholder"),
              representativeName: t("orgReg.representativeName"),
              designation: t("orgReg.designation"),
              designationPlaceholder: t("orgReg.designationPlaceholder"),
              upload: t("orgReg.upload"),
              uploadHint: t("orgReg.uploadHint"),
              password: t("orgReg.password"),
              confirmPassword: t("orgReg.confirmPassword"),
              submit: t("orgReg.submit"),
              submitting: t("orgReg.submitting"),
              errorLicence: t("orgReg.errorLicence"),
              errorDocument: t("orgReg.errorDocument"),
              errorFileType: t("orgReg.errorFileType"),
              errorFileSize: t("orgReg.errorFileSize"),
              errorExists: t("orgReg.errorExists"),
              errorGeneric: t("state.error"),
              required: t("validation.required"),
              typeRequired: t("validation.required"),
              validation,
            }}
          />
        </Card>

        <p className="mt-4 text-center text-sm text-ink-600">
          {t("orgReg.haveAccount")}{" "}
          <Link href="/" className="font-semibold text-wasl-700 underline-offset-2 hover:underline">
            {t("orgReg.login")}
          </Link>
        </p>
      </div>
    </PublicShell>
  );
}
