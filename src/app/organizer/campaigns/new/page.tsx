import {
  Button,
  Card,
  Field,
  PageHeader,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

/**
 * O-01 - Create campaign.
 *
 * Wireframe: the bilingual title and description, date / time / venue, the
 * target-groups dropdown, "Save draft" and "Submit for Approval". Campaigns
 * belong to Module 6 (Sprint 1); the actions are rendered without submitting
 * yet.
 */
export default async function NewCampaignPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("nav.organizer.create")} />

      <Card className="card-pad">
        <form className="space-y-4">
          <Field label={t("organizer.campaign.titleLabel")} htmlFor="title">
            <TextInput id="title" name="title" />
          </Field>

          <Field label={t("organizer.campaign.descriptionLabel")} htmlFor="description">
            <TextArea id="description" name="description" />
          </Field>

          <Field label={t("field.date")} htmlFor="campaignDate">
            <TextInput id="campaignDate" name="campaignDate" type="date" />
          </Field>

          <Field label={t("field.time")} htmlFor="campaignTime">
            <TextInput id="campaignTime" name="campaignTime" type="time" />
          </Field>

          <Field label={t("organizer.campaign.venue")} htmlFor="venue">
            <TextInput id="venue" name="venue" />
          </Field>

          <Field label={t("organizer.campaign.targetGroups")} htmlFor="targetGroups">
            <SelectInput id="targetGroups" name="targetGroups" defaultValue="O-">
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {t(`blood.${group}`)}
                </option>
              ))}
            </SelectInput>
          </Field>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="secondary" block>
              {t("organizer.campaign.saveDraft")}
            </Button>
            <Button type="button" block>
              {t("organizer.campaign.submit")}
            </Button>
          </div>
        </form>
      </Card>

      <Placeholder
        wireframe={t("organizer.ph.wireframe", { id: "O-01" })}
        description={t("organizer.ph.o01")}
        owner={t("organizer.owner.campaigns")}
        sprint={t("organizer.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
