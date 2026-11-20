import Link from "next/link";
import { Badge, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { CancelCampaign } from "@/components/forms/cancel-campaign";
import { requireRole } from "@/lib/auth/guards";
import { listOwnCampaigns } from "@/lib/campaigns/data";
import { campaignTitle, campaignWhen, STATUS_KEY, STATUS_TONE } from "@/lib/campaigns/display";
import { canCancel, canRecordOutcome } from "@/lib/campaigns/rules";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";
import { pickLabels } from "@/lib/i18n/labels";

const CANCEL_LABELS = [
  "organizer.campaign.cancel",
  "organizer.campaign.cancelConfirm",
  "organizer.campaign.cancelKeep",
  "organizer.campaign.cancelYes",
  "organizer.campaign.cancelling",
  "organizer.campaign.errorGeneric",
] as const;

/**
 * O-02 - My campaigns (Module 6: FR-CAM-02, FR-CAM-08).
 *
 * Wireframe: one row per campaign with its status (Draft, Pending, Approved ...), an Approved campaign
 * opening the completion screen, and the "Cancel campaign" action. Cancel is shown on each campaign that
 * can still be cancelled.
 */
export default async function OrganizerCampaignsPage() {
  const session = await requireRole(["donation_org", "blood_bank"], "/organizer/campaigns");
  const locale = await getLocale();
  const t = createTranslator(locale);
  const campaigns = await listOwnCampaigns(session.user.organization!.id);
  const labels = pickLabels(t, CANCEL_LABELS);

  return (
    <div>
      <PageHeader
        title={t("nav.organizer.campaigns")}
        actions={<LinkButton href="/organizer/campaigns/new">{t("organizer.campaign.new")}</LinkButton>}
      />

      {campaigns.length === 0 ? (
        <EmptyState title={t("organizer.campaign.empty")} />
      ) : (
        <ul className="space-y-2" data-testid="own-campaigns">
          {campaigns.map((c) => {
            const complete = canRecordOutcome(c.status, c.startsAt);
            const href = complete ? `/organizer/campaigns/${c.id}/complete` : `/organizer/campaigns/${c.id}`;
            return (
              <li key={c.id} className="card card-pad space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={href} className="min-w-0 text-base font-semibold text-ink-900 hover:underline">
                    {campaignTitle(c, locale)}
                    <span className="block text-xs font-normal text-ink-500">{campaignWhen(c.startsAt, locale)}</span>
                  </Link>
                  <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{t(STATUS_KEY[c.status] ?? "organizer.campaign.statusDraft")}</Badge>
                </div>
                {c.status === "rejected" && c.reviewReason ? (
                  <p className="text-sm text-ink-700">{t("organizer.campaign.reviewReason", { reason: c.reviewReason })}</p>
                ) : null}
                <p className="text-xs text-ink-500">{t("organizer.campaign.interested", { count: c.interestedCount })}</p>
                {canCancel(c.status) ? <CancelCampaign campaignId={c.id} labels={labels} /> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
