import { formatDate } from "@/lib/format";
import { Badge, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { requireVerifiedOrganization } from "@/lib/auth/guards";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { listBatches } from "@/lib/inventory/data";
import {
  COMPONENT_LABEL_KEY,
  TESTING_STATUS_LABEL_KEY,
  TESTING_STATUS_TONE,
} from "@/lib/inventory/labels";

/**
 * B-02 - Inventory list (FR-INV-02, FR-INV-04, FR-INV-08).
 *
 * Wireframe: the Group / Component / Units / Status / Expiry table with
 * "+ Add Batch". Module 4.2 also requires the reserved quantity, so the table
 * shows Available and Reserved next to each other - the one deliberate
 * addition to the drawing. Mobile keeps the same information as cards at 360 px.
 */
export default async function BloodBankInventoryPage() {
  const session = await requireVerifiedOrganization("/bank/inventory");
  const locale = await getLocale();
  const t = createTranslator(locale);
  const batches = await listBatches(session.user.organization.id);

  return (
    <div>
      <PageHeader title={t("inventory.title")} subtitle={t("inventory.subtitle")} />

      {batches.length === 0 ? (
        <EmptyState
          title={t("inventory.empty.title")}
          description={t("inventory.empty.description")}
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t("inventory.col.group")}</th>
                  <th>{t("inventory.col.batch")}</th>
                  <th>{t("inventory.col.component")}</th>
                  <th>{t("inventory.col.available")}</th>
                  <th>{t("inventory.col.reserved")}</th>
                  <th>{t("inventory.col.status")}</th>
                  <th>{t("inventory.col.expiry")}</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="font-semibold">
                      <a
                        href={`/bank/inventory/${batch.id}`}
                        className="text-wasl-700 underline-offset-2 hover:underline"
                      >
                        {t(`blood.${batch.bloodGroup}`)}
                      </a>
                    </td>
                    <td className="font-mono text-xs text-ink-500">
                      #{batch.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td>{t(COMPONENT_LABEL_KEY[batch.component])}</td>
                    <td className="font-semibold">{batch.availableUnits}</td>
                    <td className="text-ink-600">{batch.reservedUnits}</td>
                    <td>
                      <Badge tone={TESTING_STATUS_TONE[batch.status]}>
                        {t(TESTING_STATUS_LABEL_KEY[batch.status])}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap">{formatDate(batch.expiresAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards - same information, readable at 360 px */}
          <ul className="divide-y divide-ink-100 sm:hidden">
            {batches.map((batch) => (
              <li key={batch.id} className="space-y-1 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={`/bank/inventory/${batch.id}`}
                    className="font-semibold text-ink-900 underline-offset-2 hover:underline"
                  >
                    {t(`blood.${batch.bloodGroup}`)} · {t(COMPONENT_LABEL_KEY[batch.component])}
                  </a>
                  <Badge tone={TESTING_STATUS_TONE[batch.status]}>
                    {t(TESTING_STATUS_LABEL_KEY[batch.status])}
                  </Badge>
                </div>
                <p className="text-ink-600">
                  {t("inventory.col.available")}: {batch.availableUnits} ·{" "}
                  {t("inventory.col.reserved")}: {batch.reservedUnits} ·{" "}
                  {t("inventory.col.expiry")}: {formatDate(batch.expiresAt, locale)} ·{" "}
                  <span className="font-mono text-xs">
                    #{batch.id.slice(0, 8).toUpperCase()}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* The wireframe draws "+ Add Batch" as a full-width row under the table. */}
      <div className="mt-4">
        <LinkButton href="/bank/inventory/new" block>
          <span aria-hidden="true">+</span> {t("inventory.addBatch")}
        </LinkButton>
      </div>
    </div>
  );
}
