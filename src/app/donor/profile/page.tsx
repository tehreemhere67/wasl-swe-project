import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { DonorProfileForm } from "@/components/forms/donor-profile-form";
import { requireRole } from "@/lib/auth/guards";
import { getDonorByUserId, loadAreas } from "@/lib/donor/data";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";
import { pickLabels } from "@/lib/i18n/labels";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const LABELS = [
  "action.save",
  "donor.availability.available",
  "donor.availability.notAvailable",
  "donor.channel.platform",
  "donor.channel.sms",
  "donor.channel.whatsapp",
  "donor.pref.campaignNotices",
  "donor.pref.urgent",
  "donor.profile.availability",
  "donor.profile.channels",
  "donor.profile.chooseArea",
  "donor.profile.deleteAccount",
  "donor.profile.deleteConfirm",
  "donor.profile.deleteHint",
  "donor.profile.deleteKeep",
  "donor.profile.deleteYes",
  "donor.profile.deleting",
  "donor.profile.errorGeneric",
  "donor.profile.preferences",
  "donor.profile.saved",
  "donor.profile.saving",
  "field.area",
  "field.bloodGroup",
  "field.language",
  "nav.switchToEnglish",
  "nav.switchToUrdu",
  "donor.error.areaInvalid",
  "donor.error.areaRequired",
  "donor.error.availabilityInvalid",
  "donor.error.bloodGroupInvalid",
  "donor.error.bloodGroupRequired",
  "donor.error.channelRequired",
  "donor.error.languageInvalid",
] as const;

/**
 * D-03 - Donor profile (Module 3: FR-DON-02, FR-DON-05).
 *
 * Wireframe: blood group, area (Karachi), the SMS / WhatsApp / Platform channels, the Urgent / Campaign
 * notices preferences, language, Save and "Delete account".
 */
export default async function DonorProfilePage() {
  const session = await requireRole(["donor"], "/donor/profile");
  const donor = await getDonorByUserId(session.user.id);
  if (!donor) redirect("/donor");
  const locale = await getLocale();
  const t = createTranslator(locale);
  const areas = await loadAreas();

  return (
    <div>
      <PageHeader title={t("nav.donor.profile")} />
      <DonorProfileForm
        labels={pickLabels(t, [...LABELS, ...BLOOD_GROUPS.map((g) => `blood.${g}`)])}
        groups={BLOOD_GROUPS.map((g) => ({ value: g, label: t(`blood.${g}`) }))}
        areas={areas.map((a) => ({ value: a.name, label: locale === "ur" ? a.nameUr : a.name }))}
        initial={{
          bloodGroup: donor.bloodGroup ?? "",
          area: donor.area ?? "",
          availability: donor.availability,
          contactPlatform: donor.contactPlatform,
          contactSms: donor.contactSms,
          contactWhatsapp: donor.contactWhatsapp,
          notifyUrgent: donor.notifyUrgent,
          notifyCampaigns: donor.notifyCampaigns,
          preferredLanguage: donor.preferredLanguage,
        }}
      />
    </div>
  );
}
