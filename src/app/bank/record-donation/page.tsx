import { Button, Card, Field, PageHeader, TextInput } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * B-07 - Record donation.
 *
 * Wireframe: the donor phone, the date, the note "Only that a donation took
 * place" and Save. Donation records belong to Module 3 (Sprint 1); Save is
 * rendered without submitting yet.
 */
export default async function RecordDonationPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("nav.bank.recordDonation")} />

      <Card className="card-pad">
        <form className="space-y-4">
          <Field label={t("bank.record.donorPhone")} htmlFor="donorPhone">
            <TextInput id="donorPhone" name="donorPhone" type="tel" inputMode="tel" />
          </Field>

          <Field label={t("field.date")} htmlFor="donationDate">
            <TextInput id="donationDate" name="donationDate" type="date" />
          </Field>

          <p className="text-sm text-ink-500">{t("bank.record.note")}</p>

          <Button type="button" block>
            {t("action.save")}
          </Button>
        </form>
      </Card>

      <Placeholder
        wireframe={t("bloodbank.ph.wireframe", { id: "B-07" })}
        description={t("bloodbank.ph.b07")}
        owner={t("bloodbank.owner.donations")}
        sprint={t("bloodbank.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
