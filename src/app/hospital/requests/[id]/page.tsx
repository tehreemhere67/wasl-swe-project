import { Button, PageHeader, SectionTitle, VerifiedMark } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

const OUTCOMES = ["contacted", "donated", "didNotDonate"] as const;

/**
 * H-05 - Request detail.
 *
 * Wireframe: the request title with group and component, the status line, the
 * Mark partial / Fulfilled / Cancel actions, "Willing donors" with one donor
 * row and its outcome buttons, and "Bank offers". Request handling is reserved
 * for Sprint 2 (Module REQ).
 */
export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader
        title={t("hospital.detail.title", {
          id,
          group: t("blood.O-"),
          component: t("component.redCells"),
        })}
        subtitle={`${t("field.status")}: ${t("hospital.reqStatus.open")}`}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled>
          {t("hospital.detail.markPartial")}
        </Button>
        <Button type="button" variant="secondary" disabled>
          {t("hospital.detail.markFulfilled")}
        </Button>
        <Button type="button" variant="danger" disabled>
          {t("action.cancel")}
        </Button>
      </div>

      <div className="mt-6">
        <SectionTitle>{t("hospital.detail.willingDonors")}</SectionTitle>
        <div className="list-row flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <span className="text-base font-semibold text-ink-900">
            {t("hospital.detail.donorAli")}
          </span>
          <div className="flex flex-wrap gap-2">
            {OUTCOMES.map((outcome) => (
              <Button key={outcome} type="button" variant="secondary" size="sm" disabled>
                {t(`hospital.detail.${outcome}`)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle>{t("hospital.detail.bankOffers")}</SectionTitle>
        <div className="list-row">
          <VerifiedMark label={t("hospital.sample.bankA")} status="verified" />
        </div>
      </div>

      <Placeholder
        wireframe={t("hospital.ph.wireframe", { id: "H-05" })}
        description={t("hospital.ph.h05")}
        owner={t("hospital.owner.requests")}
        sprint={t("hospital.ph.sprint2")}
        tone="sprint2"
      />
    </div>
  );
}
