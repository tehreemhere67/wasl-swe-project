import { Card, PageHeader } from "@/components/ui";
import {
  InventorySettingsForm,
  type InventorySettingsLabels,
} from "@/components/forms/inventory-settings-form";
import { requireVerifiedOrganization } from "@/lib/auth/guards";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { COMPONENT_LABEL_KEY } from "@/lib/inventory/labels";
import { getBankMonitoringSettings, getStockThresholds } from "@/lib/inventory/monitoring";
import {
  BLOOD_COMPONENTS,
  BLOOD_GROUPS,
  DEFAULT_EXPIRY_WARNING_DAYS,
} from "@/lib/inventory/rules";

/**
 * B-05 - Settings: threshold and windows (FR-MON-01, FR-MON-03/04).
 *
 * Wireframe: "Threshold and Windows", the low-stock threshold (default 5), the
 * expiry warning windows (platelets 2 days, whole blood and red cells 7, plasma
 * 30 - SRS A-31), the SMS alerts checkbox and Save.
 *
 * The drawing says "per blood group"; 7.3 asks for a threshold per blood group
 * AND component, so the grid below carries all four components per row.
 */
export default async function BloodBankSettingsPage() {
  const session = await requireVerifiedOrganization("/bank/settings");
  const locale = await getLocale();
  const t = createTranslator(locale);
  const organizationId = session.user.organization.id;

  const [thresholds, settings] = await Promise.all([
    getStockThresholds(organizationId),
    getBankMonitoringSettings(organizationId),
  ]);

  const thresholdMap: Record<string, number> = {};
  for (const row of thresholds) {
    thresholdMap[`${row.bloodGroup}|${row.component}`] = row.thresholdUnits;
  }

  const labels: InventorySettingsLabels = {
    thresholdNote: t("inventory.settings.thresholdNote"),
    windowsTitle: t("inventory.settings.windowsTitle"),
    windowsNote: t("inventory.settings.windowsNote"),
    sms: t("inventory.settings.sms"),
    save: t("inventory.settings.save"),
    saving: t("inventory.settings.saving"),
    saved: t("inventory.settings.saved"),
    errorGeneric: t("inventory.error.generic"),
    group: t("inventory.col.group"),
    groupLabels: Object.fromEntries(
      BLOOD_GROUPS.map((group) => [group, t(`blood.${group}`)]),
    ),
    componentLabels: Object.fromEntries(
      BLOOD_COMPONENTS.map((component) => [component, t(COMPONENT_LABEL_KEY[component])]),
    ),
    defaultDays: { ...DEFAULT_EXPIRY_WARNING_DAYS },
    errors: {
      "inventory.error.threshold": t("inventory.error.threshold"),
      "inventory.error.warningDays": t("inventory.error.warningDays"),
      "inventory.error.bloodGroup": t("inventory.error.bloodGroup"),
      "inventory.error.component": t("inventory.error.component"),
    },
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title={t("inventory.settings.title")} />

      <Card className="card-pad">
        <InventorySettingsForm
          labels={labels}
          initial={{
            thresholds: thresholdMap,
            warningDays: settings.expiryWarningDays as Record<string, number>,
            smsAlerts: settings.smsAlerts,
          }}
        />
      </Card>
    </div>
  );
}
