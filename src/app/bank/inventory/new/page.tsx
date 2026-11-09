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
const STATUSES = ["approved", "awaiting"] as const;

/**
 * B-03 - Add / edit batch.
 *
 * Wireframe: group, component, units, status, expiry, the inline error line
 * ("Enter a valid expiry date") and Save. Inventory belongs to Module 4
 * (Sprint 1); Save is rendered but does not submit yet.
 */
export default async function AddBatchPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader title={t("nav.bank.addBatch")} />

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
            <TextInput id="units" name="units" type="number" min={1} inputMode="numeric" />
          </Field>

          <Field label={t("field.status")} htmlFor="status">
            <SelectInput id="status" name="status" defaultValue="approved">
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`bank.status.${status}`)}
                </option>
              ))}
            </SelectInput>
          </Field>

          {/* The error line is shown in the same place the validated form shows it. */}
          <Field
            label={t("bank.expiry")}
            htmlFor="expiry"
            error={t("bank.batch.errorExpiry")}
          >
            <TextInput id="expiry" name="expiry" type="date" invalid />
          </Field>

          <Button type="button" block>
            {t("action.save")}
          </Button>
        </form>
      </Card>

      <Placeholder
        wireframe={t("bloodbank.ph.wireframe", { id: "B-03" })}
        description={t("bloodbank.ph.b03")}
        owner={t("bloodbank.owner.inventory")}
        sprint={t("bloodbank.ph.sprint1")}
        tone="sprint1"
      />
    </div>
  );
}
