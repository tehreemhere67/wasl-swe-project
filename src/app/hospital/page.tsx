import Link from "next/link";
import { LinkButton, PageHeader, SectionTitle, StatusBadge } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { requireVerifiedOrganization } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * H-01 - Hospital dashboard.
 *
 * Wireframe: the organization name with its verified badge, "Search blood" and
 * "New request", the active requests (#102, #101) and a notifications button.
 * The rows link to the request detail screens that the request module builds
 * in Sprint 2.
 */
export default async function HospitalDashboardPage() {
  const session = await requireVerifiedOrganization("/hospital");
  const locale = await getLocale();
  const t = createTranslator(locale);

  const activeRequestIds = ["102", "101"];

  return (
    <div>
      <PageHeader
        title={session.user.organization.name}
        actions={<StatusBadge status="verified" label={t("status.verified")} />}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <LinkButton href="/hospital/search" block>
          {t("nav.hospital.search")}
        </LinkButton>
        <LinkButton href="/hospital/requests/new" block>
          {t("nav.hospital.newRequest")}
        </LinkButton>
      </div>

      <div className="mt-6">
        <SectionTitle>{t("hospital.dashboard.activeRequests")}</SectionTitle>
        <ul className="space-y-2">
          {activeRequestIds.map((id) => (
            <li key={id}>
              <Link href={`/hospital/requests/${id}`} className="list-row hover:bg-ink-50">
                <span className="text-base font-semibold text-ink-900">#{id}</span>
                <span aria-hidden="true" className="rtl-flip text-ink-400">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <LinkButton href="/notifications" variant="secondary">
          {t("nav.hospital.notifications")}
        </LinkButton>
      </div>

      <Placeholder
        wireframe={t("hospital.ph.wireframe", { id: "H-01" })}
        description={t("hospital.ph.h01")}
        owner={t("hospital.owner.search")}
        sprint={t("hospital.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
