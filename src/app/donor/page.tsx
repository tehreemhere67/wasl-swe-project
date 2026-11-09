import Link from "next/link";
import { Checkbox, LinkButton, PageHeader } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * D-01 - Donor home.
 *
 * Wireframe: "Home", the "Available" checkbox, the two matching requests with
 * their distance, the Campaigns button and the Profile / History links.
 * Matching requests are reserved for Sprint 2 (Module 3).
 */
export default async function DonorHomePage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  const requests = [
    { id: "102", label: t("donor.home.row102") },
    { id: "101", label: t("donor.home.row101") },
  ];

  return (
    <div>
      <PageHeader title={t("nav.donor.home")} />

      <Checkbox label={t("donor.home.available")} defaultChecked />

      <ul className="mt-4 space-y-2">
        {requests.map((request) => (
          <li key={request.id}>
            <Link href={`/donor/requests/${request.id}`} className="list-row hover:bg-ink-50">
              <span className="text-sm font-semibold text-ink-900">{request.label}</span>
              <span aria-hidden="true" className="rtl-flip shrink-0 text-ink-400">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <LinkButton href="/donor/campaigns">{t("nav.donor.campaigns")}</LinkButton>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <Link
          href="/donor/profile"
          className="text-sm font-semibold text-wasl-700 underline-offset-4 hover:underline"
        >
          {t("nav.donor.profile")}
        </Link>
        <Link
          href="/donor/history"
          className="text-sm font-semibold text-wasl-700 underline-offset-4 hover:underline"
        >
          {t("nav.donor.history")}
        </Link>
      </div>

      <Placeholder
        wireframe={t("donor.ph.wireframe", { id: "D-01" })}
        description={t("donor.ph.d01")}
        owner={t("donor.owner.requests")}
        sprint={t("donor.ph.sprint2")}
        tone="sprint2"
      />
    </div>
  );
}
