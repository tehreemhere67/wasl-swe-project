import { StatusBadge } from "@/components/ui";
import { LogoutIcon, UserIcon } from "@/components/ui/icons";
import { createTranslator } from "@/lib/i18n";
import { type Locale } from "@/lib/i18n/types";
import { type SessionUser } from "@/lib/auth/session";
import type { VerificationStatus } from "@/lib/validation";

/** Profile menu - on every screen (wireframe sheet 15). Uses <details> so it
 * works without JavaScript. */
export function ProfileMenu({ user, locale }: { user: SessionUser; locale: Locale }) {
  const t = createTranslator(locale);
  const status = user.organization?.verificationStatus as VerificationStatus | undefined;
  const initial = user.fullName.trim().charAt(0).toUpperCase();

  return (
    <details className="group relative no-print">
      <summary
        className="flex min-h-touch cursor-pointer list-none items-center gap-2 rounded-full px-1.5 hover:bg-ink-100 [&::-webkit-details-marker]:hidden"
        aria-label={t("nav.account")}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white">
          {initial || <UserIcon className="h-4 w-4" />}
        </span>
      </summary>

      <div className="absolute end-0 z-40 mt-2 w-72 rounded-2xl border border-ink-200 bg-white p-4 shadow-pop">
        <p className="eyebrow">{t("profile.signedInAs")}</p>
        <p className="mt-1 truncate text-base font-bold text-ink-950">{user.fullName}</p>
        <p className="text-sm text-ink-500">
          {t(`role.${user.role === "donation_org" ? "donation_org" : user.role}`)}
        </p>

        {user.organization ? (
          <div className="mt-3 rounded-xl bg-ink-50 p-3">
            <p className="truncate text-sm font-semibold text-ink-900">{user.organization.name}</p>
            <div className="mt-1 flex items-center gap-2">
              {status ? <StatusBadge status={status} label={t(`status.${status}`)} /> : null}
            </div>
          </div>
        ) : null}

        <dl className="mt-3 space-y-1 text-sm">
          {user.email ? (
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">{t("field.email")}</dt>
              <dd className="truncate font-medium text-ink-900">{user.email}</dd>
            </div>
          ) : null}
          {user.phone ? (
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">{t("field.mobile")}</dt>
              <dd className="font-medium text-ink-900">{user.phone}</dd>
            </div>
          ) : null}
        </dl>

        <p className="mt-3 text-xs leading-5 text-ink-500">{t("profile.sessionEnds")}</p>

        <form action="/api/auth/logout" method="post" className="mt-3">
          <button type="submit" className="btn btn-secondary btn-sm w-full">
            <LogoutIcon className="h-4 w-4" />
            {t("nav.logout")}
          </button>
        </form>
      </div>
    </details>
  );
}
