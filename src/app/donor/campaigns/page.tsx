import Link from "next/link";
import { Button, PageHeader, VerifiedMark } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * D-05 - Campaigns browse.
 *
 * Wireframe: the Area / Date / Group filters and the verified "Drive - Univ. ·
 * 20 Nov" and "Drive - Mosque · 27 Nov" campaign cards, each opening its
 * detail. Campaigns belong to Module 6 (Sprint 1).
 */
export default async function DonorCampaignsPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  const campaigns = [
    { id: "1", title: t("donor.campaigns.driveUniv"), date: t("donor.campaigns.date20Nov") },
    { id: "2", title: t("donor.campaigns.driveMosque"), date: t("donor.campaigns.date27Nov") },
  ];

  return (
    <div>
      <PageHeader title={t("nav.donor.campaigns")} />

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary">
          {t("field.area")}
        </Button>
        <Button type="button" size="sm" variant="secondary">
          {t("field.date")}
        </Button>
        <Button type="button" size="sm" variant="secondary">
          {t("donor.campaigns.filterGroup")}
        </Button>
      </div>

      <ul className="mt-4 space-y-2">
        {campaigns.map((campaign) => (
          <li key={campaign.id}>
            <Link
              href={`/donor/campaigns/${campaign.id}`}
              className="list-row hover:bg-ink-50"
            >
              <VerifiedMark label={campaign.title} status="verified" />
              <span className="shrink-0 text-xs font-medium text-ink-500">{campaign.date}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Placeholder
        wireframe={t("donor.ph.wireframe", { id: "D-05" })}
        description={t("donor.ph.d05")}
        owner={t("donor.owner.campaigns")}
        sprint={t("donor.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
