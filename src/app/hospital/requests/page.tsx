import { Badge, Button, PageHeader } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

const FILTERS = ["all", "open", "partial", "fulfilled", "cancelled", "expired"] as const;

/**
 * H-07 - My requests.
 *
 * Not drawn in the wireframes. The screen is the hospital's request list with
 * the status filter pills. The request module (Module REQ) fills the rows in
 * Sprint 2.
 */
export default async function HospitalRequestsPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("nav.hospital.requests")} />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter, index) => (
          <Button
            key={filter}
            type="button"
            size="sm"
            variant={index === 0 ? "primary" : "secondary"}
          >
            {t(`hospital.reqStatus.${filter}`)}
          </Button>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        <li className="list-row">
          <span className="text-sm font-semibold text-ink-900">
            {t("hospital.requests.sampleOpen")}
          </span>
          <Badge tone="neutral">{t("hospital.reqStatus.open")}</Badge>
        </li>
        <li className="list-row">
          <span className="text-sm font-semibold text-ink-900">
            {t("hospital.requests.samplePartial")}
          </span>
          <Badge tone="pending">{t("hospital.reqStatus.partial")}</Badge>
        </li>
      </ul>

      <Placeholder
        wireframe={t("hospital.ph.wireframe", { id: "H-07" })}
        description={t("hospital.ph.h07")}
        owner={t("hospital.owner.requests")}
        sprint={t("hospital.ph.sprint2")}
        tone="sprint2"
      />
    </div>
  );
}
