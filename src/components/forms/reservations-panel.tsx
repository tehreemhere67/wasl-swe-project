"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, TextInput } from "@/components/ui";

/**
 * B-04 reservations - 4.6 (FR-INV-04, A-10).
 *
 * Sets units aside for a period the bank chooses (default 6 hours) and releases
 * them again. Reserved units still physically exist but stop counting as
 * available, which is what stops the same units being promised twice.
 */

export interface ReservationRow {
  id: string;
  /** "2 units · held until 9:30 pm", already translated on the server. */
  label: string;
}

export interface ReservationsLabels {
  reserve: string;
  units: string;
  holdHours: string;
  release: string;
  none: string;
  working: string;
  errors: Record<string, string>;
  errorGeneric: string;
}

interface ApiFieldError {
  field: string;
  message: string;
}

export function ReservationsPanel({
  batchId,
  freeUnits,
  reservations,
  labels,
}: {
  batchId: string;
  freeUnits: number;
  reservations: ReservationRow[];
  labels: ReservationsLabels;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  async function post(url: string, body?: unknown) {
    if (submitting.current) return;
    submitting.current = true;

    setTopError(null);
    setErrors({});
    setPending(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await response.json()) as {
        ok?: boolean;
        errors?: ApiFieldError[];
        error?: { code?: string };
      };

      if (data.ok) {
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

  function handleReserve(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    void post(`/api/inventory/batches/${batchId}/reservations`, {
      units: String(formData.get("units") ?? ""),
      holdHours: String(formData.get("holdHours") ?? ""),
    });
  }

  return (
    <div className="space-y-4">
      {topError ? (
        <Alert tone="error" role="alert">
          {topError}
        </Alert>
      ) : null}

      {reservations.length === 0 ? (
        <p className="text-sm text-ink-500">{labels.none}</p>
      ) : (
        <ul className="divide-y divide-ink-100 rounded-xl border border-ink-100">
          {reservations.map((reservation) => (
            <li
              key={reservation.id}
              data-reservation-id={reservation.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
            >
              <div className="text-sm">
                <span className="font-semibold text-ink-900">{reservation.label}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => void post(`/api/inventory/reservations/${reservation.id}/release`)}
              >
                {labels.release}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleReserve} className="flex flex-wrap items-end gap-3" noValidate>
        <div className="w-32">
          <Field label={labels.units} htmlFor="reserveUnits" error={errors.units}>
            <TextInput
              id="reserveUnits"
              name="units"
              type="number"
              inputMode="numeric"
              min={1}
              max={freeUnits}
              step={1}
              defaultValue=""
              invalid={Boolean(errors.units)}
            />
          </Field>
        </div>
        <div className="w-32">
          <Field label={labels.holdHours} htmlFor="holdHours" error={errors.holdHours}>
            <TextInput
              id="holdHours"
              name="holdHours"
              type="number"
              inputMode="numeric"
              min={1}
              max={72}
              step={1}
              defaultValue="6"
              invalid={Boolean(errors.holdHours)}
            />
          </Field>
        </div>
        <Button type="submit" variant="secondary" disabled={pending || freeUnits <= 0}>
          {pending ? labels.working : labels.reserve}
        </Button>
      </form>
    </div>
  );
}
