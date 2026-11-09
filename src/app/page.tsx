import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";
import { PublicShell } from "@/components/shell/app-shell";
import { Alert, LinkButton } from "@/components/ui";
import { HeroIllustration } from "@/components/ui/hero";
import { getSession } from "@/lib/auth/session";
import { landingPathFor } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * G-01 - Landing page.
 * Wireframe: "WASL" bar, hero image, Phone / email, Password, [Login],
 * [Register as donor], "Register organization (Hospital / Blood bank / Organiser)".
 */
export default async function LandingPage(props: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(landingPathFor(session.user));

  const [locale, params] = await Promise.all([getLocale(), props.searchParams]);
  const t = createTranslator(locale);
  const nextPath = typeof params.next === "string" && params.next.startsWith("/") ? params.next : undefined;

  return (
    <PublicShell locale={locale}>
      <div className="mx-auto w-full max-w-md">
        <div className="card overflow-hidden">
          {/* Card header, mirroring the "WASL" bar in the wireframe */}
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
            <span className="text-lg font-black tracking-tight text-ink-950">{t("app.name")}</span>
            <span className="text-xs font-medium text-ink-500">{t("landing.welcome")}</span>
          </div>

          <HeroIllustration title={t("landing.heroAlt")} />

          <div className="space-y-5 p-5 sm:p-6">
            {params.reset ? (
              <Alert tone="success" role="status">
                {t("forgot.success")}
              </Alert>
            ) : null}

            <div>
              <h1 className="text-lg font-bold text-ink-950">{t("landing.welcome")}</h1>
              <p className="mt-1 text-sm text-ink-500">{t("landing.subtitle")}</p>
            </div>

            <LoginForm
              nextPath={nextPath}
              labels={{
                identifier: t("landing.identifier"),
                identifierPlaceholder: t("landing.identifierPlaceholder"),
                password: t("landing.password"),
                login: t("landing.login"),
                loginPending: t("state.working"),
                errorInvalid: t("landing.errorInvalid"),
                errorLocked: t("landing.errorLocked"),
                errorDeactivated: t("landing.errorDeactivated"),
                errorRequired: t("landing.errorRequired"),
                errorNetwork: t("state.error"),
              }}
            />

            <div className="flex items-center justify-between gap-2 text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-ink-600 underline-offset-2 hover:text-ink-900 hover:underline"
              >
                {t("landing.forgot")}
              </Link>
              <span className="text-xs text-ink-400">{t("landing.remember")}</span>
            </div>

            <div className="space-y-2.5 border-t border-ink-100 pt-5">
              <LinkButton href="/register/donor" variant="secondary" block>
                {t("landing.registerDonor")}
              </LinkButton>

              <Link
                href="/register/organization"
                className="flex min-h-touch flex-col items-center justify-center rounded-2xl px-4 py-2.5 text-center text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-50"
              >
                <span className="underline-offset-4 hover:underline">{t("landing.registerOrg")}</span>
                <span className="text-xs font-normal text-ink-500">{t("landing.registerOrgDetail")}</span>
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-ink-500">{t("landing.adminNote")}</p>
      </div>
    </PublicShell>
  );
}
