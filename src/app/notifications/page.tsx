import Link from "next/link";
import { PublicShell } from "@/components/shell/app-shell";
import { Alert, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/guards";
import { listNotifications, unreadNotificationCount } from "@/lib/notifications";
import { formatDateTime, relativeTimeParts } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * G-05 - Notification centre (FR-NOT-04).
 * Wireframe: "Notifications (3 unread)" rows with title, source and time,
 * "Delivery: Sent / Delivered / Failed".
 */
export default async function NotificationsPage() {
  const session = await requireUser("/notifications");
  const locale = await getLocale();
  const t = createTranslator(locale);

  const [items, unread] = await Promise.all([
    listNotifications(session.user.id),
    unreadNotificationCount(session.user.id),
  ]);

  const deliveryLabel: Record<string, string> = {
    in_platform: t("notif.delivery.in_platform"),
    sent: t("notif.delivery.sent"),
    delivered: t("notif.delivery.delivered"),
    failed: t("notif.delivery.failed"),
  };

  function relative(createdAt: string): string {
    const parts = relativeTimeParts(createdAt);
    if (parts.unit === "now") return t("time.now");
    if (parts.unit === "minutes") return t("time.minutesAgo", { count: parts.count });
    if (parts.unit === "hours") return t("time.hoursAgo", { count: parts.count });
    return t("time.daysAgo", { count: parts.count });
  }

  return (
    <PublicShell locale={locale}>
      <div className="mx-auto w-full max-w-2xl">
        <PageHeader
          title={t("notif.title")}
          subtitle={t("notif.subtitle")}
          actions={
            unread > 0 ? (
              <form action="/api/notifications/read" method="post">
                <input type="hidden" name="all" value="1" />
                <Button type="submit" variant="secondary" size="sm">
                  {t("notif.markAllRead")}
                </Button>
              </form>
            ) : (
              <span className="text-sm text-ink-500">{t("notif.unread", { count: 0 })}</span>
            )
          }
        />

        {items.length === 0 ? (
          <EmptyState title={t("notif.empty")} description={t("notif.subtitle")} />
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const title = locale === "ur" ? item.title_ur : item.title_en;
              const body = locale === "ur" ? item.body_ur : item.body_en;
              const isUnread = !item.read_at;
              return (
                <Card key={item.id} className={`p-4 ${isUnread ? "border-wasl-200" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-ink-950">
                        {isUnread ? (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-wasl-600" aria-hidden="true" />
                        ) : null}
                        <span className="truncate">{title}</span>
                      </p>
                      {body ? <p className="mt-1 text-sm text-ink-700">{body}</p> : null}
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
                        <span>{t(`notif.category.${item.category}`)}</span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={item.created_at} title={formatDateTime(item.created_at, locale)}>
                          {relative(item.created_at)}
                        </time>
                        <span aria-hidden="true">·</span>
                        <span>
                          {t("notif.deliveryLabel")}: {deliveryLabel[item.delivery_status] ?? item.delivery_status}
                        </span>
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {item.link ? (
                        <Link href={item.link} className="text-sm font-semibold text-wasl-700 hover:text-wasl-800">
                          {t("notif.open")}
                        </Link>
                      ) : null}
                      {isUnread ? (
                        <form action="/api/notifications/read" method="post">
                          <input type="hidden" name="id" value={item.id} />
                          <button
                            type="submit"
                            className="text-xs font-medium text-ink-500 underline-offset-2 hover:text-ink-800 hover:underline"
                          >
                            {t("notif.markRead")}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-5">
          <Alert tone="info">{t("notice.devMode")}</Alert>
        </div>
      </div>
    </PublicShell>
  );
}
