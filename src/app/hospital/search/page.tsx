import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  LinkButton,
  PageHeader,
  SelectInput,
  VerifiedMark,
} from "@/components/ui";
import { requireRole, requireVerifiedOrganization } from "@/lib/auth/guards";
import { formatDate, formatDateTime, relativeTimeParts } from "@/lib/format";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { COMPONENT_LABEL_KEY } from "@/lib/inventory/labels";
import { searchAvailability } from "@/lib/search/data";
import {
  BLOOD_COMPONENTS,
  BLOOD_GROUPS,
  createRequestHref,
  hasSearchInput,
  telHref,
  validateSearchInput,
  type BloodBankResult,
} from "@/lib/search/rules";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * H-02 - Inventory search (Module 5: FR-INV-07, FR-INV-08, FR-INV-09, FR-VER-03, A-12).
 *
 * Wireframe: "Search blood" - Blood group dropdown, Component dropdown, Search button, then
 * one row per blood bank ("Bank A" with the verified mark, "Exp 12 Nov · Area · Phone"), the
 * "as reported by blood bank" statement, and the empty state.
 *
 * Module 5 additions to the drawing, all required by the SRS: the available quantity (FR-INV-07),
 * the last-updated time (FR-INV-09) and a way to create a request when nothing matches (5.5).
 * The form is a plain GET, so a search can be bookmarked, reloaded and works without JavaScript.
 */
export default async function HospitalSearchPage({ searchParams }: { searchParams: SearchParams }) {
  // Defence in depth: the hospital layout already enforces both, but a page must not rely on
  // being rendered under it (HANDOFF.md section 3). Only a Verified hospital gets past here.
  await requireRole(["hospital"], "/hospital/search");
  await requireVerifiedOrganization("/hospital/search");

  const locale = await getLocale();
  const t = createTranslator(locale);
  const params = await searchParams;

  const submitted = hasSearchInput(params);
  const validation = submitted ? validateSearchInput(params) : null;
  const errors = validation && !validation.ok ? validation.errors : [];
  const fieldError = (field: "bloodGroup" | "component") => {
    const found = errors.find((error) => error.field === field);
    if (!found) return undefined;
    if (found.code === "invalid") return t("hospital.search.error.invalid");
    return field === "bloodGroup"
      ? t("hospital.search.error.groupRequired")
      : t("hospital.search.error.componentRequired");
  };

  const search = validation && validation.ok ? await searchAvailability(validation.values) : null;
  const selectedGroup = typeof params.bloodGroup === "string" ? params.bloodGroup : "";
  const selectedComponent = typeof params.component === "string" ? params.component : "";

  return (
    <div>
      <PageHeader title={t("nav.hospital.search")} />

      <Card className="card-pad">
        <form method="get" action="/hospital/search" className="space-y-4" noValidate>
          <Field
            label={t("field.bloodGroup")}
            htmlFor="bloodGroup"
            error={fieldError("bloodGroup")}
            required
          >
            <SelectInput id="bloodGroup" name="bloodGroup" defaultValue={selectedGroup} required>
              <option value="">{t("hospital.search.chooseGroup")}</option>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {t(`blood.${group}`)}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field
            label={t("field.component")}
            htmlFor="component"
            error={fieldError("component")}
            required
          >
            <SelectInput id="component" name="component" defaultValue={selectedComponent} required>
              <option value="">{t("hospital.search.chooseComponent")}</option>
              {BLOOD_COMPONENTS.map((component) => (
                <option key={component} value={component}>
                  {t(COMPONENT_LABEL_KEY[component])}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Button type="submit" block>
            {t("action.search")}
          </Button>
        </form>
      </Card>

      {search ? (
        <div className="mt-6 space-y-4" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">
              {t("hospital.search.resultsFor", {
                group: t(`blood.${search.values.bloodGroup}`),
                component: t(COMPONENT_LABEL_KEY[search.values.component]),
              })}
            </Badge>
            {search.results.length > 0 ? (
              <span className="text-sm text-ink-600" data-testid="result-count">
                {t("hospital.search.resultCount", { count: search.results.length })}
              </span>
            ) : null}
          </div>

          {search.results.length === 0 ? (
            <>
              <EmptyState
                title={t("hospital.search.empty")}
                description={t("hospital.search.emptyHint", {
                  group: t(`blood.${search.values.bloodGroup}`),
                  component: t(COMPONENT_LABEL_KEY[search.values.component]),
                })}
                action={
                  <div className="flex flex-col items-center gap-1">
                    <LinkButton href={createRequestHref(search.values)}>
                      {t("hospital.search.createRequest")}
                    </LinkButton>
                    <p className="text-xs text-ink-500">{t("hospital.search.createRequestHint")}</p>
                  </div>
                }
              />
              <Alert tone="info">{t("notice.availabilityDisclaimer")}</Alert>
            </>
          ) : (
            <>
              <ul className="space-y-3">
                {search.results.map((bank) => (
                  <li key={bank.organizationId}>
                    <ResultCard bank={bank} locale={locale} t={t} now={new Date(search.searchedAt)} />
                  </li>
                ))}
              </ul>
              <Alert tone="info" title={t("notice.availabilityDisclaimer")}>
                {t("hospital.search.confirmFirst")}
              </Alert>
            </>
          )}
        </div>
      ) : (
        !submitted && (
          <p className="mt-6 text-center text-sm text-ink-500">{t("hospital.search.initialHint")}</p>
        )
      )}
    </div>
  );
}

function ResultCard({
  bank,
  locale,
  t,
  now,
}: {
  bank: BloodBankResult;
  locale: "en" | "ur";
  t: ReturnType<typeof createTranslator>;
  now: Date;
}) {
  const updated = relativeTimeParts(bank.lastUpdatedAt, now);
  const updatedText = bank.lastUpdatedAt
    ? `${
        updated.unit === "now"
          ? t("time.now")
          : updated.unit === "minutes"
            ? t("time.minutesAgo", { count: updated.count })
            : updated.unit === "hours"
              ? t("time.hoursAgo", { count: updated.count })
              : t("time.daysAgo", { count: updated.count })
      } (${formatDateTime(bank.lastUpdatedAt, locale)})`
    : null;

  return (
    <Card className="card-pad space-y-2" >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <VerifiedMark label={bank.name} status={bank.verificationStatus} />
        <span className="text-base font-semibold text-ink-900" data-testid="available-units">
          {t("hospital.search.available", { count: bank.availableUnits })}
        </span>
      </div>

      {/* Wireframe line: "Exp 12 Nov · Area · Phone" */}
      <p className="text-sm text-ink-700">
        {t("hospital.search.expiry", { date: formatDate(bank.earliestExpiry, locale) })} · {bank.area} ·{" "}
        <a href={telHref(bank.phone)} className="text-wasl-700 underline-offset-2 hover:underline">
          {bank.phone}
        </a>
      </p>
      <p className="text-sm text-ink-600">
        {t("hospital.search.email")}:{" "}
        <a href={`mailto:${bank.email}`} className="text-wasl-700 underline-offset-2 hover:underline">
          {bank.email}
        </a>
      </p>

      {/* FR-INV-09: last-updated time and the "as reported by the blood bank" statement. */}
      <p className="text-xs text-ink-500">
        {updatedText ? t("hospital.search.lastUpdated", { when: updatedText }) : t("hospital.search.neverUpdated")}
      </p>
      <p className="text-sm font-medium text-ink-700">{t("notice.availabilityDisclaimer")}</p>
    </Card>
  );
}
