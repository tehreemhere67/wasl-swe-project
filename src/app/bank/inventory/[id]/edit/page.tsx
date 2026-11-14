import { notFound } from "next/navigation";
import { BatchForm } from "@/components/forms/batch-form";
import { Card, PageHeader } from "@/components/ui";
import { requireVerifiedOrganization } from "@/lib/auth/guards";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { getBatch } from "@/lib/inventory/data";
import { buildBatchFormLabels } from "@/lib/inventory/form-labels";

/**
 * B-03 in edit mode - 4.3 (FR-INV-03).
 *
 * Only a batch that belongs to this blood bank can be opened; another bank's id
 * returns 404 rather than revealing that it exists (A-12).
 */
export default async function EditBatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireVerifiedOrganization("/bank/inventory");
  const { id } = await params;
  const locale = await getLocale();
  const t = createTranslator(locale);

  const data = await getBatch(session.user.organization.id, id);
  if (!data) notFound();

  const { batch } = data;

  return (
    <div className="mx-auto w-full max-w-xl">
      <PageHeader
        title={t("inventory.edit.title")}
        subtitle={t("inventory.edit.subtitle")}
        backLink={{ href: `/bank/inventory/${batch.id}`, label: t("inventory.backToBatch") }}
      />

      <Card className="card-pad">
        <BatchForm
          mode="edit"
          batchId={batch.id}
          initial={{
            bloodGroup: batch.bloodGroup,
            component: batch.component,
            units: batch.units,
            status: batch.status,
            expiresAt: batch.expiresAt,
          }}
          labels={buildBatchFormLabels(t, "edit")}
        />
      </Card>
    </div>
  );
}
