import { formatDate, formatDateTime } from "@/lib/format";
import { AcknowledgeAlert } from "@/components/forms/acknowledge-alert";
import { Alert, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { requireVerifiedOrganization } from "@/lib/auth/guards";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { COMPONENT_LABEL_KEY } from "@/lib/inventory/labels";
import { listActiveAlerts, runMonitoringSweep } from "@/lib/inventory/monitoring";
import type { BloodComponent } from "@/lib/inventory/rules";

/**
 * B-01 - Blood bank dashboard + alerts (FR-MON-01, FR-MON-05).
 *
 * The alert rows are real: opening the dashboard runs the monitoring sweep, then
 * shows every active alert with a link to its batch. 7.4 adds acknowledgement and
 * the notification-centre view; 7.3 adds low-stock alerts (the shape is already
 * handled here).
 */
export default async function BloodBankDashboardPage() {
  const session = await requireVerifiedOrganization("/bank");
  const locale = await getLocale();
  const t = createTranslator(locale);

  const organizationId = session.user.organization.id;
  await runMonitoringSweep(organizationId);
  const alerts = await listActiveAlerts(organizationId);

  return (
    <div>
      <PageHeader
        title={session.user.organization.name}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="verified" label={t("status.verified")} />
            <span className="text-sm font-semibold text-ink-700">
              {t("bank.alerts", { count: alerts.length })}
            </span>
          </div>
        }
      />

      {alerts.length === 0 ? (
        <Alert tone="success">{t("inventory.alert.none")}</Alert>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert) => {
            const component = t(
              COMPONENT_LABEL_KEY[alert.component as BloodComponent] ?? "field.component",
            );
            const title =
              alert.type === "expiry"
                ? t("inventory.alert.expiryTitle", {
                    group: t(`blood.${alert.bloodGroup}`),
                    component,
                  })
                : t("inventory.alert.lowStockTitle", {
                    group: t(`blood.${alert.bloodGroup}`),
                    component,
                  });

            const body =
              alert.type === "expiry"
                ? t("inventory.alert.expiryBody", {
                    units: alert.quantity,
                    date: formatDate(alert.expiresAt, locale),
                  })
                : t("inventory.alert.lowStockBody", { units: alert.quantity });

            return (
              <li
                key={alert.id}
                data-alert-id={alert.id}
                className="rounded-xl border border-ink-100 bg-white p-3"
              >
                <Alert tone="warning" title={title}>
                  {body}
                </Alert>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={alert.batchId ? `/bank/inventory/${alert.batchId}` : "/bank/inventory"}
                    className="text-xs font-semibold text-wasl-700 underline-offset-2 hover:underline"
                  >
                    {t("inventory.alert.openBatch")}
                  </a>
                  <AcknowledgeAlert
                    alertId={alert.id}
                    label={t("inventory.alert.acknowledge")}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <LinkButton href="/bank/inventory/new">{t("nav.bank.addBatch")}</LinkButton>
        <LinkButton href="/bank/inventory" variant="secondary">
          {t("nav.bank.inventory")}
        </LinkButton>
        <LinkButton href="/bank/requests" variant="secondary">
          {t("nav.bank.openRequests")}
        </LinkButton>
        <LinkButton href="/bank/settings" variant="secondary">
          {t("nav.bank.settings")}
        </LinkButton>
      </div>

      <p className="mt-6 text-xs text-ink-500">
        {t("bank.lastUpdated", { time: formatDateTime(new Date(), locale) })}
      </p>
    </div>
  );
}
