"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Checkbox, TextInput } from "@/components/ui";
import { BLOOD_COMPONENTS, BLOOD_GROUPS } from "@/lib/inventory/rules";

/**
 * B-05 - Threshold and windows (FR-MON-01, FR-MON-03/04).
 *
 * Matches the wireframe: the low-stock threshold section, the expiry warning
 * windows, the SMS alerts checkbox and Save. Thresholds are per blood group and
 * component because that is what 7.3 asks for; an empty box means "use the
 * default of 5".
 */

export interface InventorySettingsLabels {
  thresholdNote: string;
  windowsTitle: string;
  windowsNote: string;
  sms: string;
  save: string;
  saving: string;
  saved: string;
  errorGeneric: string;
  group: string;
  groupLabels: Record<string, string>;
  componentLabels: Record<string, string>;
  /** Component default in days, used as the input placeholder. */
  defaultDays: Record<string, number>;
  errors: Record<string, string>;
}

export interface SettingsInitial {
  /** Keyed `${bloodGroup}|${component}`; missing means "default". */
  thresholds: Record<string, number>;
  warningDays: Record<string, number>;
  smsAlerts: boolean;
}

export function InventorySettingsForm({
  labels,
  initial,
}: {
  labels: InventorySettingsLabels;
  initial: SettingsInitial;
}) {
  const router = useRouter();
  const [topError, setTopError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;

    setTopError(null);
    setSaved(false);

    const formData = new FormData(event.currentTarget);

    const thresholds = [];
    for (const group of BLOOD_GROUPS) {
      for (const component of BLOOD_COMPONENTS) {
        thresholds.push({
          bloodGroup: group,
          component,
          thresholdUnits: String(formData.get(`threshold.${group}.${component}`) ?? ""),
        });
      }
    }

    const warningDays: Record<string, string> = {};
    for (const component of BLOOD_COMPONENTS) {
      warningDays[component] = String(formData.get(`window.${component}`) ?? "");
    }

    setPending(true);
    try {
      const response = await fetch("/api/inventory/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          thresholds,
          warningDays,
          smsAlerts: formData.get("smsAlerts") === "on",
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        errors?: Array<{ field: string; message: string }>;
        error?: { code?: string };
      };

      if (data.ok) {
        setSaved(true);
        router.refresh();
        return;
      }

      if (data.errors?.length) {
        setTopError(labels.errors[data.errors[0].message] ?? labels.errorGeneric);
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
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {saved ? <Alert tone="success">{labels.saved}</Alert> : null}
      {topError ? (
        <Alert tone="error" role="alert">
          {topError}
        </Alert>
      ) : null}

      <section>
        <p className="mb-3 text-sm text-ink-600">{labels.thresholdNote}</p>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th className="w-28">{labels.group}</th>
                {BLOOD_COMPONENTS.map((component) => (
                  <th key={component}>{labels.componentLabels[component] ?? component}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOOD_GROUPS.map((group) => (
                <tr key={group}>
                  <td className="font-semibold">{labels.groupLabels[group] ?? group}</td>
                  {BLOOD_COMPONENTS.map((component) => (
                    <td key={component}>
                      <TextInput
                        name={`threshold.${group}.${component}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        placeholder="5"
                        defaultValue={initial.thresholds[`${group}|${component}`] ?? ""}
                        aria-label={`${labels.groupLabels[group] ?? group} ${labels.componentLabels[component] ?? component}`}
                        className="w-20"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-ink-900">{labels.windowsTitle}</h2>
        <p className="mb-3 mt-1 text-sm text-ink-600">{labels.windowsNote}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BLOOD_COMPONENTS.map((component) => (
            <div key={component}>
              <label className="label" htmlFor={`window.${component}`}>
                {labels.componentLabels[component] ?? component}
              </label>
              <TextInput
                id={`window.${component}`}
                name={`window.${component}`}
                type="number"
                inputMode="numeric"
                min={0}
                max={365}
                step={1}
                placeholder={String(labels.defaultDays[component] ?? "")}
                defaultValue={initial.warningDays[component] ?? ""}
                className="w-24"
              />
            </div>
          ))}
        </div>
      </section>

      <Checkbox name="smsAlerts" label={labels.sms} defaultChecked={initial.smsAlerts} />

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </Button>
      </div>
    </form>
  );
}
