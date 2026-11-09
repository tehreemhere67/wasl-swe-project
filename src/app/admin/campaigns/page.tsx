import { Button, Card, PageHeader, SectionTitle } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * A-04 - Campaign review.
 *
 * Wireframe: "Pending Campaigns", the campaign details block and the Approve /
 * Reject + reason / Return for change actions. Campaign review belongs to
 * Module 8 (Sprint 1, Member 2); the actions are rendered but do not submit
 * yet.
 */
export default async function AdminCampaignsPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("admin.campaignReview.title")} />

      <Card className="card-pad">
        <SectionTitle>{t("admin.campaignReview.details")}</SectionTitle>
        <p className="text-sm text-ink-500">{t("admin.campaignReview.detailsHint")}</p>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button">{t("admin.campaignReview.approve")}</Button>
        <Button type="button" variant="secondary">
          {t("admin.campaignReview.reject")}
        </Button>
        <Button type="button" variant="secondary">
          {t("admin.campaignReview.return")}
        </Button>
      </div>

      <Placeholder
        wireframe={t("admin.ph.wireframe", { id: "A-04" })}
        description={t("admin.ph.a04")}
        owner={t("admin.owner.admin")}
        sprint={t("admin.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
