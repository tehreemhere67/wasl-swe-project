import { Button, PageHeader, VerifiedMark } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * B-06 - Open requests + offer.
 *
 * Wireframe: "Open Requests", the "#102 O- RBC · 2 units · Hospital X ✓ ·
 * Critical" row, the "Offers Units (+ reserve)" action and the "Matches My
 * Stock" note. Request offers are reserved for Sprint 2 (Module REQ), so the
 * offer action is disabled.
 */
export default async function BloodBankRequestsPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("nav.bank.openRequests")} />

      <div className="list-row flex-col items-start gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-base font-semibold text-ink-900">{t("bank.openRequest.rowTitle")}</p>
          <p className="text-sm text-ink-500">{t("bank.openRequest.rowMeta")}</p>
        </div>
        <VerifiedMark label={t("bank.sample.hospitalX")} status="verified" />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="button" disabled>
          {t("bank.openRequest.offer")}
        </Button>
        <p className="text-sm text-ink-500">{t("bank.openRequest.matches")}</p>
      </div>

      <Placeholder
        wireframe={t("bloodbank.ph.wireframe", { id: "B-06" })}
        description={t("bloodbank.ph.b06")}
        owner={t("bloodbank.owner.requests")}
        sprint={t("bloodbank.ph.sprint2")}
        tone="sprint2"
      />
    </div>
  );
}
