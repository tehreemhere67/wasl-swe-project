import { Button, PageHeader, TextInput } from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

/**
 * A-03 - Account management.
 *
 * Wireframe: "Accounts", the search field, the "Donor/org · Status" row and
 * the Deactivate / Reactivate actions. Accounts belong to Module 8 (Sprint 1,
 * Member 2); the controls are rendered but do not submit yet.
 */
export default async function AdminAccountsPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("admin.accounts.title")} />

      <TextInput
        id="accountSearch"
        name="accountSearch"
        type="search"
        placeholder={t("action.search")}
        aria-label={t("action.search")}
      />

      <div className="mt-4">
        <div className="list-row">
          <span className="text-sm font-semibold text-ink-900">{t("admin.accounts.row")}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="secondary">
          {t("admin.accounts.deactivate")}
        </Button>
        <Button type="button">{t("admin.accounts.reactivate")}</Button>
      </div>

      <Placeholder
        wireframe={t("admin.ph.wireframe", { id: "A-03" })}
        description={t("admin.ph.a03")}
        owner={t("admin.owner.admin")}
        sprint={t("admin.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
