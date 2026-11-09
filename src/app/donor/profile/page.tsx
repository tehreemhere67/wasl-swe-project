import {
  Button,
  Card,
  Checkbox,
  Field,
  PageHeader,
  SelectInput,
  TextInput,
} from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

/**
 * D-03 - Donor profile.
 *
 * Wireframe: blood group, area (Karachi), the SMS / WhatsApp / Platform
 * notification channels, the Urgent / Campaign notices preferences, language,
 * Save and "Delete account". Donor profiles belong to Module 3 (Sprint 1); the
 * actions are rendered without submitting yet.
 */
export default async function DonorProfilePage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("nav.donor.profile")} />

      <Card className="card-pad">
        <form className="space-y-5">
          <Field label={t("field.bloodGroup")} htmlFor="bloodGroup">
            <SelectInput id="bloodGroup" name="bloodGroup" defaultValue="O-">
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {t(`blood.${group}`)}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label={t("field.area")} htmlFor="area">
            <TextInput
              id="area"
              name="area"
              placeholder={t("donor.profile.areaPlaceholder")}
            />
          </Field>

          <fieldset>
            <legend className="label">{t("donor.profile.channels")}</legend>
            <div className="flex flex-wrap gap-4">
              <Checkbox label={t("donor.channel.sms")} name="channelSms" defaultChecked />
              <Checkbox label={t("donor.channel.whatsapp")} name="channelWhatsapp" />
              <Checkbox label={t("donor.channel.platform")} name="channelPlatform" defaultChecked />
            </div>
          </fieldset>

          <fieldset>
            <legend className="label">{t("donor.profile.preferences")}</legend>
            <div className="flex flex-wrap gap-4">
              <Checkbox label={t("donor.pref.urgent")} name="notifyUrgent" defaultChecked />
              <Checkbox
                label={t("donor.pref.campaignNotices")}
                name="notifyCampaigns"
                defaultChecked
              />
            </div>
          </fieldset>

          <Field label={t("field.language")} htmlFor="language">
            <SelectInput id="language" name="language" defaultValue={locale}>
              <option value="en">{t("nav.switchToEnglish")}</option>
              <option value="ur">{t("nav.switchToUrdu")}</option>
            </SelectInput>
          </Field>

          <Button type="button" block>
            {t("action.save")}
          </Button>
        </form>
      </Card>

      <div className="mt-4">
        <Button type="button" variant="danger">
          {t("donor.profile.deleteAccount")}
        </Button>
      </div>

      <Placeholder
        wireframe={t("donor.ph.wireframe", { id: "D-03" })}
        description={t("donor.ph.d03")}
        owner={t("donor.owner.profile")}
        sprint={t("donor.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
