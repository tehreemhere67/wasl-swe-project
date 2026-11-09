import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { requireRole, requireVerifiedOrganization } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/** Hospital area (H-01..H-07). Only verified hospitals get past the guard. */
export default async function HospitalLayout({ children }: { children: ReactNode }) {
  // Only hospital accounts may enter this area (FR-ADM-01), and the
  // organization must be Verified (FR-VER-03).
  await requireRole(["hospital"], "/hospital");
  const session = await requireVerifiedOrganization("/hospital");
  const locale = await getLocale();
  const t = createTranslator(locale);

  const nav = [
    { href: "/hospital", label: t("nav.hospital.dashboard") },
    { href: "/hospital/search", label: t("nav.hospital.search") },
    { href: "/hospital/requests/new", label: t("nav.hospital.newRequest") },
    { href: "/hospital/requests", label: t("nav.hospital.requests") },
  ];

  return (
    <AppShell user={session.user} locale={locale} areaLabel={t("nav.hospital.area")} nav={nav}>
      {children}
    </AppShell>
  );
}
