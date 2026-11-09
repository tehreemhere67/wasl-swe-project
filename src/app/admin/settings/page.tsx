import { Button, Card, PageHeader } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * A-08 - Settings + areas.
 *
 * Wireframe: "Settings", the compatibility table, the 30/15 km distances with
 * 60/40 weights, the hold period and escalation timings, the Karachi areas in
 * English and Urdu, and Save. Platform settings are reserved for Sprint 2
 * (Module 8).
 */
export default async function AdminSettingsPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("nav.admin.settings")} />

      <Card className="card-pad space-y-4">
        <h2 className="text-base font-bold text-ink-950">{t("admin.settings.compatibility")}</h2>
        <p className="text-sm text-ink-700">{t("admin.settings.distances")}</p>
        <p className="text-sm text-ink-700">{t("admin.settings.hold")}</p>
        <p className="text-sm text-ink-700">{t("admin.settings.areas")}</p>

        <Button type="button" block disabled>
          {t("action.save")}
        </Button>
      </Card>

      <Placeholder
        wireframe={t("admin.ph.wireframe", { id: "A-08" })}
        description={t("admin.ph.a08")}
        owner={t("admin.owner.admin")}
        sprint={t("admin.ph.sprint2")}
        tone="sprint2"
      />
    </div>
  );
}
