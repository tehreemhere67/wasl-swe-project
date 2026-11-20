import { notFound, redirect } from "next/navigation";
import { DetailRow, PageHeader, VerifiedMark } from "@/components/ui";
import { InterestButton } from "@/components/forms/interest-button";
import { requireRole } from "@/lib/auth/guards";
import { getDonorCampaign } from "@/lib/campaigns/data";
import { campaignDescription, campaignTitle, campaignWhen } from "@/lib/campaigns/display";
import { getDonorByUserId } from "@/lib/donor/data";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * D-06 - Campaign detail (Module 6: FR-CAM-03, FR-CAM-04, FR-CAM-07).
 *
 * Wireframe: "Campaign", the title / date / venue / target line, the verified organizer and the
 * "I plan to attend" action. Interest is not binding (A-30).
 */
export default async function DonorCampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole(["donor"], `/donor/campaigns/${id}`);
  const donor = await getDonorByUserId(session.user.id);
  if (!donor) redirect("/donor");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const detail = await getDonorCampaign(id, donor.id);
  if (!detail) notFound();
  const locale = await getLocale();
  const t = createTranslator(locale);
  const c = detail.campaign;
  const target =
    c.targetGroups.length === 0 ? t("donor.campaign.allGroups") : c.targetGroups.map((g) => t(`blood.${g}`)).join(", ");
  const description = campaignDescription(c, locale);

  return (
    <div>
      <PageHeader
        title={campaignTitle(c, locale)}
        subtitle={`${campaignWhen(c.startsAt, locale)} · ${c.venue}`}
        backLink={{ href: "/donor/campaigns", label: t("donor.campaign.back") }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-ink-700">{t("donor.campaign.organizer")}</span>
        <VerifiedMark label={c.organizationName} status="verified" />
      </div>

      <dl className="mt-4 space-y-2">
        <DetailRow label={t("donor.campaign.venue")} value={c.area ? `${c.venue} · ${c.area}` : c.venue} />
        <DetailRow label={t("donor.campaign.target")} value={target} />
        {c.contactPhone || c.contactEmail ? (
          <DetailRow
            label={t("donor.campaign.contact")}
            value={[c.contactPhone, c.contactEmail].filter(Boolean).join(" · ")}
          />
        ) : null}
      </dl>

      {description ? (
        <section className="mt-4">
          <h2 className="text-sm font-semibold text-ink-900">{t("donor.campaign.description")}</h2>
          <p className="mt-1 whitespace-pre-line text-sm text-ink-700">{description}</p>
        </section>
      ) : null}

      <div className="mt-6">
        <InterestButton
          campaignId={c.id}
          initialInterested={detail.interested}
          initialCount={detail.interestedCount}
          labels={{
            attend: t("donor.campaign.attend"),
            attending: t("donor.campaign.attending"),
            withdraw: t("donor.campaign.withdraw"),
            count: t("donor.campaign.interestedCount", { count: "{count}" }),
            nonBinding: t("donor.campaign.nonBinding"),
            error: t("donor.campaign.errorGeneric"),
          }}
        />
      </div>

    </div>
  );
}
