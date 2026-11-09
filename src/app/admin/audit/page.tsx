import { Card, PageHeader, TextInput } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

const SAMPLE_ROWS = ["row1", "row2", "row3"] as const;

/**
 * A-06 - Audit log.
 *
 * Wireframe: "Audit log", the Time / User / Action / Details table with sample
 * rows and the Filter field. The audit log is reserved for Sprint 2
 * (Module 8).
 */
export default async function AdminAuditPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  const rows = SAMPLE_ROWS.map((key) => ({
    key,
    cells: t(`admin.audit.${key}`).split(" · "),
  }));

  return (
    <div>
      <PageHeader title={t("admin.audit.title")} />

      <TextInput
        id="auditFilter"
        name="auditFilter"
        type="search"
        placeholder={t("admin.audit.filter")}
        aria-label={t("admin.audit.filter")}
      />

      <Card className="mt-4 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t("admin.audit.time")}</th>
                <th>{t("admin.audit.user")}</th>
                <th>{t("admin.audit.action")}</th>
                <th>{t("admin.audit.details")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  {row.cells.map((cell, index) => (
                    <td key={index}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="divide-y divide-ink-100 sm:hidden">
          {rows.map((row) => (
            <li key={row.key} className="px-4 py-3 text-sm leading-6 text-ink-700">
              {row.cells.join(" · ")}
            </li>
          ))}
        </ul>
      </Card>

      <Placeholder
        wireframe={t("admin.ph.wireframe", { id: "A-06" })}
        description={t("admin.ph.a06")}
        owner={t("admin.owner.admin")}
        sprint={t("admin.ph.sprint2")}
        tone="sprint2"
      />
    </div>
  );
}
