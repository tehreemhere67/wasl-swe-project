import { Card, PageHeader } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * A-01 - Inventory dashboard (all banks).
 *
 * Wireframe: "Inventory - all banks", the Group / Component / Available /
 * Expiring table with the "O- RBC 40 5" row, and the "click row → bank drill
 * down" note. The consolidated dashboard is reserved for Sprint 2 (Module 8).
 */
export default async function AdminInventoryPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  const rows = [
    { id: "row-1", group: "O-", component: "redCells", available: 40, expiring: 5 },
  ];

  return (
    <div>
      <PageHeader title={t("admin.inventory.title")} />

      <Card className="overflow-hidden">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t("field.bloodGroup")}</th>
                <th>{t("field.component")}</th>
                <th>{t("admin.inventory.available")}</th>
                <th>{t("admin.inventory.expiring")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-semibold">{t(`blood.${row.group}`)}</td>
                  <td>{t(`component.${row.component}`)}</td>
                  <td>{row.available}</td>
                  <td>{row.expiring}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="divide-y divide-ink-100 sm:hidden">
          {rows.map((row) => (
            <li key={row.id} className="space-y-1 px-4 py-3 text-sm">
              <p className="font-semibold text-ink-900">
                {t(`blood.${row.group}`)} · {t(`component.${row.component}`)}
              </p>
              <p className="text-ink-600">
                {t("admin.inventory.available")}: {row.available} · {t("admin.inventory.expiring")}:{" "}
                {row.expiring}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-3 text-sm text-ink-500">{t("admin.inventory.drilldown")}</p>

      <Placeholder
        wireframe={t("admin.ph.wireframe", { id: "A-01" })}
        description={t("admin.ph.a01")}
        owner={t("admin.owner.admin")}
        sprint={t("admin.ph.sprint2")}
        tone="sprint2"
      />
    </div>
  );
}
