import { BellIcon } from "@/components/ui/icons";
import { unreadNotificationCount } from "@/lib/notifications";
import { createTranslator } from "@/lib/i18n";
import { type Locale } from "@/lib/i18n/types";

/** Notification bell with the unread count - FR-NOT-04. */
export async function NotificationBell({
  userId,
  locale,
  href = "/notifications",
}: {
  userId: string;
  locale: Locale;
  href?: string;
}) {
  const t = createTranslator(locale);
  const count = await unreadNotificationCount(userId);

  return (
    <a
      href={href}
      className="relative inline-flex min-h-touch min-w-touch items-center justify-center rounded-full text-ink-600 hover:bg-ink-100 hover:text-ink-900"
      aria-label={count > 0 ? t("bell.unread", { count }) : t("bell.none")}
      title={count > 0 ? t("bell.unread", { count }) : t("bell.none")}
    >
      <BellIcon className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -top-0.5 end-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-wasl-600 px-1 text-[11px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </a>
  );
}
