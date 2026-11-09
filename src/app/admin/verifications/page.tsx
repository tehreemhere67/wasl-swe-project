import Link from "next/link";
import {
  Card,
  DetailRow,
  EmptyState,
  PageHeader,
  StatusBadge,
  type VerificationStatus,
} from "@/components/ui";
import { AdminVerifyPanel } from "@/components/forms/admin-verify-panel";
import { requireAdmin } from "@/lib/auth/guards";
import { query } from "@/lib/db";
import { formatDate, formatDateTime, waitingTimeParts } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";
import { DocumentIcon } from "@/components/ui/icons";

/**
 * A-02 - Verification queue + review (FR-VER-02, FR-VER-04, FR-VER-06).
 *
 * Wireframe: "Pending registrations (waiting time)", a row such as
 * "Hospital Z · 2 days", the details + documents panel, and the
 * Approve / Reject + reason / Suspend buttons.
 */

interface QueueRow {
  id: string;
  type: string;
  name: string;
  verification_status: VerificationStatus;
  created_at: string;
  doc_count: string;
}

interface OrgDetail {
  id: string;
  type: string;
  name: string;
  address_karachi: string;
  official_phone: string;
  official_email: string;
  licence_number: string;
  representative_name: string;
  representative_designation: string;
  verification_status: VerificationStatus;
  status_reason: string | null;
  created_at: string;
}

interface DocumentRow {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
}

export default async function AdminVerificationsPage(props: {
  searchParams: Promise<{ tab?: string; org?: string }>;
}) {
  await requireAdmin();
  const locale = await getLocale();
  const t = createTranslator(locale);
  const params = await props.searchParams;
  const tab = params.tab === "all" ? "all" : "pending";

  const { rows: queue } = await query<QueueRow>(
    `SELECT o.id, o.type, o.name, o.verification_status, o.created_at,
            (SELECT count(*)::text FROM organization_documents d WHERE d.organization_id = o.id) AS doc_count
       FROM organizations o
      WHERE ($1 = 'all' OR o.verification_status = 'pending')
      ORDER BY
        CASE o.verification_status
          WHEN 'pending' THEN 0
          WHEN 'suspended' THEN 1
          WHEN 'rejected' THEN 2
          ELSE 3
        END,
        o.created_at ASC
      LIMIT 100`,
    [tab],
  );

  const selectedId = params.org && queue.some((row) => row.id === params.org) ? params.org : queue[0]?.id;

  let organization: OrgDetail | null = null;
  let documents: DocumentRow[] = [];
  let history: {
    id: string;
    decision: string;
    reason: string | null;
    decided_at: string;
    admin_name: string | null;
  }[] = [];

  if (selectedId) {
    const detail = await query<OrgDetail>(
      `SELECT id, type, name, address_karachi, official_phone, official_email,
              licence_number, representative_name, representative_designation,
              verification_status, status_reason, created_at
         FROM organizations WHERE id = $1`,
      [selectedId],
    );
    organization = detail.rows[0] ?? null;

    const docs = await query<DocumentRow>(
      `SELECT id, file_name, mime_type, size_bytes, uploaded_at
         FROM organization_documents WHERE organization_id = $1 ORDER BY uploaded_at ASC`,
      [selectedId],
    );
    documents = docs.rows;

    const hist = await query<{
      id: string;
      decision: string;
      reason: string | null;
      decided_at: string;
      admin_name: string | null;
    }>(
      `SELECT v.id, v.decision, v.reason, v.decided_at, u.full_name AS admin_name
         FROM verification_history v
         LEFT JOIN users u ON u.id = v.admin_user_id
        WHERE v.organization_id = $1
        ORDER BY v.decided_at DESC`,
      [selectedId],
    );
    history = hist.rows;
  }

  const decisionLabel: Record<string, string> = {
    approved: t("adminVerify.decisionApproved"),
    rejected: t("adminVerify.decisionRejected"),
    suspended: t("adminVerify.decisionSuspended"),
    reinstated: t("adminVerify.decisionReinstated"),
    reapplied: t("status.decision.reapplied"),
  };

  return (
    <div>
      <PageHeader
        title={t("adminVerify.title")}
        subtitle={t("adminVerify.subtitle")}
        actions={
          <div className="flex gap-1 rounded-full border border-ink-200 bg-white p-1">
            <Link
              href="/admin/verifications"
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${tab === "pending" ? "bg-wasl-600 text-white" : "text-ink-600 hover:bg-ink-100"}`}
            >
              {t("adminVerify.tabPending")}
            </Link>
            <Link
              href="/admin/verifications?tab=all"
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${tab === "all" ? "bg-wasl-600 text-white" : "text-ink-600 hover:bg-ink-100"}`}
            >
              {t("adminVerify.tabAll")}
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        {/* Queue */}
        <Card className="h-fit overflow-hidden">
          <div className="border-b border-ink-100 px-4 py-3">
            <h2 className="text-sm font-bold text-ink-950">{t("adminVerify.queue")}</h2>
          </div>
          {queue.length === 0 ? (
            <div className="p-4">
              <EmptyState title={t("adminVerify.noPending")} description={t("adminVerify.allOrganizations")} />
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {queue.map((row) => {
                const waiting = waitingTimeParts(row.created_at);
                const waitingLabel =
                  waiting.days > 0
                    ? t("adminVerify.waitingDays", { days: waiting.days })
                    : t("adminVerify.waitingHours", { hours: Math.max(1, waiting.hours) });
                const isSelected = row.id === selectedId;
                return (
                  <li key={row.id}>
                    <Link
                      href={`/admin/verifications?${tab === "all" ? "tab=all&" : ""}org=${row.id}`}
                      className={`block px-4 py-3 transition-colors ${isSelected ? "bg-wasl-50" : "hover:bg-ink-50"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-ink-950">{row.name}</span>
                        <StatusBadge
                          status={row.verification_status}
                          label={t(`status.${row.verification_status}`)}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {t(`role.${row.type}`)} · {waitingLabel} · {row.doc_count} {t("adminVerify.document")}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Details + documents */}
        <Card className="overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-3">
            <h2 className="text-sm font-bold text-ink-950">{t("adminVerify.details")}</h2>
          </div>

          {!organization ? (
            <div className="p-6">
              <EmptyState title={t("adminVerify.noPending")} />
            </div>
          ) : (
            <div className="space-y-5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-bold text-ink-950">{organization.name}</p>
                  <p className="text-sm text-ink-500">
                    {t(`role.${organization.type}`)} ·{" "}
                    {t("adminVerify.registered", { when: formatDate(organization.created_at, locale) })}
                  </p>
                </div>
                <StatusBadge
                  status={organization.verification_status}
                  label={t(`status.${organization.verification_status}`)}
                />
              </div>

              <dl className="divide-y divide-ink-100 border-y border-ink-100">
                <DetailRow label={t("orgReg.address")} value={organization.address_karachi} />
                <DetailRow label={t("orgReg.officialPhone")} value={organization.official_phone} />
                <DetailRow label={t("orgReg.officialEmail")} value={organization.official_email} />
                <DetailRow label={t("adminVerify.licence")} value={organization.licence_number} />
                <DetailRow
                  label={t("adminVerify.representative")}
                  value={`${organization.representative_name} · ${organization.representative_designation}`}
                />
                {organization.status_reason ? (
                  <DetailRow label={t("field.reason")} value={organization.status_reason} />
                ) : null}
              </dl>

              <div>
                <h3 className="mb-2 text-sm font-bold text-ink-900">{t("adminVerify.document")}</h3>
                {documents.length === 0 ? (
                  <p className="text-sm text-ink-500">{t("adminVerify.noDocuments")}</p>
                ) : (
                  <ul className="space-y-2">
                    {documents.map((doc) => (
                      <li key={doc.id}>
                        <a
                          href={`/api/documents/${doc.id}`}
                          className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50"
                        >
                          <DocumentIcon className="h-4 w-4 text-ink-500" />
                          <span className="truncate">{doc.file_name}</span>
                          <span className="ms-auto shrink-0 text-xs text-ink-500">
                            {Math.max(1, Math.round(doc.size_bytes / 1024))} KB
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold text-ink-900">{t("adminVerify.history")}</h3>
                {history.length === 0 ? (
                  <p className="text-sm text-ink-500">{t("status.historyEmpty")}</p>
                ) : (
                  <ol className="space-y-2">
                    {history.map((entry) => (
                      <li key={entry.id} className="rounded-xl border border-ink-200 px-3 py-2 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-ink-900">
                            {decisionLabel[entry.decision] ?? entry.decision}
                          </span>
                          <time className="text-xs text-ink-500">{formatDateTime(entry.decided_at, locale)}</time>
                        </div>
                        {entry.reason ? <p className="mt-0.5 text-ink-700">{entry.reason}</p> : null}
                        {entry.admin_name ? (
                          <p className="mt-0.5 text-xs text-ink-500">
                            {t("status.byAdmin", { name: entry.admin_name })}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <AdminVerifyPanel
                organizationId={organization.id}
                status={organization.verification_status}
                labels={{
                  approve: t("adminVerify.approve"),
                  reject: t("adminVerify.reject"),
                  suspend: t("adminVerify.suspend"),
                  reinstate: t("adminVerify.reinstate"),
                  reasonPlaceholder: t("adminVerify.reasonPlaceholder"),
                  reasonRequired: t("adminVerify.reasonRequired"),
                  reviewed: t("adminVerify.reviewed"),
                  error: t("state.error"),
                  working: t("state.working"),
                }}
              />

              <p className="text-xs text-ink-500">{t("adminVerify.notified")}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
