import Link from "next/link";
import {
  Badge,
  Card,
  DetailRow,
  EmptyState,
  PageHeader,
  StatusBadge,
  type VerificationStatus,
} from "@/components/ui";
import { CampaignReviewPanel } from "@/components/forms/campaign-review-panel";
import { requireAdmin } from "@/lib/auth/guards";
import { query } from "@/lib/db";
import { formatDateTime, waitingTimeParts } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";
import { campaignStatusTone } from "@/lib/admin/rules";

/**
 * A-04 - Campaign review (FR-ADM-03/04/05).
 *
 * Wireframe: "Pending campaigns", the campaign details block and the
 * Approve / Reject + reason / Return for change actions. Statuses are the six
 * SRS 4.2 values; "return" puts the campaign back to Draft.
 */

interface CampaignRow {
  id: string;
  organization_id: string;
  title_en: string;
  title_ur: string;
  description_en: string;
  description_ur: string;
  starts_at: string;
  ends_at: string | null;
  venue: string;
  area: string | null;
  target_groups: string[] | string | null;
  status: string;
  created_at: string;
  organization_name: string;
  verification_status: VerificationStatus;
}

const STATUS_KEY: Record<string, string> = {
  draft: "admin.campaignReview.statusDraft",
  pending_approval: "admin.campaignReview.statusPendingApproval",
  approved: "admin.campaignReview.statusApproved",
  rejected: "admin.campaignReview.statusRejected",
  cancelled: "admin.campaignReview.statusCancelled",
  completed: "admin.campaignReview.statusCompleted",
};

function groupsLabel(value: string[] | string | null): string {
  if (!value) return "—";
  return Array.isArray(value) ? value.join(", ") : value;
}

export default async function AdminCampaignsPage(props: {
  searchParams: Promise<{ campaign?: string }>;
}) {
  await requireAdmin();
  const locale = await getLocale();
  const t = createTranslator(locale);
  const params = await props.searchParams;

  const { rows } = await query<CampaignRow>(
    `SELECT c.id, c.organization_id, c.title_en, c.title_ur,
            c.description_en, c.description_ur, c.starts_at, c.ends_at,
            c.venue, c.area, c.target_groups, c.status, c.created_at,
            o.name AS organization_name, o.verification_status
       FROM campaigns c
       JOIN organizations o ON o.id = c.organization_id
      WHERE c.status = 'pending_approval'
      ORDER BY c.created_at ASC
      LIMIT 100`,
  );

  const selectedId =
    params.campaign && rows.some((row) => row.id === params.campaign)
      ? params.campaign
      : rows[0]?.id;
  const campaign = rows.find((row) => row.id === selectedId) ?? null;

  const waitingLabel = (createdAt: string): string => {
    const waiting = waitingTimeParts(createdAt);
    return waiting.days > 0
      ? t("admin.campaignReview.waitingDays", { days: waiting.days })
      : t("admin.campaignReview.waitingHours", { hours: Math.max(1, waiting.hours) });
  };

  return (
    <div>
      <PageHeader
        title={t("admin.campaignReview.title")}
        subtitle={t("admin.campaignReview.subtitle")}
      />

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        {/* Queue */}
        <Card className="h-fit overflow-hidden">
          <div className="border-b border-ink-100 px-4 py-3">
            <h2 className="text-sm font-bold text-ink-950">{t("admin.campaignReview.queue")}</h2>
          </div>
          {rows.length === 0 ? (
            <div className="p-4">
              <EmptyState title={t("admin.campaignReview.empty")} />
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {rows.map((row) => {
                const title = locale === "ur" && row.title_ur ? row.title_ur : row.title_en;
                const isSelected = row.id === selectedId;
                return (
                  <li key={row.id}>
                    <Link
                      href={`/admin/campaigns?campaign=${row.id}`}
                      className={`block px-4 py-3 transition-colors ${
                        isSelected ? "bg-wasl-50" : "hover:bg-ink-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-ink-950">{title}</span>
                        <Badge tone={campaignStatusTone(row.status)}>
                          {t(STATUS_KEY[row.status] ?? row.status)}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {row.organization_name} · {waitingLabel(row.created_at)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Details + actions */}
        <Card className="overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-3">
            <h2 className="text-sm font-bold text-ink-950">{t("admin.campaignReview.details")}</h2>
          </div>

          {!campaign ? (
            <div className="p-6">
              <EmptyState title={t("admin.campaignReview.empty")} />
            </div>
          ) : (
            <div className="space-y-5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-bold text-ink-950">
                    {locale === "ur" && campaign.title_ur
                      ? campaign.title_ur
                      : campaign.title_en}
                  </p>
                  <p className="text-sm text-ink-500">
                    {t("admin.campaignReview.submitted", {
                      when: formatDateTime(campaign.created_at, locale),
                    })}
                  </p>
                </div>
                <Badge tone={campaignStatusTone(campaign.status)}>
                  {t(STATUS_KEY[campaign.status] ?? campaign.status)}
                </Badge>
              </div>

              <dl className="divide-y divide-ink-100 border-y border-ink-100">
                <DetailRow
                  label={t("admin.campaignReview.organizer")}
                  value={
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {campaign.organization_name}
                      <StatusBadge
                        status={campaign.verification_status}
                        label={t(`status.${campaign.verification_status}`)}
                      />
                    </span>
                  }
                />
                <DetailRow
                  label={t("admin.campaignReview.starts")}
                  value={formatDateTime(campaign.starts_at, locale)}
                />
                {campaign.ends_at ? (
                  <DetailRow
                    label={t("admin.campaignReview.ends")}
                    value={formatDateTime(campaign.ends_at, locale)}
                  />
                ) : null}
                <DetailRow label={t("admin.campaignReview.venue")} value={campaign.venue} />
                {campaign.area ? (
                  <DetailRow label={t("admin.campaignReview.area")} value={campaign.area} />
                ) : null}
                <DetailRow
                  label={t("admin.campaignReview.groups")}
                  value={groupsLabel(campaign.target_groups)}
                />
                <DetailRow
                  label={t("field.description")}
                  value={
                    locale === "ur" && campaign.description_ur
                      ? campaign.description_ur
                      : campaign.description_en
                  }
                />
              </dl>

              <CampaignReviewPanel
                campaignId={campaign.id}
                labels={{
                  approve: t("admin.campaignReview.approve"),
                  reject: t("admin.campaignReview.reject"),
                  returnForChange: t("admin.campaignReview.return"),
                  reasonPlaceholder: t("admin.campaignReview.reasonPlaceholder"),
                  reasonRequired: t("admin.campaignReview.reasonRequired"),
                  reviewed: t("admin.campaignReview.reviewed"),
                  notPending: t("admin.campaignReview.notPending"),
                  error: t("state.error"),
                  working: t("state.working"),
                }}
              />

              <p className="text-xs text-ink-500">{t("admin.campaignReview.notified")}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}