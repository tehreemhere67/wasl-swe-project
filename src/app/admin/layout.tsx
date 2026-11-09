import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { requireAdmin } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/** Administrator area (A-01..A-08) - wireframe sheet 14 menu. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  const locale = await getLocale();
  const t = createTranslator(locale);

  const nav = [
    { href: "/admin", label: t("nav.admin.inventoryReports") },
    { href: "/admin/reports", label: t("nav.admin.reports") },
    { href: "/admin/verifications", label: t("nav.admin.verify") },
    { href: "/admin/campaigns", label: t("nav.admin.campaigns") },
    { href: "/admin/flags", label: t("nav.admin.flags") },
    { href: "/admin/accounts", label: t("nav.admin.accounts") },
    { href: "/admin/audit", label: t("nav.admin.audit") },
    { href: "/admin/settings", label: t("nav.admin.settings") },
  ];

  return (
    <AppShell user={session.user} locale={locale} areaLabel={t("nav.admin.area")} nav={nav}>
      {children}
    </AppShell>
  );
}
