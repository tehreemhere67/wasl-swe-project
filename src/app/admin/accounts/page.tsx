import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  TextInput,
  type VerificationStatus,
} from "@/components/ui";
import { AdminAccountActions } from "@/components/forms/admin-account-actions";
import { requireAdmin } from "@/lib/auth/guards";
import { query } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * A-03 - Account management (FR-ADM-02).
 *
 * Wireframe: "Accounts", the search field, the "Donor/org · Status" row and
 * the Deactivate / Reactivate actions. Deactivation is enforced by
 * users.status: login and getSession() already refuse a deactivated account.
 */

interface AccountRow {
  id: string;
  role: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: "active" | "deactivated";
  created_at: string;
  organization_name: string | null;
  verification_status: VerificationStatus | null;
  total: string;
}

const TABS = [
  { value: "all", key: "admin.accounts.filterAll" },
  { value: "org", key: "admin.accounts.filterOrgs" },
  { value: "donor", key: "admin.accounts.filterDonors" },
] as const;

export default async function AdminAccountsPage(props: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const session = await requireAdmin();
  const locale = await getLocale();
  const t = createTranslator(locale);
  const params = await props.searchParams;

  const q = (params.q ?? "").trim();
  const search = q ? `%${q}%` : "";
  const rawType = params.type ?? "all";
  const type = rawType === "org" || rawType === "donor" ? rawType : "all";

  const { rows } = await query<AccountRow>(
    `SELECT u.id, u.role, u.full_name, u.email, u.phone, u.status, u.created_at,
            o.name AS organization_name, o.verification_status,
            (count(*) OVER ())::text AS total
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
      WHERE ($1 = ''
             OR u.full_name ILIKE $1
             OR coalesce(u.email, '') ILIKE $1
             OR coalesce(u.phone, '') ILIKE $1
             OR coalesce(o.name, '') ILIKE $1
            OR ($3 <> ''
                AND ltrim(regexp_replace($3, '[^0-9]', '', 'g'), '0') <> ''
                AND right(regexp_replace(coalesce(u.phone, ''), '[^0-9]', '', 'g'), 10)
                    LIKE '%' || ltrim(regexp_replace($3, '[^0-9]', '', 'g'), '0') || '%'))            
        AND ($2 = 'all'
             OR ($2 = 'org' AND u.organization_id IS NOT NULL)
             OR ($2 = 'donor' AND u.role = 'donor'))
      ORDER BY CASE u.role WHEN 'admin' THEN 0 WHEN 'donor' THEN 1 ELSE 2 END,
               u.created_at DESC
      LIMIT 100`,
    [search, type, q],
  );

  const total = Number(rows[0]?.total ?? 0);

  const tabHref = (value: string) => {
    const sp = new URLSearchParams();
    if (value !== "all") sp.set("type", value);
    if (q) sp.set("q", q);
    const suffix = sp.toString();
    return `/admin/accounts${suffix ? `?${suffix}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title={t("admin.accounts.title")}
        subtitle={t("admin.accounts.subtitle")}
        actions={
          <div className="flex gap-1 rounded-full border border-ink-200 bg-white p-1">
            {TABS.map((tab) => (
              <Link
                key={tab.value}
                href={tabHref(tab.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  type === tab.value
                    ? "bg-wasl-600 text-white"
                    : "text-ink-600 hover:bg-ink-100"
                }`}
              >
                {t(tab.key)}
              </Link>
            ))}
          </div>
        }
      />

      <form method="get" action="/admin/accounts" className="mb-4 flex flex-wrap items-center gap-2">
        {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
        <TextInput
          id="accountSearch"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t("admin.accounts.searchPlaceholder")}
          aria-label={t("admin.accounts.searchPlaceholder")}
          className="min-w-0 flex-1 sm:max-w-md"
        />
        <Button type="submit" variant="secondary">
          {t("action.search")}
        </Button>
      </form>

      <p className="mb-2 text-sm text-ink-500">{t("admin.accounts.count", { count: total })}</p>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState title={t("admin.accounts.empty")} />
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {rows.map((row) => {
              const isSelf = row.id === session.user.id;
              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-ink-950">
                        {row.full_name}
                      </span>
                      <Badge tone="neutral">{t(`role.${row.role}`)}</Badge>
                      <Badge tone={row.status === "active" ? "verified" : "neutral"}>
                        {row.status === "active" ? t("status.active") : t("status.deactivated")}
                      </Badge>
                      {isSelf ? (
                        <span className="text-xs text-ink-500">{t("admin.accounts.you")}</span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {row.email ?? row.phone ?? "—"}
                      {row.organization_name ? ` · ${row.organization_name}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {t("admin.accounts.joined", { when: formatDate(row.created_at, locale) })}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {row.verification_status ? (
                      <StatusBadge
                        status={row.verification_status}
                        label={t(`status.${row.verification_status}`)}
                      />
                    ) : null}
                    <AdminAccountActions
                      userId={row.id}
                      status={row.status}
                      isSelf={isSelf}
                      labels={{
                        deactivate: t("admin.accounts.deactivate"),
                        reactivate: t("admin.accounts.reactivate"),
                        working: t("state.working"),
                        updated: t("admin.accounts.updated"),
                        error: t("state.error"),
                        selfBlocked: t("admin.accounts.selfBlocked"),
                        lastAdmin: t("admin.accounts.lastAdmin"),
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}