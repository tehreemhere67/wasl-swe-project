import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert, Badge, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { CampaignForm } from "@/components/forms/campaign-form";
import { CancelCampaign } from "@/components/forms/cancel-campaign";
import { requireRole } from "@/lib/auth/guards";
import { getOwnCampaign } from "@/lib/campaigns/data";
import { campaignTitle, campaignWhen, STATUS_KEY, STATUS_TONE } from "@/lib/campaigns/display";
import { CAMPAIGN_FORM_LABELS } from "@/lib/campaigns/labels";
import { canCancel, canEdit, canRecordOutcome, karachiDate, karachiTime } from "@/lib/campaigns/rules";
import { loadAreas } from "@/lib/donor/data";
import { todayInKarachi } from "@/lib/donor/rules";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";
import { pickLabels } from "@/lib/i18n/labels";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

/**
 * Campaign detail for its organizer (Module 6: FR-CAM-02, FR-CAM-07, FR-CAM-08, A-29).
 * Not drawn in the wireframes (they go from O-02 straight to O-03); it carries the edit form, the list
 * of donors who plan to attend and the link to the completion form.
 */
export default async function OrganizerCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole(["donation_org", "blood_bank"], `/organizer/campaigns/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const found = await getOwnCampaign(session.user.organization!.id, id);
  if (!found) notFound();
  const { campaign: c, interested } = found;
  const locale = await getLocale();
  const t = createTranslator(locale);
  const areas = await loadAreas();
  const editable = canEdit(c.status);
  const outcomes = canRecordOutcome(c.status, c.startsAt);

  return (
    <div>
      <PageHeader
        title={campaignTitle(c, locale)}
        subtitle={campaignWhen(c.startsAt, locale)}
        backLink={{ href: "/organizer/campaigns", label: t("organizer.detail.back") }}
        actions={<Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{t(STATUS_KEY[c.status] ?? "organizer.campaign.statusDraft")}</Badge>}
      />

      {c.status === "rejected" && c.reviewReason ? (
        <div className="mb-4">
          <Alert tone="warning">{t("organizer.campaign.reviewReason", { reason: c.reviewReason })}</Alert>
        </div>
      ) : null}
      {c.status === "pending_approval" && c.approvedSnapshot ? (
        <div className="mb-4">
          <Alert tone="info">{t("organizer.campaign.changesPending")}</Alert>
        </div>
      ) : null}

      {outcomes ? (
        <p className="mb-4">
          <Link
            href={`/organizer/campaigns/${c.id}/complete`}
            className="font-semibold text-wasl-700 underline-offset-4 hover:underline"
          >
            {t("organizer.detail.recordOutcomes")}
          </Link>
        </p>
      ) : null}

      {editable ? (
        <CampaignForm
          mode="edit"
          campaignId={c.id}
          canSaveDraft={c.status === "draft"}
          labels={pickLabels(t, CAMPAIGN_FORM_LABELS)}
          groups={BLOOD_GROUPS.map((g) => ({ value: g, label: t(`blood.${g}`) }))}
          areas={areas.map((a) => ({ value: a.name, label: locale === "ur" ? a.nameUr : a.name }))}
          minDate={todayInKarachi()}
          initial={{
            titleEn: c.titleEn,
            titleUr: c.titleUr,
            descriptionEn: c.descriptionEn,
            descriptionUr: c.descriptionUr,
            date: karachiDate(c.startsAt),
            time: karachiTime(c.startsAt),
            venue: c.venue,
            area: c.area ?? "",
            targetGroups: c.targetGroups,
            contactPhone: c.contactPhone ?? "",
            contactEmail: c.contactEmail ?? "",
          }}
        />
      ) : (
        <Card className="card-pad">
          <p className="text-sm text-ink-700">{t("organizer.detail.locked")}</p>
        </Card>
      )}

      {canCancel(c.status) ? (
        <div className="mt-4">
          <CancelCampaign
            campaignId={c.id}
            labels={pickLabels(t, [
              "organizer.campaign.cancel",
              "organizer.campaign.cancelConfirm",
              "organizer.campaign.cancelKeep",
              "organizer.campaign.cancelYes",
              "organizer.campaign.cancelling",
              "organizer.campaign.errorGeneric",
            ])}
          />
        </div>
      ) : null}

      <section className="mt-8">
        <SectionTitle>{t("organizer.detail.interestedTitle", { count: interested.length })}</SectionTitle>
        {interested.length === 0 ? (
          <EmptyState title={t("organizer.detail.noInterested")} />
        ) : (
          <ul className="space-y-2" data-testid="interested-list">
            {interested.map((d, i) => (
              <li key={i} className="list-row">
                <span className="text-sm font-semibold text-ink-900">{d.name}</span>
                <span className="text-xs text-ink-500">
                  {[d.bloodGroup, d.area].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
