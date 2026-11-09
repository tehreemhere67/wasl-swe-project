import { Button, PageHeader, TextInput } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { PlusIcon } from "@/components/ui/icons";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * D-04 - History + reminder.
 *
 * Wireframe: "Donations (total 4)", the "12 Jan - Self reported" and
 * "03 June - Recorded by org" rows, the "+ Add past donation" action and the
 * "Remind me after N days" inline field. Donation history belongs to Module 3
 * (Sprint 1).
 */
export default async function DonorHistoryPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  const donations = [
    { id: "self-1", label: t("donor.history.selfReported") },
    { id: "org-1", label: t("donor.history.recordedByOrg") },
  ];

  return (
    <div>
      <PageHeader title={t("donor.history.title", { count: 4 })} />

      <ul className="space-y-2">
        {donations.map((donation) => (
          <li key={donation.id} className="list-row">
            <span className="text-sm font-semibold text-ink-900">{donation.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <Button type="button" variant="secondary">
          <PlusIcon className="h-4 w-4" />
          {t("donor.history.addPast")}
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <label htmlFor="remindDays" className="text-sm text-ink-700">
          {t("donor.history.remindBefore")}
        </label>
        <TextInput
          id="remindDays"
          name="remindDays"
          type="number"
          min={1}
          inputMode="numeric"
          className="w-20"
        />
        <span className="text-sm text-ink-700">{t("donor.history.remindAfter")}</span>
      </div>

      <Placeholder
        wireframe={t("donor.ph.wireframe", { id: "D-04" })}
        description={t("donor.ph.d04")}
        owner={t("donor.owner.history")}
        sprint={t("donor.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
