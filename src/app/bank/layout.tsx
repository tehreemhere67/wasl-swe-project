import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { requireRole, requireVerifiedOrganization } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";
import { ensureMonitoringFresh } from "@/lib/inventory/monitoring";

/** Blood bank area (B-01..B-07). Only verified blood banks get past the guard. */
export default async function BloodBankLayout({ children }: { children: ReactNode }) {
  // Only blood bank accounts may enter this area (FR-ADM-01).
  await requireRole(["blood_bank"], "/bank");
  const session = await requireVerifiedOrganization("/bank");

  // FR-MON-06: at most hourly, any view of the bank area refreshes alerts.
  await ensureMonitoringFresh(session.user.organization.id);

  const locale = await getLocale();
  const t = createTranslator(locale);

  const nav = [
    { href: "/bank", label: t("nav.bank.dashboard") },
    { href: "/bank/inventory", label: t("nav.bank.inventory") },
    { href: "/bank/inventory/new", label: t("nav.bank.addBatch") },
    { href: "/bank/requests", label: t("nav.bank.openRequests") },
    { href: "/bank/record-donation", label: t("nav.bank.recordDonation") },
    { href: "/bank/settings", label: t("nav.bank.settings") },
  ];

  return (
    <AppShell user={session.user} locale={locale} areaLabel={t("nav.bank.area")} nav={nav}>
      {children}
    </AppShell>
  );
}
