import { Button, Card, Field, PageHeader, TextInput } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * O-03 - Completion form.
 *
 * Wireframe: "Drive 3 completed", the attendees and donations counts, the
 * donor phone recorded at the drive and Save. Campaign outcomes belong to
 * Module 6 (Sprint 1); Save is rendered without submitting yet.
 */
export default async function CampaignCompletePage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("organizer.complete.title")} />

      <Card className="card-pad">
        <form className="space-y-4">
          <Field label={t("organizer.complete.attendees")} htmlFor="attendees">
            <TextInput id="attendees" name="attendees" type="number" min={0} inputMode="numeric" />
          </Field>

          <Field label={t("organizer.complete.donations")} htmlFor="donations">
            <TextInput id="donations" name="donations" type="number" min={0} inputMode="numeric" />
          </Field>

          <Field label={t("organizer.complete.donorPhone")} htmlFor="donorPhone">
            <TextInput id="donorPhone" name="donorPhone" type="tel" inputMode="tel" />
          </Field>

          <Button type="button" block>
            {t("action.save")}
          </Button>
        </form>
      </Card>

      <Placeholder
        wireframe={t("organizer.ph.wireframe", { id: "O-03" })}
        description={t("organizer.ph.o03")}
        owner={t("organizer.owner.campaigns")}
        sprint={t("organizer.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
