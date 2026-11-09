import { Button, PageHeader, VerifiedMark } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * D-06 - Campaign detail.
 *
 * Wireframe: "Campaign", the title / date / venue / target line, the verified
 * organizer and the "I plan to attend" action. Campaigns belong to Module 6
 * (Sprint 1); interest is not binding.
 */
export default async function DonorCampaignDetailPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("donor.campaign.title")} subtitle={t("donor.campaign.meta")} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-ink-700">{t("donor.campaign.organizer")}</span>
        <VerifiedMark label={t("status.verified")} status="verified" />
      </div>

      <div className="mt-4">
        <Button type="button">{t("donor.campaign.attend")}</Button>
      </div>

      <Placeholder
        wireframe={t("donor.ph.wireframe", { id: "D-06" })}
        description={t("donor.ph.d06")}
        owner={t("donor.owner.campaigns")}
        sprint={t("donor.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
