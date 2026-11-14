import type { BatchActionsLabels } from "@/components/forms/batch-actions";
import type { BatchFormLabels } from "@/components/forms/batch-form";
import type { ReservationsLabels } from "@/components/forms/reservations-panel";
import type { Translator } from "@/lib/i18n";
import { COMPONENT_LABEL_KEY, TESTING_STATUS_LABEL_KEY } from "./labels";
import { BLOOD_COMPONENTS, BLOOD_GROUPS, TESTING_STATUSES } from "./rules";

/**
 * Builds the already-translated label bundle for the B-03 form, so the create
 * page and the edit page cannot drift apart (NFR-LOC-01: no hard-coded text in
 * a component).
 */
export function buildBatchFormLabels(
  t: Translator,
  mode: "create" | "edit" = "create",
): BatchFormLabels {
  return {
    group: t("field.bloodGroup"),
    component: t("field.component"),
    units: t("field.units"),
    status: t("field.status"),
    expiry: t("inventory.field.expiry"),
    expiryHint: t("inventory.field.expiryHint"),
    save: mode === "edit" ? t("inventory.saveChanges") : t("inventory.save"),
    saving: t("inventory.saving"),
    groupOption: t("inventory.select.group"),
    componentOption: t("inventory.select.component"),
    statusOption: t("inventory.select.status"),
    groups: Object.fromEntries(BLOOD_GROUPS.map((group) => [group, t(`blood.${group}`)])),
    components: Object.fromEntries(
      BLOOD_COMPONENTS.map((component) => [component, t(COMPONENT_LABEL_KEY[component])]),
    ),
    statuses: Object.fromEntries(
      TESTING_STATUSES.map((status) => [status, t(TESTING_STATUS_LABEL_KEY[status])]),
    ),
    errors: {
      "inventory.error.bloodGroup": t("inventory.error.bloodGroup"),
      "inventory.error.component": t("inventory.error.component"),
      "inventory.error.units": t("inventory.error.units"),
      "inventory.error.status": t("inventory.error.status"),
      "inventory.error.expiryInvalid": t("inventory.error.expiryInvalid"),
      "inventory.error.expiryPast": t("inventory.error.expiryPast"),
    },
    errorGeneric: t("inventory.error.generic"),
  };
}

/** Labels for the 4.6 reservations panel on B-04. */
export function buildReservationsLabels(t: Translator): ReservationsLabels {
  return {
    reserve: t("inventory.reserve.action"),
    units: t("inventory.reserve.units"),
    holdHours: t("inventory.reserve.holdHours"),
    release: t("inventory.reserve.release"),
    none: t("inventory.reserve.none"),
    working: t("inventory.reserve.working"),
    errors: {
      "inventory.error.units": t("inventory.error.units"),
      "inventory.error.reserveTooMany": t("inventory.error.reserveTooMany"),
      "inventory.error.holdHours": t("inventory.error.holdHours"),
    },
    errorGeneric: t("inventory.error.generic"),
  };
}

/** Labels for the 4.4 action bar on B-04. */
export function buildBatchActionsLabels(
  t: Translator,
  unitsHeld: number,
): BatchActionsLabels {
  return {
    issue: t("inventory.action.issue"),
    discard: t("inventory.action.discard"),
    expire: t("inventory.action.expire"),
    correct: t("inventory.action.correct"),
    transfer: t("inventory.action.transfer"),
    units: t("field.units"),
    note: t("inventory.action.note"),
    reason: t("inventory.action.reason"),
    confirm: t("inventory.action.confirm"),
    cancel: t("inventory.action.cancel"),
    working: t("inventory.action.working"),
    receivingBank: t("inventory.field.receivingBank"),
    receivingBankOption: t("inventory.select.receivingBank"),
    issueHint: t("inventory.action.issueHint"),
    discardHint: t("inventory.action.discardHint"),
    expireWarning: t("inventory.action.expireWarning", { units: unitsHeld }),
    correctHint: t("inventory.action.correctHint"),
    transferHint: t("inventory.action.transferHint"),
    noTransferTargets: t("inventory.transfer.none"),
    errors: {
      "inventory.error.units": t("inventory.error.units"),
      "inventory.error.unitsTooMany": t("inventory.error.unitsTooMany"),
      "inventory.error.reason": t("inventory.error.reason"),
      "inventory.error.nothingToExpire": t("inventory.error.nothingToExpire"),
      "inventory.error.movementType": t("inventory.error.movementType"),
      "inventory.error.receivingBank": t("inventory.error.receivingBank"),
    },
    errorGeneric: t("inventory.error.generic"),
  };
}
