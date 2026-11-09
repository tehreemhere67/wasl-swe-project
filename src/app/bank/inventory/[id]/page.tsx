import { Button, Card, PageHeader } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * B-04 - Batch detail + movements.
 *
 * Wireframe: "Batch O RBC", the Added +10 / Reserved -2 / Issued -2 movements
 * with their who-and-when column, and the Reserve / Issue / Transfer / Correct
 * actions. Inventory belongs to Module 4 (Sprint 1); the actions are rendered
 * without submitting yet.
 */
export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const t = createTranslator(locale);

  const movements = [
    { key: "added", amount: "+10", meta: t("bank.movement.row1Meta") },
    { key: "reserved", amount: "-2", meta: t("bank.movement.row2Meta") },
    { key: "issued", amount: "-2", meta: t("bank.movement.row3Meta") },
  ] as const;

  const actions = ["reserve", "issue", "transfer", "correct"] as const;

  return (
    <div>
      <PageHeader
        title={t("bank.batch.title", {
          group: t("blood.O-"),
          component: t("component.redCells"),
        })}
        subtitle={`#${id}`}
      />

      <Card className="overflow-hidden">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t("field.component")}</th>
                <th>{t("field.units")}</th>
                <th>{t("bank.movement.whoWhen")}</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.key}>
                  <td className="font-semibold">{t(`bank.movement.${movement.key}`)}</td>
                  <td>{movement.amount}</td>
                  <td className="text-ink-500">{movement.meta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="divide-y divide-ink-100 sm:hidden">
          {movements.map((movement) => (
            <li key={movement.key} className="flex items-start justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-ink-900">
                  {t(`bank.movement.${movement.key}`)} {movement.amount}
                </p>
                <p className="text-xs text-ink-500">{movement.meta}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <Button
            key={action}
            type="button"
            variant={index === 0 ? "primary" : "secondary"}
            size="sm"
          >
            {t(`bank.batch.${action}`)}
          </Button>
        ))}
      </div>

      <Placeholder
        wireframe={t("bloodbank.ph.wireframe", { id: "B-04" })}
        description={t("bloodbank.ph.b04")}
        owner={t("bloodbank.owner.inventory")}
        sprint={t("bloodbank.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
