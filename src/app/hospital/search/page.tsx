import {
  Button,
  Card,
  EmptyState,
  Field,
  PageHeader,
  SelectInput,
  VerifiedMark,
} from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const COMPONENTS = ["wholeBlood", "redCells", "platelets", "plasma"] as const;

/**
 * H-02 - Inventory search.
 *
 * Wireframe: the "Search blood" form (blood group, component, Search), one
 * example result card (bank with verified mark, "Exp 12 Nov · Area · Phone",
 * the "as reported by blood bank" statement) and the empty state. There is no
 * backend yet: the form issues a GET that the availability search module
 * (Module 5, Sprint 1) will handle.
 */
export default async function HospitalSearchPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("nav.hospital.search")} />

      <Card className="card-pad">
        <form method="get" action="/hospital/search" className="space-y-4">
          <Field label={t("field.bloodGroup")} htmlFor="bloodGroup">
            <SelectInput id="bloodGroup" name="bloodGroup" defaultValue="">
              <option value="">{t("hospital.search.anyGroup")}</option>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {t(`blood.${group}`)}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label={t("field.component")} htmlFor="component">
            <SelectInput id="component" name="component" defaultValue="">
              <option value="">{t("hospital.search.anyComponent")}</option>
              {COMPONENTS.map((component) => (
                <option key={component} value={component}>
                  {t(`component.${component}`)}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Button type="submit" block>
            {t("action.search")}
          </Button>
        </form>
      </Card>

      <div className="mt-6">
        <Card className="card-pad space-y-2">
          <VerifiedMark label={t("hospital.sample.bankA")} status="verified" />
          <p className="text-sm text-ink-600">
            {t("hospital.search.expiry")} · {t("hospital.search.sampleArea")} · 0300 1234567
          </p>
          <p className="text-sm font-medium text-ink-700">{t("notice.availabilityDisclaimer")}</p>
        </Card>
      </div>

      <div className="mt-6">
        <EmptyState
          title={t("hospital.search.empty")}
          description={t("hospital.search.emptyHint")}
        />
      </div>

      <Placeholder
        wireframe={t("hospital.ph.wireframe", { id: "H-02" })}
        description={t("hospital.ph.h02")}
        owner={t("hospital.owner.search")}
        sprint={t("hospital.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
