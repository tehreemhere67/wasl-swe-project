"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, SelectInput, TextInput } from "@/components/ui";
import { BLOOD_COMPONENTS, BLOOD_GROUPS, TESTING_STATUSES } from "@/lib/inventory/rules";

/**
 * B-03 - Add batch (FR-INV-01) and its edit mode (FR-INV-03).
 *
 * Follows the wireframe: Group, Component, Units, Status, Expiry, an inline
 * error line under the field that is wrong, and Save. Every label is passed in
 * already translated, so the form works in English and Urdu without knowing
 * which language is active.
 */

export interface BatchFormLabels {
  group: string;
  component: string;
  units: string;
  status: string;
  expiry: string;
  expiryHint: string;
  save: string;
  saving: string;
  groupOption: string;
  componentOption: string;
  statusOption: string;
  groups: Record<string, string>;
  components: Record<string, string>;
  statuses: Record<string, string>;
  /** Keyed by the error code the API returns (e.g. `inventory.error.units`). */
  errors: Record<string, string>;
  errorGeneric: string;
}

export interface BatchFormInitial {
  bloodGroup: string;
  component: string;
  units: number;
  status: string;
  /** ISO timestamp; the date input only needs the first ten characters. */
  expiresAt: string;
}

interface ApiFieldError {
  field: string;
  message: string;
}

/** Today in Karachi, used as the `min` of the date input when creating. */
function todayInKarachi(): string {
  const now = new Date();
  const pkt = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  return pkt.toISOString().slice(0, 10);
}

export function BatchForm({
  labels,
  mode = "create",
  batchId,
  initial,
}: {
  labels: BatchFormLabels;
  mode?: "create" | "edit";
  batchId?: string;
  initial?: BatchFormInitial;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // A ref guards against a double click creating two batches before React
  // re-renders the disabled button.
  const submitting = useRef(false);

  const isEdit = mode === "edit" && Boolean(batchId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;

    setErrors({});
    setTopError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      bloodGroup: String(formData.get("bloodGroup") ?? ""),
      component: String(formData.get("component") ?? ""),
      units: String(formData.get("units") ?? ""),
      status: String(formData.get("status") ?? ""),
      expiresAt: String(formData.get("expiresAt") ?? ""),
    };

    setPending(true);
    try {
      const response = await fetch(
        isEdit ? `/api/inventory/batches/${batchId}` : "/api/inventory/batches",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json()) as {
        ok?: boolean;
        redirect?: string;
        errors?: ApiFieldError[];
        error?: { code?: string };
      };

      if (data.ok) {
        router.push(data.redirect ?? "/bank/inventory");
        router.refresh();
        return;
      }

      if (data.errors?.length) {
        const mapped: Record<string, string> = {};
        for (const error of data.errors) {
          mapped[error.field] = labels.errors[error.message] ?? labels.errorGeneric;
        }
        setErrors(mapped);
        return;
      }

      setTopError(labels.errorGeneric);
    } catch {
      setTopError(labels.errorGeneric);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {topError ? (
        <Alert tone="error" role="alert">
          {topError}
        </Alert>
      ) : null}

      <Field label={labels.group} htmlFor="bloodGroup" required error={errors.bloodGroup}>
        <SelectInput
          id="bloodGroup"
          name="bloodGroup"
          defaultValue={initial?.bloodGroup ?? ""}
          invalid={Boolean(errors.bloodGroup)}
          required
        >
          <option value="" disabled>
            {labels.groupOption}
          </option>
          {BLOOD_GROUPS.map((group) => (
            <option key={group} value={group}>
              {labels.groups[group] ?? group}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Field label={labels.component} htmlFor="component" required error={errors.component}>
        <SelectInput
          id="component"
          name="component"
          defaultValue={initial?.component ?? ""}
          invalid={Boolean(errors.component)}
          required
        >
          <option value="" disabled>
            {labels.componentOption}
          </option>
          {BLOOD_COMPONENTS.map((component) => (
            <option key={component} value={component}>
              {labels.components[component] ?? component}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Field label={labels.units} htmlFor="units" required error={errors.units}>
        <TextInput
          id="units"
          name="units"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={initial ? String(initial.units) : ""}
          invalid={Boolean(errors.units)}
          required
        />
      </Field>

      <Field label={labels.status} htmlFor="status" required error={errors.status}>
        <SelectInput
          id="status"
          name="status"
          defaultValue={initial?.status ?? "awaiting_testing"}
          invalid={Boolean(errors.status)}
          required
        >
          {TESTING_STATUSES.map((status) => (
            <option key={status} value={status}>
              {labels.statuses[status] ?? status}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Field
        label={labels.expiry}
        htmlFor="expiresAt"
        hint={labels.expiryHint}
        required
        error={errors.expiresAt}
      >
        <TextInput
          id="expiresAt"
          name="expiresAt"
          type="date"
          min={isEdit ? undefined : todayInKarachi()}
          defaultValue={initial ? initial.expiresAt.slice(0, 10) : ""}
          invalid={Boolean(errors.expiresAt)}
          required
        />
      </Field>

      <div className="pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </Button>
      </div>
    </form>
  );
}
