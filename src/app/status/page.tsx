import { redirect } from "next/navigation";
import Link from "next/link";
import { PublicShell } from "@/components/shell/app-shell";
import {
  Alert,
  Button,
  Card,
  DetailRow,
  PageHeader,
  StatusBadge,
  type VerificationStatus,
} from "@/components/ui";
import { requireUser } from "@/lib/auth/guards";
import { query } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * G-04 - Account status (Pending / Rejected / Suspended / Verified).
 *
 * Wireframe: "account status", "Status: Pending", "Requests, inventory and
 * campaigns are blocked until verified", "Decisions: history, date, reason",
 * "Reapply (if rejected)".
 *
 * FR-VER-02: status plus the history of every decision with administrator,
 * date, time and reason.
 */
export default async function StatusPage() {
  const session = await requireUser("/status");
  const locale = await getLocale();
  const t = createTranslator(locale);

  const organization = session.user.organization;
  if (!organization) redirect("/");

  const { rows: history } = await query<{
    id: string;
    decision: "approved" | "rejected" | "suspended" | "reinstated" | "reapplied";
    reason: string | null;
    decided_at: string;
    admin_name: string | null;
  }>(
    `SELECT v.id, v.decision, v.reason, v.decided_at, u.full_name AS admin_name
       FROM verification_history v
       LEFT JOIN users u ON u.id = v.admin_user_id
      WHERE v.organization_id = $1
      ORDER BY v.decided_at DESC`,
    [organization.id],
  );

  const { rows: orgRows } = await query<{
    type: string;
    name: string;
    address_karachi: string;
    official_phone: string;
    official_email: string;
    licence_number: string;
    representative_name: string;
    representative_designation: string;
    created_at: string;
  }>(
    `SELECT type, name, address_karachi, official_phone, official_email, licence_number,
            representative_name, representative_designation, created_at
       FROM organizations WHERE id = $1`,
    [organization.id],
  );
  const org = orgRows[0];

  const status = organization.verificationStatus as VerificationStatus;
  const messageKey = `status.message.${status}`;
  const decisionLabel: Record<string, string> = {
    approved: t("status.decision.approved"),
    rejected: t("status.decision.rejected"),
    suspended: t("status.decision.suspended"),
    reinstated: t("status.decision.reinstated"),
    reapplied: t("status.decision.reapplied"),
  };

  return (
    <PublicShell locale={locale}>
      <div className="mx-auto w-full max-w-xl">
        <PageHeader title={t("status.title")} subtitle={t("app.tagline")} />

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-5 py-4">
            <div>
              <p className="eyebrow">{t("status.organisation")}</p>
              <p className="mt-0.5 text-base font-bold text-ink-950">{organization.name}</p>
            </div>
            <StatusBadge status={status} label={t(`status.${status}`)} />
          </div>

          <div className="space-y-4 p-5">
            <p className="text-base font-semibold text-ink-900">
              {t("status.current", { status: t(`status.${status}`) })}
            </p>

            <Alert tone={status === "verified" ? "success" : status === "rejected" ? "error" : "warning"}>
              {t(messageKey)}
            </Alert>

            {status === "rejected" ? (
              <form action="/api/organization/reapply" method="post">
                <Button type="submit" variant="secondary" block>
                  {t("status.reapply")}
                </Button>
              </form>
            ) : null}

            {status === "verified" ? (
              <Link
                href={session.user.role === "donation_org" ? "/organizer/campaigns" : session.user.role === "hospital" ? "/hospital" : "/bank"}
                className="btn btn-primary btn-block"
              >
                {t("action.continue")}
              </Link>
            ) : null}

            <p className="text-xs leading-5 text-ink-500">{t("status.contactSupport")}</p>
          </div>
        </Card>

        <Card className="mt-5 overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="text-base font-bold text-ink-950">{t("status.historyTitle")}</h2>
            <p className="mt-0.5 text-sm text-ink-500">{t("status.decisions")}</p>
          </div>
          <div className="p-5">
            {history.length === 0 ? (
              <p className="text-sm text-ink-500">{t("status.historyEmpty")}</p>
            ) : (
              <ol className="space-y-3">
                {history.map((entry) => (
                  <li key={entry.id} className="rounded-xl border border-ink-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink-900">
                        {decisionLabel[entry.decision] ?? entry.decision}
                      </span>
                      <time className="text-xs text-ink-500" dateTime={entry.decided_at}>
                        {formatDateTime(entry.decided_at, locale)}
                      </time>
                    </div>
                    {entry.admin_name ? (
                      <p className="mt-1 text-xs text-ink-500">
                        {t("status.byAdmin", { name: entry.admin_name })}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-ink-700">
                      {entry.reason ? entry.reason : t("status.noReason")}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>

        {org ? (
          <Card className="mt-5 overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-4">
              <h2 className="text-base font-bold text-ink-950">{t("adminVerify.orgDetails")}</h2>
            </div>
            <dl className="divide-y divide-ink-100 px-5 py-2">
              <DetailRow label={t("orgReg.type")} value={t(`role.${org.type}`)} />
              <DetailRow label={t("orgReg.name")} value={org.name} />
              <DetailRow label={t("orgReg.address")} value={org.address_karachi} />
              <DetailRow label={t("orgReg.officialPhone")} value={org.official_phone} />
              <DetailRow label={t("orgReg.officialEmail")} value={org.official_email} />
              <DetailRow label={t("adminVerify.licence")} value={org.licence_number} />
              <DetailRow
                label={t("adminVerify.representative")}
                value={`${org.representative_name} · ${org.representative_designation}`}
              />
              <DetailRow label={t("status.registered")} value={formatDate(org.created_at, locale)} />
            </dl>
          </Card>
        ) : null}
      </div>
    </PublicShell>
  );
}
