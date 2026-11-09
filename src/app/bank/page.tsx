import { Alert, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { requireVerifiedOrganization } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * B-01 - Blood bank dashboard + alerts.
 *
 * Wireframe: the bank name with its verified badge and "Alerts (3)", the
 * expiry and low-stock alert rows, the Add Batch / Inventory / Open req /
 * Settings actions and the last-updated line. Inventory and monitoring belong
 * to Module 4 / Module 7 (Sprint 1).
 */
export default async function BloodBankDashboardPage() {
  const session = await requireVerifiedOrganization("/bank");
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader
        title={session.user.organization.name}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="verified" label={t("status.verified")} />
            <span className="text-sm font-semibold text-ink-700">
              {t("bank.alerts", { count: 3 })}
            </span>
          </div>
        }
      />

      <div className="space-y-2">
        <Alert tone="warning">{t("bank.alert.plateletExpiry")}</Alert>
        <Alert tone="warning">{t("bank.alert.lowStock", { units: 4 })}</Alert>
      </div>

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
        {t("bank.lastUpdated", { time: t("time.now") })}
      </p>

      <Placeholder
        wireframe={t("bloodbank.ph.wireframe", { id: "B-01" })}
        description={t("bloodbank.ph.b01")}
        owner={t("bloodbank.owner.monitoring")}
        sprint={t("bloodbank.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
