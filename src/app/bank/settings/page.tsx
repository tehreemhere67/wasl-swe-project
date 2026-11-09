import { Button, Card, Checkbox, PageHeader } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * B-05 - Settings (thresholds and windows).
 *
 * Wireframe: "Threshold and Windows", the low-stock threshold note, the expiry
 * warning windows (platelets 2 days, RBC and whole blood 7 days, plasma 30
 * days - SRS A-31), the SMS alerts checkbox and Save. Monitoring belongs to
 * Module 7 (Sprint 1); Save is rendered without submitting yet.
 */
export default async function BloodBankSettingsPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("bank.settings.title")} />

      <Card className="card-pad space-y-4">
        <p className="text-sm text-ink-700">{t("bank.settings.threshold")}</p>
        <p className="text-sm text-ink-700">{t("bank.settings.expiry")}</p>
        <Checkbox label={t("bank.settings.smsAlerts")} defaultChecked />
        <Button type="button" block>
          {t("action.save")}
        </Button>
      </Card>

      <Placeholder
        wireframe={t("bloodbank.ph.wireframe", { id: "B-05" })}
        description={t("bloodbank.ph.b05")}
        owner={t("bloodbank.owner.monitoring")}
        sprint={t("bloodbank.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
