"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Checkbox, Field, SelectInput, TextInput } from "@/components/ui";

export interface OrgRegisterLabels {
  title: string;
  subtitle: string;
  type: string;
  typeSelect: string;
  typeHospital: string;
  typeBloodBank: string;
  typeOrganiser: string;
  name: string;
  namePlaceholder: string;
  address: string;
  addressPlaceholder: string;
  officialPhone: string;
  phoneHint: string;
  officialEmail: string;
  licence: string;
  licencePlaceholder: string;
  representativeName: string;
  designation: string;
  designationPlaceholder: string;
  upload: string;
  uploadHint: string;
  password: string;
  confirmPassword: string;
  submit: string;
  submitting: string;
  errorLicence: string;
  errorDocument: string;
  errorFileType: string;
  errorFileSize: string;
  errorExists: string;
  errorGeneric: string;
  required: string;
  typeRequired: string;
  validation: Record<string, string>;
}

interface FieldError {
  field: string;
  message: string;
}

/**
 * G-02 - Organization registration form (FR-VER-01).
 * Submits multipart/form-data so the licence document travels with the
 * registration; the organization is created with status Pending.
 */
export function OrgRegistrationForm({ labels }: { labels: OrgRegisterLabels }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function messageFor(error: FieldError): string {
    if (error.field === "document") {
      if (error.message === "type") return labels.errorFileType;
      if (error.message === "size") return labels.errorFileSize;
      return labels.errorDocument;
    }
    if (error.field === "licenceNumber" && error.message === "required") return labels.errorLicence;
    return labels.validation[error.message] ?? labels.errorGeneric;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setTopError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const local: Record<string, string> = {};
    if (!String(formData.get("type") ?? "")) local.type = labels.typeRequired;
    if (!String(formData.get("licenceNumber") ?? "").trim()) local.licenceNumber = labels.errorLicence;
    if (!formData.get("document") || (formData.get("document") as File).size === 0) {
      local.document = labels.errorDocument;
    }
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/auth/org/register", { method: "POST", body: formData });
      const data = (await response.json()) as {
        ok?: boolean;
        redirect?: string;
        errors?: FieldError[];
        error?: { code?: string };
      };

      if (data.ok && data.redirect) {
        router.push(data.redirect);
        router.refresh();
        return;
      }

      if (data.error?.code === "exists") {
        setTopError(labels.errorExists);
        return;
      }

      if (data.errors?.length) {
        const mapped: Record<string, string> = {};
        for (const error of data.errors) mapped[error.field] = messageFor(error);
        setErrors(mapped);
        return;
      }
      setTopError(labels.errorGeneric);
    } catch {
      setTopError(labels.errorGeneric);
    } finally {
      setPending(false);
    }
  }

  function fieldError(field: string): string | undefined {
    return errors[field];
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data" noValidate>
      {topError ? (
        <Alert tone="error" role="alert">
          {topError}
        </Alert>
      ) : null}

      <Field label={labels.type} htmlFor="type" required error={fieldError("type")}>
        <SelectInput id="type" name="type" defaultValue="" required>
          <option value="" disabled>
            {labels.typeSelect}
          </option>
          <option value="hospital">{labels.typeHospital}</option>
          <option value="blood_bank">{labels.typeBloodBank}</option>
          <option value="donation_org">{labels.typeOrganiser}</option>
        </SelectInput>
      </Field>

      <Field label={labels.name} htmlFor="name" required error={fieldError("name")}>
        <TextInput id="name" name="name" placeholder={labels.namePlaceholder} required autoComplete="organization" />
      </Field>

      <Field label={labels.address} htmlFor="address" required error={fieldError("address")}>
        <TextInput id="address" name="address" placeholder={labels.addressPlaceholder} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={labels.officialPhone}
          htmlFor="officialPhone"
          required
          hint={labels.phoneHint}
          error={fieldError("officialPhone")}
        >
          <TextInput
            id="officialPhone"
            name="officialPhone"
            type="tel"
            inputMode="tel"
            placeholder="0300 1234567"
            required
          />
        </Field>
        <Field label={labels.officialEmail} htmlFor="officialEmail" required error={fieldError("officialEmail")}>
          <TextInput
            id="officialEmail"
            name="officialEmail"
            type="email"
            placeholder="office@example.org"
            required
            autoComplete="email"
          />
        </Field>
      </div>

      <Field label={labels.licence} htmlFor="licenceNumber" required error={fieldError("licenceNumber")}>
        <TextInput id="licenceNumber" name="licenceNumber" placeholder={labels.licencePlaceholder} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={labels.representativeName} htmlFor="representativeName" required error={fieldError("representativeName")}>
          <TextInput id="representativeName" name="representativeName" required autoComplete="name" />
        </Field>
        <Field label={labels.designation} htmlFor="representativeDesignation" required error={fieldError("representativeDesignation")}>
          <TextInput
            id="representativeDesignation"
            name="representativeDesignation"
            placeholder={labels.designationPlaceholder}
            required
          />
        </Field>
      </div>

      {/* Upload - wireframe: "upload supporting doc" button plus the inline error */}
      <div>
        <span className="label">{labels.upload}</span>
        <label
          htmlFor="document"
          className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-ink-300 bg-white px-4 py-3 text-sm font-semibold text-ink-800 hover:border-wasl-400 hover:bg-wasl-50"
        >
          <span>{labels.upload}</span>
          <input
            id="document"
            name="document"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="sr-only"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
          />
        </label>
        <p className="hint">{labels.uploadHint}</p>
        {fileName ? <p className="mt-1 text-sm font-medium text-ink-800">{fileName}</p> : null}
        {fieldError("document") ? (
          <p className="error-text" role="alert">
            {fieldError("document")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={labels.password} htmlFor="password" required error={fieldError("password")}>
          <TextInput id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        </Field>
        <Field label={labels.confirmPassword} htmlFor="confirmPassword" required error={fieldError("confirmPassword")}>
          <TextInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field>
      </div>

      <Button type="submit" block disabled={pending}>
        {pending ? labels.submitting : labels.submit}
      </Button>

      <p className="text-center text-xs text-ink-500">{labels.subtitle}</p>
    </form>
  );
}

/** Re-exported so the page can keep a single import. */
export type { FieldError };
