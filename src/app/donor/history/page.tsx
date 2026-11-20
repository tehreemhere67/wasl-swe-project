import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { AddPastDonation, ReminderField } from "@/components/forms/donor-history-forms";
import { requireRole } from "@/lib/auth/guards";
import { getDonorByUserId, listHistory } from "@/lib/donor/data";
import { reminderDueDate, todayInKarachi } from "@/lib/donor/rules";
import { formatDate } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";
import { pickLabels } from "@/lib/i18n/labels";

const LABELS = [
  "donor.history.addDate",
  "donor.history.addPast",
  "donor.history.addPlace",
  "donor.history.addSave",
  "donor.history.added",
  "donor.history.cancelAdd",
  "donor.history.remindAfter",
  "donor.history.remindBefore",
  "donor.history.reminderCleared",
  "donor.history.reminderHint",
  "donor.history.reminderSave",
  "donor.history.reminderSaved",
  "donor.history.saving",
  "donor.profile.errorGeneric",
  "donor.error.dateFuture",
  "donor.error.dateInvalid",
  "donor.error.placeRequired",
  "donor.error.placeTooLong",
  "donor.error.reminderInvalid",
] as const;

/**
 * D-04 - History + reminder (Module 3: FR-DON-03, FR-DON-04, FR-DON-06).
 *
 * Wireframe: "Donations (total N)", rows such as "12 Jan - Self reported" and "03 June - Recorded by org",
 * "+ Add past donation" and the inline "Remind me after N days" field.
 */
export default async function DonorHistoryPage() {
  const session = await requireRole(["donor"], "/donor/history");
  const donor = await getDonorByUserId(session.user.id);
  if (!donor) redirect("/donor");
  const locale = await getLocale();
  const t = createTranslator(locale);
  const history = await listHistory(donor.id);
  const today = todayInKarachi();
  const nextDate =
    donor.reminderDays !== null && history.lastDonationOn
      ? formatDate(reminderDueDate(history.lastDonationOn, donor.reminderDays), locale)
      : null;

  return (
    <div>
      <PageHeader title={t("donor.history.title", { count: history.total })} />

      {history.entries.length === 0 ? (
        <p className="text-sm text-ink-600">{t("donor.history.empty")}</p>
      ) : (
        <ul className="space-y-2" data-testid="history-list">
          {history.entries.map((entry) => (
            <li key={entry.id} className="list-row">
              <span className="text-sm font-semibold text-ink-900">
                {t("donor.history.entry", {
                  date: formatDate(entry.donatedOn, locale),
                  label: t(entry.source === "self_reported" ? "donor.history.selfReported" : "donor.history.recordedByOrg"),
                })}
              </span>
              <span className="text-xs text-ink-500">{entry.place}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <AddPastDonation labels={pickLabels(t, LABELS)} maxDate={today} />
      </div>

      <div className="mt-6">
        <ReminderField
          labels={pickLabels(t, LABELS)}
          initialDays={donor.reminderDays}
          nextDate={nextDate ? t("donor.history.reminderNext", { date: nextDate }) : null}
        />
      </div>
    </div>
  );
}
