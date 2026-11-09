import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { requireRole } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/** Donor area (D-01..D-06). Donors are individual users, not organizations. */
export default async function DonorLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(["donor"], "/donor");
  const locale = await getLocale();
  const t = createTranslator(locale);

  const nav = [
    { href: "/donor", label: t("nav.donor.home") },
    { href: "/donor/campaigns", label: t("nav.donor.campaigns") },
    { href: "/donor/history", label: t("nav.donor.history") },
    { href: "/donor/profile", label: t("nav.donor.profile") },
  ];

  return (
    <AppShell user={session.user} locale={locale} areaLabel={t("nav.donor.area")} nav={nav}>
      {children}
    </AppShell>
  );
}
