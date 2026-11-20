import { notFound } from "next/navigation";
import { Alert, PageHeader } from "@/components/ui";
import { OutcomeForm } from "@/components/forms/outcome-form";
import { requireRole } from "@/lib/auth/guards";
import { getOwnCampaign } from "@/lib/campaigns/data";
import { campaignTitle } from "@/lib/campaigns/display";
import { canRecordOutcome } from "@/lib/campaigns/rules";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";
import { pickLabels } from "@/lib/i18n/labels";

const LABELS = [
  "action.save",
  "field.optional",
  "organizer.campaign.errorGeneric",
  "organizer.complete.attendees",
  "organizer.complete.donations",
  "organizer.complete.donorHint",
  "organizer.complete.donorPhone",
  "organizer.complete.donorRecorded",
  "organizer.complete.recordedCount",
  "organizer.complete.saved",
  "organizer.complete.saving",
  "organizer.error.attendeesInvalid",
  "organizer.error.donationsBelowRecorded",
  "organizer.error.donationsInvalid",
  "organizer.error.donationsTooMany",
  "organizer.error.donorAlreadyRecorded",
  "organizer.error.donorNotFound",
  "organizer.error.donorPhoneInvalid",
] as const;

/**
 * O-03 - Completion form (Module 6: FR-CAM-09, Module 3: FR-DON-04).
 *
 * Wireframe: "Drive 3 completed", Attendees, Donations, the donor phone recorded at the drive and Save.
 * A phone number records a donation, "Recorded by org", in that registered donor's history.
 */
export default async function CampaignCompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole(["donation_org", "blood_bank"], `/organizer/campaigns/${id}/complete`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const found = await getOwnCampaign(session.user.organization!.id, id);
  if (!found) notFound();
  const { campaign: c, recordedDonors } = found;
  const locale = await getLocale();
  const t = createTranslator(locale);
  const ready = canRecordOutcome(c.status, c.startsAt);

  return (
    <div>
      <PageHeader
        title={t("organizer.complete.title", { title: campaignTitle(c, locale) })}
        backLink={{ href: "/organizer/campaigns", label: t("organizer.detail.back") }}
      />
      {ready ? (
        <OutcomeForm
          campaignId={c.id}
          labels={pickLabels(t, LABELS)}
          initialAttendees={c.attendees}
          initialDonations={c.donationsCount}
          recordedCount={recordedDonors}
        />
      ) : (
        <Alert tone="info">{t("organizer.complete.notReady")}</Alert>
      )}
    </div>
  );
}
