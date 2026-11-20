"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Field, TextInput } from "@/components/ui";
import { fieldMessages, sendJson } from "./send-json";

/**
 * O-03 - Completion form (FR-CAM-09, FR-DON-04). Wireframe: Attendees, Donations, "Record donor phone", Save.
 * Saving with a phone records a donation for that registered donor; save again for the next donor.
 */
export function OutcomeForm({
  campaignId,
  labels,
  initialAttendees,
  initialDonations,
  recordedCount,
}: {
  campaignId: string;
  labels: Record<string, string>;
  initialAttendees: number | null;
  initialDonations: number | null;
  recordedCount: number;
}) {
  const router = useRouter();
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
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const reply = await sendJson(`/api/organizer/campaigns/${campaignId}/outcome`, "POST", {
      attendees: String(form.get("attendees") ?? ""),
      donations: String(form.get("donations") ?? ""),
      donorPhone: String(form.get("donorPhone") ?? ""),
    });
    if (reply.ok) {
      setMessage({
        tone: "success",
        text: reply.data.recorded === "donor" ? labels["organizer.complete.donorRecorded"] : labels["organizer.complete.saved"],
      });
      const phone = formElement.elements.namedItem("donorPhone") as HTMLInputElement | null;
      if (phone) phone.value = "";
      router.refresh();
    } else if (reply.errors?.length) {
      setErrors(fieldMessages(reply.errors, labels, labels["organizer.campaign.errorGeneric"]));
    } else {
      setMessage({ tone: "error", text: labels["organizer.campaign.errorGeneric"] });
    }
    busy.current = false;
    setPending(false);
  }

  return (
    <Card className="card-pad">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {message ? (
          <Alert tone={message.tone} role={message.tone === "error" ? "alert" : "status"}>
            {message.text}
          </Alert>
        ) : null}
        <Field label={labels["organizer.complete.attendees"]} htmlFor="attendees" required error={errors.attendees}>
          <TextInput id="attendees" name="attendees" type="number" min={0} inputMode="numeric" defaultValue={initialAttendees === null ? "" : String(initialAttendees)} invalid={Boolean(errors.attendees)} />
        </Field>
        <Field label={labels["organizer.complete.donations"]} htmlFor="donations" required error={errors.donations}>
          <TextInput id="donations" name="donations" type="number" min={0} inputMode="numeric" defaultValue={initialDonations === null ? "" : String(initialDonations)} invalid={Boolean(errors.donations)} />
        </Field>
        <Field
          label={labels["organizer.complete.donorPhone"]}
          htmlFor="donorPhone"
          hint={labels["organizer.complete.donorHint"]}
          optionalLabel={labels["field.optional"]}
          error={errors.donorPhone}
        >
          <TextInput id="donorPhone" name="donorPhone" type="tel" inputMode="tel" invalid={Boolean(errors.donorPhone)} />
        </Field>
        {recordedCount > 0 ? (
          <p className="text-sm text-ink-600">{labels["organizer.complete.recordedCount"].replace("{count}", String(recordedCount))}</p>
        ) : null}
        <Button type="submit" block disabled={pending}>
          {pending ? labels["organizer.complete.saving"] : labels["action.save"]}
        </Button>
      </form>
    </Card>
  );
}
