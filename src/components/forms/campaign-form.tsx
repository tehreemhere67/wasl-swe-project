"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { fieldMessages, sendJson } from "./send-json";

/**
 * O-01 - Create campaign (FR-CAM-01, FR-CAM-02), also used to edit a Draft or an Approved campaign (FR-CAM-08).
 *
 * Wireframe order: bilingual title, bilingual description, date, time, venue, target groups, "Save draft",
 * "Submit for Approval". The Karachi area and the contact details are added because the SRS requires them
 * (FR-CAM-01) and donors filter by area (FR-CAM-05). Target groups is a dropdown as drawn: "All blood groups"
 * or one group; a campaign saved earlier with several groups keeps them until the dropdown is changed.
 */

export interface CampaignFormInitial {
  titleEn: string;
  titleUr: string;
  descriptionEn: string;
  descriptionUr: string;
  date: string;
  time: string;
  venue: string;
  area: string;
  targetGroups: string[];
  contactPhone: string;
  contactEmail: string;
}

export function CampaignForm({
  labels,
  groups,
  areas,
  minDate,
  mode = "create",
  campaignId,
  initial,
  canSaveDraft = true,
}: {
  labels: Record<string, string>;
  groups: { value: string; label: string }[];
  areas: { value: string; label: string }[];
  minDate: string;
  mode?: "create" | "edit";
  campaignId?: string;
  initial?: CampaignFormInitial;
  /** False for an Approved campaign: it has no draft state, so only one save button is shown. */
  canSaveDraft?: boolean;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [top, setTop] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [groupTouched, setGroupTouched] = useState(false);
  const busy = useRef(false);
  const isEdit = mode === "edit" && Boolean(campaignId);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const action = submitter?.value === "save_draft" ? "save_draft" : "submit";
    busy.current = true;
    setErrors({});
    setTop(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const chosen = String(form.get("targetGroups") ?? "");
    const reply = await sendJson(
      isEdit ? `/api/organizer/campaigns/${campaignId}` : "/api/organizer/campaigns",
      isEdit ? "PATCH" : "POST",
      {
        action,
        titleEn: String(form.get("titleEn") ?? ""),
        titleUr: String(form.get("titleUr") ?? ""),
        descriptionEn: String(form.get("descriptionEn") ?? ""),
        descriptionUr: String(form.get("descriptionUr") ?? ""),
        date: String(form.get("date") ?? ""),
        time: String(form.get("time") ?? ""),
        venue: String(form.get("venue") ?? ""),
        area: String(form.get("area") ?? ""),
        targetGroups: groupTouched || !initial ? (chosen === "" ? [] : [chosen]) : initial.targetGroups,
        contactPhone: String(form.get("contactPhone") ?? ""),
        contactEmail: String(form.get("contactEmail") ?? ""),
      },
    );
    if (reply.ok) {
      router.push(reply.redirect ?? "/organizer/campaigns");
      router.refresh();
    } else if (reply.errors?.length) {
      setErrors(fieldMessages(reply.errors, labels, labels["organizer.campaign.errorGeneric"]));
    } else {
      setTop(labels["organizer.campaign.errorGeneric"]);
    }
    busy.current = false;
    setPending(false);
  }

  const groupDefault = initial && initial.targetGroups.length === 1 ? initial.targetGroups[0]! : "";

  return (
    <Card className="card-pad">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {top ? (
          <Alert tone="error" role="alert">
            {top}
          </Alert>
        ) : null}

        <Field label={labels["organizer.campaign.titleEn"]} htmlFor="titleEn" required error={errors.titleEn}>
          <TextInput id="titleEn" name="titleEn" maxLength={120} defaultValue={initial?.titleEn ?? ""} invalid={Boolean(errors.titleEn)} />
        </Field>
        <Field label={labels["organizer.campaign.titleUr"]} htmlFor="titleUr" error={errors.titleUr}>
          <TextInput id="titleUr" name="titleUr" dir="rtl" maxLength={120} defaultValue={initial?.titleUr ?? ""} invalid={Boolean(errors.titleUr)} />
        </Field>

        <Field label={labels["organizer.campaign.descriptionEn"]} htmlFor="descriptionEn" error={errors.descriptionEn}>
          <TextArea id="descriptionEn" name="descriptionEn" maxLength={2000} defaultValue={initial?.descriptionEn ?? ""} invalid={Boolean(errors.descriptionEn)} />
        </Field>
        <Field label={labels["organizer.campaign.descriptionUr"]} htmlFor="descriptionUr" error={errors.descriptionUr}>
          <TextArea id="descriptionUr" name="descriptionUr" dir="rtl" maxLength={2000} defaultValue={initial?.descriptionUr ?? ""} invalid={Boolean(errors.descriptionUr)} />
        </Field>

        <Field label={labels["field.date"]} htmlFor="date" required error={errors.date}>
          <TextInput id="date" name="date" type="date" min={minDate} defaultValue={initial?.date ?? ""} invalid={Boolean(errors.date)} />
        </Field>
        <Field label={labels["field.time"]} htmlFor="time" required error={errors.time}>
          <TextInput id="time" name="time" type="time" defaultValue={initial?.time ?? ""} invalid={Boolean(errors.time)} />
        </Field>
        <Field label={labels["organizer.campaign.venue"]} htmlFor="venue" required error={errors.venue}>
          <TextInput id="venue" name="venue" maxLength={200} defaultValue={initial?.venue ?? ""} invalid={Boolean(errors.venue)} />
        </Field>
        <Field label={labels["field.area"]} htmlFor="area" required error={errors.area}>
          <SelectInput id="area" name="area" defaultValue={initial?.area ?? ""} invalid={Boolean(errors.area)}>
            <option value="" disabled>
              {labels["organizer.campaign.chooseArea"]}
            </option>
            {areas.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label={labels["organizer.campaign.targetGroups"]} htmlFor="targetGroups" error={errors.targetGroups}>
          <SelectInput
            id="targetGroups"
            name="targetGroups"
            defaultValue={groupDefault}
            onChange={() => setGroupTouched(true)}
            invalid={Boolean(errors.targetGroups)}
          >
            <option value="">{labels["organizer.campaign.allGroups"]}</option>
            {groups.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label={labels["organizer.campaign.contactPhone"]} htmlFor="contactPhone" error={errors.contactPhone}>
          <TextInput id="contactPhone" name="contactPhone" type="tel" inputMode="tel" defaultValue={initial?.contactPhone ?? ""} invalid={Boolean(errors.contactPhone)} />
        </Field>
        <Field label={labels["organizer.campaign.contactEmail"]} htmlFor="contactEmail" optionalLabel={labels["field.optional"]} error={errors.contactEmail}>
          <TextInput id="contactEmail" name="contactEmail" type="email" defaultValue={initial?.contactEmail ?? ""} invalid={Boolean(errors.contactEmail)} />
        </Field>

        {isEdit && !canSaveDraft ? <p className="hint">{labels["organizer.campaign.editHint"]}</p> : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          {canSaveDraft ? (
            <Button type="submit" value="save_draft" variant="secondary" block disabled={pending}>
              {pending ? labels["organizer.campaign.saving"] : labels["organizer.campaign.saveDraft"]}
            </Button>
          ) : null}
          <Button type="submit" value="submit" block disabled={pending}>
            {pending
              ? labels["organizer.campaign.saving"]
              : canSaveDraft
                ? labels["organizer.campaign.submit"]
                : labels["organizer.campaign.saveChanges"]}
          </Button>
        </div>
      </form>
    </Card>
  );
}
