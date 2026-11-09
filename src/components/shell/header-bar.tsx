import { StatusBadge, type VerificationStatus } from "@/components/ui";
import { type Locale } from "@/lib/i18n/types";
import { createTranslator } from "@/lib/i18n";
import { type SessionUser } from "@/lib/auth/session";
import { NotificationBell } from "./notification-bell";
import { LanguageSwitch } from "./language-switch";
import { ProfileMenu } from "./profile-menu";

/**
 * The global header bar - present on every screen (wireframe sheet 15:
 * "Menus (language switch, alerts bell, profile) are on every screen").
 */
export function HeaderBar({
  user,
  locale,
  areaLabel,
}: {
  user: SessionUser | null;
  locale: Locale;
  areaLabel?: string;
}) {
  const t = createTranslator(locale);
  const status = user?.organization?.verificationStatus as VerificationStatus | undefined;

  return (
    <header className="header-bar no-print">
      <div className="header-bar-inner">
        <a href={user ? "#" : "/"} className="flex items-center gap-2.5" aria-label="Wasl">
          <span className="brand-mark" aria-hidden="true">
            {locale === "ur" ? "و" : "W"}
          </span>
          <span className="hidden text-base font-black tracking-tight text-ink-950 sm:block">
            {t("app.name")}
          </span>
        </a>

        {areaLabel ? (
          <span className="hidden text-sm font-medium text-ink-500 md:block">· {areaLabel}</span>
        ) : null}

        {user?.organization ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate max-w-[9rem] text-sm font-semibold text-ink-900 sm:max-w-[16rem]">
              {user.organization.name}
            </span>
            {status ? (
              <StatusBadge status={status} label={t(`status.${status}`)} />
            ) : null}
          </span>
        ) : null}

        <div className="ms-auto flex items-center gap-1">
          {user ? <NotificationBell userId={user.id} locale={locale} href="/notifications" /> : null}
          <LanguageSwitch locale={locale} />
          {user ? <ProfileMenu user={user} locale={locale} /> : null}
        </div>
      </div>
    </header>
  );
}
