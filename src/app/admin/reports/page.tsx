import { Button, PageHeader, TextInput } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

const TABS = ["tabRequests", "tabDonations", "tabInventory"] as const;

/**
 * A-07 - Reports.
 *
 * Wireframe: "Reports" with a date range, the Requests / Donation activity /
 * Inventory tabs, the counts-by-status/urgency/hospital line and the
 * "Aggregate only" dashed note. Reports are reserved for Sprint 2 (Module 8).
 */
export default async function AdminReportsPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("admin.reports.title")} />

      <div>
        <span className="label">{t("admin.reports.dateRange")}</span>
        <div className="flex flex-wrap items-center gap-2">
          <TextInput
            type="date"
            name="from"
            aria-label={t("admin.reports.dateRange")}
            className="w-40"
          />
          <span aria-hidden="true" className="text-ink-400">
            —
          </span>
          <TextInput
            type="date"
            name="to"
            aria-label={t("admin.reports.dateRange")}
            className="w-40"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((tab, index) => (
          <Button
            key={tab}
            type="button"
            size="sm"
            variant={index === 0 ? "primary" : "secondary"}
          >
            {t(`admin.reports.${tab}`)}
          </Button>
        ))}
      </div>

      <p className="mt-4 text-sm text-ink-700">{t("admin.reports.summary")}</p>

      <div className="mt-4 rounded-2xl border border-dashed border-ink-300 bg-white px-4 py-5 text-sm leading-6 text-ink-700">
        {t("admin.reports.privacy")}
      </div>

      <Placeholder
        wireframe={t("admin.ph.wireframe", { id: "A-07" })}
        description={t("admin.ph.a07")}
        owner={t("admin.owner.admin")}
        sprint={t("admin.ph.sprint2")}
        tone="sprint2"
      />
    </div>
  );
}
