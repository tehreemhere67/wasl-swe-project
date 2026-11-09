import {
  Button,
  Card,
  Field,
  PageHeader,
  SectionTitle,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/ui";
import { Placeholder } from "@/components/ui/placeholder";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const COMPONENTS = ["wholeBlood", "redCells", "platelets", "plasma"] as const;
const URGENCIES = ["critical", "urgent", "planned"] as const;

/**
 * H-06 - Edit / cancel request.
 *
 * Not drawn in the wireframes. The screen repeats the H-03 fields and adds the
 * cancel-with-reason block. Request handling is reserved for Sprint 2
 * (Module REQ), so the actions are disabled.
 */
export default async function EditRequestPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("hospital.edit.title")} />

      <Card className="card-pad">
        <form className="space-y-4">
          <Field label={t("field.bloodGroup")} htmlFor="bloodGroup">
            <SelectInput id="bloodGroup" name="bloodGroup" defaultValue="O-">
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {t(`blood.${group}`)}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label={t("field.component")} htmlFor="component">
            <SelectInput id="component" name="component" defaultValue="redCells">
              {COMPONENTS.map((component) => (
                <option key={component} value={component}>
                  {t(`component.${component}`)}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label={t("field.units")} htmlFor="units">
            <TextInput id="units" name="units" type="number" min={1} inputMode="numeric" defaultValue={2} />
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

          <Button type="submit" block disabled>
            {t("action.save")}
          </Button>
        </form>
      </Card>

      <Card className="card-pad mt-6 space-y-4">
        <SectionTitle>{t("hospital.edit.cancelSection")}</SectionTitle>
        <Field label={t("hospital.edit.cancelReason")} htmlFor="cancelReason">
          <TextArea id="cancelReason" name="cancelReason" />
        </Field>
        <Button type="button" variant="danger" disabled>
          {t("hospital.edit.cancelRequest")}
        </Button>
      </Card>

      <Placeholder
        wireframe={t("hospital.ph.wireframe", { id: "H-06" })}
        description={t("hospital.ph.h06")}
        owner={t("hospital.owner.requests")}
        sprint={t("hospital.ph.sprint2")}
        tone="sprint2"
      />
    </div>
  );
}
