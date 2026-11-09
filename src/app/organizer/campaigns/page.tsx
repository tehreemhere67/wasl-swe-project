import Link from "next/link";
import { Badge, Button, PageHeader } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * O-02 - My campaigns.
 *
 * Wireframe: "Drive 1 - Draft", "Drive 2 - Pending", "Drive 3 - Approved"
 * (opening its detail / completion screen) and the "Cancel campaign" action.
 * Campaigns belong to Module 6 (Sprint 1).
 */
export default async function OrganizerCampaignsPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("nav.organizer.campaigns")} />

      <ul className="space-y-2">
        <li className="list-row">
          <span className="text-base font-semibold text-ink-900">
            {t("organizer.campaign.drive1")}
          </span>
          <Badge tone="neutral">{t("organizer.campaign.statusDraft")}</Badge>
        </li>
        <li className="list-row">
          <span className="text-base font-semibold text-ink-900">
            {t("organizer.campaign.drive2")}
          </span>
          <Badge tone="pending">{t("organizer.campaign.statusPending")}</Badge>
        </li>
        <li>
          <Link href="/organizer/campaigns/3/complete" className="list-row hover:bg-ink-50">
            <span className="text-base font-semibold text-ink-900">
              {t("organizer.campaign.drive3")}
            </span>
            <Badge tone="verified">{t("organizer.campaign.statusApproved")}</Badge>
          </Link>
        </li>
      </ul>

      <div className="mt-4">
        <Button type="button" variant="danger">
          {t("organizer.campaign.cancel")}
        </Button>
      </div>

      <Placeholder
        wireframe={t("organizer.ph.wireframe", { id: "O-02" })}
        description={t("organizer.ph.o02")}
        owner={t("organizer.owner.campaigns")}
        sprint={t("organizer.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
