import { BatchForm } from "@/components/forms/batch-form";
import { Card, PageHeader } from "@/components/ui";
import { requireVerifiedOrganization } from "@/lib/auth/guards";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { buildBatchFormLabels } from "@/lib/inventory/form-labels";

/**
 * B-03 - Add batch (FR-INV-01).
 *
 * Guarded twice on purpose: the layout already blocks non-blood-bank and
 * unverified organizations, and this page re-checks so a future refactor cannot
 * expose it (HANDOFF.md section 3).
 */
export default async function AddBatchPage() {
  await requireVerifiedOrganization("/bank/inventory/new");
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div className="mx-auto w-full max-w-xl">
      <PageHeader
        title={t("inventory.new.title")}
        subtitle={t("inventory.new.subtitle")}
        backLink={{ href: "/bank/inventory", label: t("inventory.back") }}
      />

      <Card className="card-pad">
        <BatchForm labels={buildBatchFormLabels(t, "create")} />
      </Card>
    </div>
  );
}
