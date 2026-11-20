import { PageHeader } from "@/components/ui";
import { CampaignForm } from "@/components/forms/campaign-form";
import { CAMPAIGN_FORM_LABELS } from "@/lib/campaigns/labels";
import { requireRole } from "@/lib/auth/guards";
import { todayInKarachi } from "@/lib/donor/rules";
import { loadAreas } from "@/lib/donor/data";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";
import { pickLabels } from "@/lib/i18n/labels";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

/**
 * O-01 - Create campaign (Module 6: FR-CAM-01, FR-CAM-02).
 *
 * Wireframe: bilingual title and description, date, time, venue, target groups, "Save draft" and
 * "Submit for Approval".
 */
export default async function NewCampaignPage() {
  await requireRole(["donation_org", "blood_bank"], "/organizer/campaigns/new");
  const locale = await getLocale();
  const t = createTranslator(locale);
  const areas = await loadAreas();

  return (
    <div>
      <PageHeader title={t("nav.organizer.create")} />
      <CampaignForm
        labels={pickLabels(t, CAMPAIGN_FORM_LABELS)}
        groups={BLOOD_GROUPS.map((g) => ({ value: g, label: t(`blood.${g}`) }))}
        areas={areas.map((a) => ({ value: a.name, label: locale === "ur" ? a.nameUr : a.name }))}
        minDate={todayInKarachi()}
      />
    </div>
  );
}
