import { Button, PageHeader } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * A-05 - Flags + hide content.
 *
 * Wireframe: "Flags queue", the "Request #102 · reason" row, "Hide/cancel +
 * reason", "Dismiss" and the "org notified" note. Oversight is reserved for
 * Sprint 2 (Module 8), so both actions are disabled.
 */
export default async function AdminFlagsPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("admin.flags.title")} />

      <div className="list-row">
        <span className="text-sm font-semibold text-ink-900">{t("admin.flags.row")}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="danger" disabled>
          {t("admin.flags.hide")}
        </Button>
        <Button type="button" variant="secondary" disabled>
          {t("action.dismiss")}
        </Button>
      </div>

      <p className="mt-2 text-sm text-ink-500">{t("admin.flags.notified")}</p>

      <Placeholder
        wireframe={t("admin.ph.wireframe", { id: "A-05" })}
        description={t("admin.ph.a05")}
        owner={t("admin.owner.admin")}
        sprint={t("admin.ph.sprint2")}
        tone="sprint2"
      />
    </div>
  );
}
