import { Card, LinkButton, PageHeader } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * B-02 - Inventory list.
 *
 * Wireframe: the Group / component / units / status / expiry table with the
 * "O- RBC 6 Approved 12 Nov" and "A+ Platelets 3 Awaiting 14 Oct" rows, and
 * the "+ Add Batch" action. Inventory belongs to Module 4 (Sprint 1).
 */
export default async function BloodBankInventoryPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  const rows = [
    {
      id: "batch-1",
      group: "O-",
      component: "redCells",
      units: 6,
      status: "approved",
      expiry: t("bank.date.12Nov"),
    },
    {
      id: "batch-2",
      group: "A+",
      component: "platelets",
      units: 3,
      status: "awaiting",
      expiry: t("bank.date.14Oct"),
    },
  ];

  return (
    <div>
      <PageHeader title={t("nav.bank.inventory")} />

      <Card className="overflow-hidden">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t("field.bloodGroup")}</th>
                <th>{t("field.component")}</th>
                <th>{t("field.units")}</th>
                <th>{t("field.status")}</th>
                <th>{t("bank.expiry")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-semibold">{t(`blood.${row.group}`)}</td>
                  <td>{t(`component.${row.component}`)}</td>
                  <td>{row.units}</td>
                  <td>{t(`bank.status.${row.status}`)}</td>
                  <td>{row.expiry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards - keeps the same columns readable at 360 px */}
        <ul className="divide-y divide-ink-100 sm:hidden">
          {rows.map((row) => (
            <li key={row.id} className="space-y-1 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink-900">
                  {t(`blood.${row.group}`)} · {t(`component.${row.component}`)}
                </span>
                <span className="text-ink-500">{t(`bank.status.${row.status}`)}</span>
              </div>
              <p className="text-ink-600">
                {t("field.units")}: {row.units} · {t("bank.expiry")}: {row.expiry}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-4">
        <LinkButton href="/bank/inventory/new">{t("nav.bank.addBatch")}</LinkButton>
      </div>

      <Placeholder
        wireframe={t("bloodbank.ph.wireframe", { id: "B-02" })}
        description={t("bloodbank.ph.b02")}
        owner={t("bloodbank.owner.inventory")}
        sprint={t("bloodbank.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
