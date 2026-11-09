import {
  Button,
  Card,
  Field,
  PageHeader,
  SelectInput,
  TextInput,
} from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const COMPONENTS = ["wholeBlood", "redCells", "platelets", "plasma"] as const;
const URGENCIES = ["critical", "urgent", "planned"] as const;

/**
 * H-03 - Create request.
 *
 * Wireframe: blood group, component, units, the urgency buttons, needed-by,
 * contact person, collection blood bank, the "No patient names" note and the
 * submit button. The request module (Module REQ) builds this in Sprint 2, so
 * the submit button is disabled and the ownership notice is shown below.
 */
export default async function NewRequestPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("nav.hospital.newRequest")} />

      <Card className="card-pad">
        <form className="space-y-4">
          <Field label={t("field.bloodGroup")} htmlFor="bloodGroup">
            <SelectInput id="bloodGroup" name="bloodGroup">
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {t(`blood.${group}`)}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label={t("field.component")} htmlFor="component">
            <SelectInput id="component" name="component">
              {COMPONENTS.map((component) => (
                <option key={component} value={component}>
                  {t(`component.${component}`)}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label={t("field.units")} htmlFor="units">
            <TextInput id="units" name="units" type="number" min={1} inputMode="numeric" />
          </Field>

          <div>
            <span className="label">{t("hospital.req.urgency")}</span>
            <div className="grid grid-cols-3 gap-2">
              {URGENCIES.map((urgency) => (
                <Button key={urgency} type="button" variant="secondary" size="sm">
                  {t(`hospital.req.${urgency}`)}
                </Button>
              ))}
            </div>
          </div>

          <Field label={t("hospital.req.neededBy")} htmlFor="neededBy">
            <TextInput id="neededBy" name="neededBy" type="datetime-local" />
          </Field>

          <Field label={t("hospital.req.contactPerson")} htmlFor="contactPerson">
            <TextInput id="contactPerson" name="contactPerson" />
          </Field>

          <Field label={t("hospital.req.collectionBank")} htmlFor="collectionBank">
            <SelectInput id="collectionBank" name="collectionBank" defaultValue="bank-a">
              <option value="">{t("hospital.req.selectBank")}</option>
              <option value="bank-a">{t("hospital.sample.bankA")}</option>
            </SelectInput>
          </Field>

          <p className="text-sm text-ink-500">{t("hospital.req.noPatientNames")}</p>

          <Button type="submit" block disabled>
            {t("action.submit")}
          </Button>
        </form>
      </Card>

      <Placeholder
        wireframe={t("hospital.ph.wireframe", { id: "H-03" })}
        description={t("hospital.ph.h03")}
        owner={t("hospital.owner.requests")}
        sprint={t("hospital.ph.sprint2")}
        tone="sprint2"
      />
    </div>
  );
}
