import Link from "next/link";
import { Button, EmptyState, LinkButton, PageHeader, SelectInput, TextInput, VerifiedMark } from "@/components/ui";
import { requireRole } from "@/lib/auth/guards";
import { listDonorCampaigns } from "@/lib/campaigns/data";
import { campaignTitle, campaignWhen } from "@/lib/campaigns/display";
import { filterCampaigns, karachiDate } from "@/lib/campaigns/rules";
import { loadAreas } from "@/lib/donor/data";
import { formatDate } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * D-05 - Campaigns browse (Module 6: FR-CAM-03, FR-CAM-04, FR-CAM-05).
 *
 * Wireframe: the Area / Date / Group filters and the verified campaign cards ("Drive - Univ. · 20 Nov"),
 * each opening its detail. Only upcoming campaigns of verified organizers are listed. The filters are a
 * plain GET form, so the page works without JavaScript and a filtered view can be bookmarked.
 */
export default async function DonorCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["donor"], "/donor/campaigns");
  const params = await searchParams;
  const filters = {
    area: first(params.area),
    date: first(params.date),
    group: first(params.group),
    q: first(params.q),
  };
  const locale = await getLocale();
  const t = createTranslator(locale);
  const [all, areas] = await Promise.all([listDonorCampaigns(), loadAreas()]);
  const campaigns = filterCampaigns(all, filters);
  const filtered = Boolean(filters.area || filters.date || filters.group || filters.q);

  return (
    <div>
      <PageHeader title={t("nav.donor.campaigns")} subtitle={t("donor.campaigns.resultCount", { count: campaigns.length })} />

      <form method="get" className="space-y-2" role="search" aria-label={t("donor.campaigns.search")}>
        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="f-area">
              {t("field.area")}
            </label>
            <SelectInput id="f-area" name="area" defaultValue={filters.area}>
              <option value="">{t("donor.campaigns.allAreas")}</option>
              {areas.map((a) => (
                <option key={a.name} value={a.name}>
                  {locale === "ur" ? a.nameUr : a.name}
                </option>
              ))}
            </SelectInput>
          </div>
          <div>
            <label className="label" htmlFor="f-date">
              {t("donor.campaigns.fromDate")}
            </label>
            <TextInput id="f-date" name="date" type="date" defaultValue={filters.date} />
          </div>
          <div>
            <label className="label" htmlFor="f-group">
              {t("donor.campaigns.filterGroup")}
            </label>
            <SelectInput id="f-group" name="group" defaultValue={filters.group}>
              <option value="">{t("donor.campaigns.allGroups")}</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {t(`blood.${g}`)}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>
        <label className="label" htmlFor="f-q">
          {t("donor.campaigns.search")}
        </label>
        <TextInput id="f-q" name="q" type="search" defaultValue={filters.q} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm">
            {t("donor.campaigns.search")}
          </Button>
          {filtered ? (
            <LinkButton href="/donor/campaigns" variant="secondary" size="sm">
              {t("donor.campaigns.clear")}
            </LinkButton>
          ) : null}
        </div>
      </form>

      {campaigns.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={t("donor.campaigns.empty")} description={t("donor.campaigns.emptyHint")} />
        </div>
      ) : (
        <ul className="mt-4 space-y-2" data-testid="campaign-list">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link href={`/donor/campaigns/${c.id}`} className="list-row hover:bg-ink-50">
                <span className="min-w-0">
                  <VerifiedMark label={campaignTitle(c, locale)} status="verified" />
                  <span className="block text-xs text-ink-500">
                    {c.venue}
                    {c.area ? ` · ${c.area}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-medium text-ink-500" title={campaignWhen(c.startsAt, locale)}>
                  {formatDate(karachiDate(c.startsAt), locale)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
