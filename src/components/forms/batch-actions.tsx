"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, SelectInput, TextInput } from "@/components/ui";
import type { ManualMovementType } from "@/lib/inventory/rules";

/**
 * B-04 actions - 4.4 and 4.7 (FR-INV-05, FR-INV-06, FR-MON-02).
 *
 * Issue, Discard, Mark expired and Correct post to the movements endpoint;
 * Transfer out posts to the transfers endpoint and names the receiving verified
 * blood bank. Each one only *records* what happened - Wasl never moves or
 * discards blood itself (BR-4).
 */

type Action = ManualMovementType | "transfer";

export interface BatchActionsLabels {
  issue: string;
  discard: string;
  expire: string;
  correct: string;
  transfer: string;
  units: string;
  note: string;
  reason: string;
  confirm: string;
  cancel: string;
  working: string;
  receivingBank: string;
  receivingBankOption: string;
  issueHint: string;
  discardHint: string;
  expireWarning: string;
  correctHint: string;
  transferHint: string;
  noTransferTargets: string;
  errors: Record<string, string>;
  errorGeneric: string;
}

export interface TransferTarget {
  id: string;
  name: string;
}

interface ApiFieldError {
  field: string;
  message: string;
}

export function BatchActions({
  batchId,
  unitsHeld,
  transferTargets,
  labels,
}: {
  batchId: string;
  unitsHeld: number;
  transferTargets: TransferTarget[];
  labels: BatchActionsLabels;
}) {
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  function open(next: Action) {
    setAction(next);
    setErrors({});
    setTopError(null);
  }

  function hintFor(type: Action): string {
    if (type === "issued") return labels.issueHint;
    if (type === "discarded") return labels.discardHint;
    if (type === "expired") return labels.expireWarning;
    if (type === "transfer") return labels.transferHint;
    return labels.correctHint;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    if (submitting.current) return;
    submitting.current = true;

    setTopError(null);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const payload: Record<string, string> = {
      units: String(formData.get("units") ?? ""),
      note: String(formData.get("note") ?? ""),
    };

    let url = `/api/inventory/batches/${batchId}/movements`;
    if (action === "transfer") {
      url = `/api/inventory/batches/${batchId}/transfers`;
      payload.receivingOrganizationId = String(formData.get("receivingOrganizationId") ?? "");
    } else {
      payload.type = action;
    }

    setPending(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        errors?: ApiFieldError[];
        error?: { code?: string };
      };

      if (data.ok) {
        setAction(null);
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

  const needsUnits = action !== null && action !== "expired";
  const needsReason = action === "correction";
  const hasTargets = transferTargets.length > 0;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => open("issued")} disabled={unitsHeld === 0}>
          {labels.issue}
        </Button>
        <Button variant="secondary" onClick={() => open("discarded")} disabled={unitsHeld === 0}>
          {labels.discard}
        </Button>
        <Button variant="secondary" onClick={() => open("expired")} disabled={unitsHeld === 0}>
          {labels.expire}
        </Button>
        <Button
          variant="secondary"
          onClick={() => open("transfer")}
          disabled={unitsHeld === 0 || !hasTargets}
        >
          {labels.transfer}
        </Button>
        <Button variant="ghost" onClick={() => open("correction")}>
          {labels.correct}
        </Button>
      </div>

      {!hasTargets ? <p className="mt-2 text-xs text-ink-500">{labels.noTransferTargets}</p> : null}

      {action ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-ink-100 pt-4" noValidate>
          <p className="text-sm text-ink-600">{hintFor(action)}</p>

          {topError ? (
            <Alert tone="error" role="alert">
              {topError}
            </Alert>
          ) : null}

          {action === "transfer" ? (
            <Field
              label={labels.receivingBank}
              htmlFor="receivingOrganizationId"
              required
              error={errors.receivingOrganizationId}
            >
              <SelectInput
                id="receivingOrganizationId"
                name="receivingOrganizationId"
                defaultValue=""
                invalid={Boolean(errors.receivingOrganizationId)}
                required
              >
                <option value="" disabled>
                  {labels.receivingBankOption}
                </option>
                {transferTargets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          ) : null}

          {needsUnits ? (
            <Field label={labels.units} htmlFor="units" required error={errors.units}>
              <TextInput
                id="units"
                name="units"
                type="number"
                inputMode="numeric"
                min={needsReason ? 0 : 1}
                max={needsReason ? undefined : unitsHeld}
                step={1}
                defaultValue=""
                invalid={Boolean(errors.units)}
                required
              />
            </Field>
          ) : null}

          <Field
            label={needsReason ? labels.reason : labels.note}
            htmlFor="note"
            required={needsReason}
            error={errors.note}
          >
            <TextInput
              id="note"
              name="note"
              type="text"
              defaultValue=""
              invalid={Boolean(errors.note)}
              required={needsReason}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? labels.working : labels.confirm}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAction(null);
                setErrors({});
                setTopError(null);
              }}
              disabled={pending}
            >
              {labels.cancel}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
