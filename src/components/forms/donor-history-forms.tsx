"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, TextInput } from "@/components/ui";
import { PlusIcon } from "@/components/ui/icons";
import { fieldMessages, sendJson } from "./send-json";

/**
 * D-04 - the "+ Add past donation" action (FR-DON-03) and the "Remind me after N days" field (FR-DON-06).
 * Both post to the donor's own endpoints and refresh the page, so the new row and total appear at once.
 */

export function AddPastDonation({ labels, maxDate }: { labels: Record<string, string>; maxDate: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setErrors({});
    setMessage(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const reply = await sendJson("/api/donor/history", "POST", {
      donatedOn: String(form.get("donatedOn") ?? ""),
      place: String(form.get("place") ?? ""),
    });
    if (reply.ok) {
      setMessage({ tone: "success", text: labels["donor.history.added"] });
      setOpen(false);
      router.refresh();
    } else if (reply.errors?.length) {
      setErrors(fieldMessages(reply.errors, labels, labels["donor.profile.errorGeneric"]));
    } else {
      setMessage({ tone: "error", text: labels["donor.profile.errorGeneric"] });
    }
    busy.current = false;
    setPending(false);
  }

  return (
    <div>
      {message ? (
        <div className="mb-3">
          <Alert tone={message.tone} role={message.tone === "error" ? "alert" : "status"}>
            {message.text}
          </Alert>
        </div>
      ) : null}
      {open ? (
        <form onSubmit={submit} className="card card-pad space-y-4" noValidate>
          <Field label={labels["donor.history.addDate"]} htmlFor="donatedOn" required error={errors.donatedOn}>
            <TextInput id="donatedOn" name="donatedOn" type="date" max={maxDate} invalid={Boolean(errors.donatedOn)} required />
          </Field>
          <Field label={labels["donor.history.addPlace"]} htmlFor="place" required error={errors.place}>
            <TextInput id="place" name="place" maxLength={120} invalid={Boolean(errors.place)} required />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? labels["donor.history.saving"] : labels["donor.history.addSave"]}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              {labels["donor.history.cancelAdd"]}
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          <PlusIcon className="h-4 w-4" />
          {labels["donor.history.addPast"]}
        </Button>
      )}
    </div>
  );
}

export function ReminderField({
  labels,
  initialDays,
  nextDate,
}: {
  labels: Record<string, string>;
  initialDays: number | null;
  nextDate: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setMessage(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const value = String(form.get("remindDays") ?? "").trim();
    const reply = await sendJson("/api/donor/reminder", "PATCH", { remindDays: value });
    if (reply.ok) {
      setMessage(value === "" ? labels["donor.history.reminderCleared"] : labels["donor.history.reminderSaved"]);
      router.refresh();
    } else if (reply.errors?.length) {
      setError(labels[reply.errors[0]!.message] ?? labels["donor.profile.errorGeneric"]);
    } else {
      setError(labels["donor.profile.errorGeneric"]);
    }
    busy.current = false;
    setPending(false);
  }

  return (
    <form onSubmit={submit} noValidate>
      {/* Wireframe: "Remind me after N days" */}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="remindDays" className="text-sm text-ink-700">
          {labels["donor.history.remindBefore"]}
        </label>
        <TextInput
          id="remindDays"
          name="remindDays"
          type="number"
          min={1}
          max={365}
          inputMode="numeric"
          defaultValue={initialDays === null ? "" : String(initialDays)}
          invalid={Boolean(error)}
          className="w-20"
        />
        <span className="text-sm text-ink-700">{labels["donor.history.remindAfter"]}</span>
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {labels["donor.history.reminderSave"]}
        </Button>
      </div>
      <p className="hint mt-1">{labels["donor.history.reminderHint"]}</p>
      {nextDate ? <p className="hint">{nextDate}</p> : null}
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-1 text-sm text-ok-900" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
