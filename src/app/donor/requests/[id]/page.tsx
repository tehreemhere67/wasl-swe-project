import { Button, PageHeader } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * D-02 - Request detail + respond.
 *
 * Wireframe: "Request #102", the "O- red cells · 2 units · Hospital X by 6pm"
 * line, the dashed eligibility notice, and the "I'm willing" / "Decline"
 * buttons. Donor responses are reserved for Sprint 2 (Module 3), so both
 * buttons are disabled.
 */
export default async function DonorRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("donor.request.title", { id })} subtitle={t("donor.request.summary")} />

      <div className="rounded-2xl border border-dashed border-ink-300 bg-white px-4 py-5 text-sm leading-6 text-ink-700">
        {t("notice.eligibility")}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button type="button" disabled>
          {t("donor.request.willing")}
        </Button>
        <Button type="button" variant="secondary" disabled>
          {t("donor.request.decline")}
        </Button>
      </div>

      <Placeholder
        wireframe={t("donor.ph.wireframe", { id: "D-02" })}
        description={t("donor.ph.d02")}
        owner={t("donor.owner.requests")}
        sprint={t("donor.ph.sprint2")}
        tone="sprint2"
      />
    </div>
  );
}
