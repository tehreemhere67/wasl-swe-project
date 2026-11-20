"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Checkbox, Field, SelectInput } from "@/components/ui";
import { fieldMessages, sendJson } from "./send-json";

/**
 * D-03 - Donor profile (FR-DON-02, FR-DON-05).
 *
 * Wireframe order: blood group, area, SMS / WhatsApp / Platform channels, Urgent / Campaign notices,
 * language, Save, then the Delete account button. Availability is added after the area because the SRS
 * profile includes it (FR-DON-02, FR-DON-05). Every label is passed in already translated.
 */

export interface DonorProfileInitial {
  bloodGroup: string;
  area: string;
  availability: string;
  contactPlatform: boolean;
  contactSms: boolean;
  contactWhatsapp: boolean;
  notifyUrgent: boolean;
  notifyCampaigns: boolean;
  preferredLanguage: string;
}

export function DonorProfileForm({
  labels,
  initial,
  groups,
  areas,
}: {
  labels: Record<string, string>;
  initial: DonorProfileInitial;
  groups: { value: string; label: string }[];
  areas: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [top, setTop] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const busy = useRef(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setErrors({});
    setTop(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const reply = await sendJson("/api/donor/profile", "PATCH", {
      bloodGroup: String(form.get("bloodGroup") ?? ""),
      area: String(form.get("area") ?? ""),
      availability: String(form.get("availability") ?? ""),
      contactPlatform: form.get("contactPlatform") === "on",
      contactSms: form.get("contactSms") === "on",
      contactWhatsapp: form.get("contactWhatsapp") === "on",
      notifyUrgent: form.get("notifyUrgent") === "on",
      notifyCampaigns: form.get("notifyCampaigns") === "on",
      preferredLanguage: String(form.get("preferredLanguage") ?? ""),
    });
    if (reply.ok) {
      setTop({ tone: "success", text: labels["donor.profile.saved"] });
      router.refresh(); // a changed language takes effect straight away
    } else if (reply.errors?.length) {
      setErrors(fieldMessages(reply.errors, labels, labels["donor.profile.errorGeneric"]));
    } else {
      setTop({ tone: "error", text: labels["donor.profile.errorGeneric"] });
    }
    busy.current = false;
    setPending(false);
  }

  async function remove() {
    setDeleting(true);
    const reply = await sendJson("/api/donor/profile", "DELETE", { confirm: true });
    if (reply.ok) {
      window.location.assign(reply.redirect ?? "/");
      return;
    }
    setDeleting(false);
    setConfirmDelete(false);
    setTop({ tone: "error", text: labels["donor.profile.errorGeneric"] });
  }

  return (
    <div>
      <Card className="card-pad">
        <form onSubmit={save} className="space-y-5" noValidate>
          {top ? (
            <Alert tone={top.tone} role={top.tone === "error" ? "alert" : "status"}>
              {top.text}
            </Alert>
          ) : null}

          <Field label={labels["field.bloodGroup"]} htmlFor="bloodGroup" required error={errors.bloodGroup}>
            <SelectInput id="bloodGroup" name="bloodGroup" defaultValue={initial.bloodGroup} invalid={Boolean(errors.bloodGroup)}>
              <option value="" disabled>
                {labels["field.bloodGroup"]}
              </option>
              {groups.map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label={labels["field.area"]} htmlFor="area" required error={errors.area}>
            <SelectInput id="area" name="area" defaultValue={initial.area} invalid={Boolean(errors.area)}>
              <option value="" disabled>
                {labels["donor.profile.chooseArea"]}
              </option>
              {areas.map((area) => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label={labels["donor.profile.availability"]} htmlFor="availability" error={errors.availability}>
            <SelectInput id="availability" name="availability" defaultValue={initial.availability}>
              <option value="available">{labels["donor.availability.available"]}</option>
              <option value="not_available">{labels["donor.availability.notAvailable"]}</option>
            </SelectInput>
          </Field>

          <fieldset>
            <legend className="label">{labels["donor.profile.channels"]}</legend>
            <div className="flex flex-wrap gap-4">
              <Checkbox label={labels["donor.channel.sms"]} name="contactSms" defaultChecked={initial.contactSms} />
              <Checkbox label={labels["donor.channel.whatsapp"]} name="contactWhatsapp" defaultChecked={initial.contactWhatsapp} />
              <Checkbox label={labels["donor.channel.platform"]} name="contactPlatform" defaultChecked={initial.contactPlatform} />
            </div>
            {errors.channels ? (
              <p className="error-text" role="alert">
                {errors.channels}
              </p>
            ) : null}
          </fieldset>

          <fieldset>
            <legend className="label">{labels["donor.profile.preferences"]}</legend>
            <div className="flex flex-wrap gap-4">
              <Checkbox label={labels["donor.pref.urgent"]} name="notifyUrgent" defaultChecked={initial.notifyUrgent} />
              <Checkbox label={labels["donor.pref.campaignNotices"]} name="notifyCampaigns" defaultChecked={initial.notifyCampaigns} />
            </div>
          </fieldset>

          <Field label={labels["field.language"]} htmlFor="preferredLanguage" error={errors.preferredLanguage}>
            <SelectInput id="preferredLanguage" name="preferredLanguage" defaultValue={initial.preferredLanguage}>
              <option value="en">{labels["nav.switchToEnglish"]}</option>
              <option value="ur">{labels["nav.switchToUrdu"]}</option>
            </SelectInput>
          </Field>

          <Button type="submit" block disabled={pending}>
            {pending ? labels["donor.profile.saving"] : labels["action.save"]}
          </Button>
        </form>
      </Card>

      <div className="mt-4">
        {confirmDelete ? (
          <Alert tone="warning" role="alert">
            <p className="font-medium">{labels["donor.profile.deleteConfirm"]}</p>
            <p className="mt-1 text-xs">{labels["donor.profile.deleteHint"]}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="danger" size="sm" onClick={remove} disabled={deleting}>
                {deleting ? labels["donor.profile.deleting"] : labels["donor.profile.deleteYes"]}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                {labels["donor.profile.deleteKeep"]}
              </Button>
            </div>
          </Alert>
        ) : (
          <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
            {labels["donor.profile.deleteAccount"]}
          </Button>
        )}
      </div>
    </div>
  );
}
