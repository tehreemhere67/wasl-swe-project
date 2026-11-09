import type { ReactNode } from "react";
import { createTranslator } from "@/lib/i18n";
import { type Locale } from "@/lib/i18n/types";
import { type SessionUser } from "@/lib/auth/session";
import { HeaderBar } from "./header-bar";
import { RoleNav, type NavItem } from "./role-nav";

/** Shared footer. The availability disclaimer is part of FR-INV-09/SAF-01. */
export function Footer({ locale }: { locale: Locale }) {
  const t = createTranslator(locale);
  return (
    <footer className="no-print mt-10 border-t border-ink-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs leading-5 text-ink-500 sm:px-6">
        <p className="font-semibold text-ink-700">{t("footer.rights")}</p>
        <p>{t("footer.scope")}</p>
        <p>{t("notice.platformCoordinates")}</p>
      </div>
    </footer>
  );
}

/**
 * The signed-in application shell: header bar, role navigation, content and
 * footer. Every role area layout renders its pages inside this.
 */
export function AppShell({
  user,
  locale,
  areaLabel,
  nav,
  children,
}: {
  user: SessionUser;
  locale: Locale;
  areaLabel: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-pop"
      >
        {createTranslator(locale)("nav.skipToContent")}
      </a>
      <HeaderBar user={user} locale={locale} areaLabel={areaLabel} />
      {nav.length > 0 ? <RoleNav items={nav} /> : null}
      <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <Footer locale={locale} />
    </>
  );
}

/** Shell used by the public screens (G-01, G-02, G-03, forgot password). */
export function PublicShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <>
      <HeaderBar user={null} locale={locale} />
      <main id="main" className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
        {children}
      </main>
      <Footer locale={locale} />
    </>
  );
}
