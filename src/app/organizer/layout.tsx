import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { requireRole, requireVerifiedOrganization } from "@/lib/auth/guards";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/** Campaign organiser area (O-01..O-03) for verified donation organizations. */
export default async function OrganizerLayout({ children }: { children: ReactNode }) {
  // FR-CAM-01: verified blood banks and verified donation organizations are
  // the campaign organizers. Any other account is sent to its own home.
  await requireRole(["donation_org", "blood_bank"], "/organizer");
  const session = await requireVerifiedOrganization("/organizer");
  const locale = await getLocale();
  const t = createTranslator(locale);

  const nav = [
    { href: "/organizer/campaigns/new", label: t("nav.organizer.create") },
    { href: "/organizer/campaigns", label: t("nav.organizer.campaigns") },
  ];

  return (
    <AppShell user={session.user} locale={locale} areaLabel={t("nav.organizer.area")} nav={nav}>
      {children}
    </AppShell>
  );
}
