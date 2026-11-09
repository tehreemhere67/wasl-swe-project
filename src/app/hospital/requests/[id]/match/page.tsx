import { LinkButton, PageHeader, VerifiedMark } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * H-04 - Confirmation + matching banks.
 *
 * Wireframe: "request #102", the matching banks with their verified marks, the
 * muted "42 potential matches" line and "View request". Matching is part of the
 * request module (Module REQ) and is reserved for Sprint 2.
 */
export default async function RequestMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const t = createTranslator(locale);

  const banks = ["bankA", "bankB"] as const;

  return (
    <div>
      <PageHeader title={t("hospital.match.title", { id })} />

      <ul className="space-y-2">
        {banks.map((bank) => (
          <li key={bank} className="list-row">
            <VerifiedMark label={t(`hospital.sample.${bank}`)} status="verified" />
          </li>
        ))}
      </ul>

      <p className="mt-3 text-sm text-ink-500">{t("hospital.match.potential", { count: 42 })}</p>

      <div className="mt-4">
        <LinkButton href={`/hospital/requests/${id}`}>{t("hospital.match.viewRequest")}</LinkButton>
      </div>

      <Placeholder
        wireframe={t("hospital.ph.wireframe", { id: "H-04" })}
        description={t("hospital.ph.h04")}
        owner={t("hospital.owner.requests")}
        sprint={t("hospital.ph.sprint2")}
        tone="sprint2"
      />
    </div>
  );
}
