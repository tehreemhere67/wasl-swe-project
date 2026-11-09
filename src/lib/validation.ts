/**
 * Input validation.
 *
 * Deliberately framework-free so it can be unit-tested directly with
 * `node --test`, and shared by API routes and forms.
 *
 * SRS references:
 *  - FR-VER-01 mandatory organization fields
 *  - FR-DON-01 name + mobile number, confirmed by one-time passcode
 *  - NFR-SEC-01 passwords at least 8 characters, never stored readable
 *  - NFR-SEC-04 validate every input
 */

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

/** SRS A-07 / FR-INV-01 */
export const BLOOD_COMPONENTS = [
  "Whole blood",
  "Red blood cells",
  "Platelets",
  "Plasma",
] as const;
export type BloodComponent = (typeof BLOOD_COMPONENTS)[number];

/** SRS A-01 */
export const ORGANIZATION_TYPES = ["hospital", "blood_bank", "donation_org"] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const ROLES = ["admin", "hospital", "blood_bank", "donation_org", "donor"] as const;
export type Role = (typeof ROLES)[number];

export const LANGUAGES = ["en", "ur"] as const;
export type Language = (typeof LANGUAGES)[number];

export const VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "rejected",
  "suspended",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export type FieldError = { field: string; message: string };

export interface ValidationResult {
  ok: boolean;
  errors: FieldError[];
  values?: Record<string, string>;
}

function fail(errors: FieldError[], field: string, message: string): FieldError[] {
  errors.push({ field, message });
  return errors;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length <= 254 && EMAIL_RE.test(trimmed);
}

/**
 * Accepts the common Pakistani mobile formats and returns E.164:
 *   03001234567, 0300-1234567, +92 300 1234567, 923001234567
 * Returns null when the number is not a valid Pakistani mobile number.
 */
export function normalizeMobile(value: string): string | null {
  const digits = value.replace(/[^\d+]/g, "").replace(/^\+/, "");
  let national: string;
  if (/^92\d{10}$/.test(digits)) national = digits.slice(2);
  else if (/^0\d{10}$/.test(digits)) national = digits.slice(1);
  else if (/^\d{10}$/.test(digits)) national = digits;
  else return null;

  // Mobile networks in Pakistan: 3xx, and the new 4xx range used from 2026.
  if (!/^[34]\d{9}$/.test(national)) return null;
  return `+92${national}`;
}

export function isMobile(value: string): boolean {
  return normalizeMobile(value) !== null;
}

/** Pretty form used in the UI: +92 300 1234567 */
export function formatMobile(value: string): string {
  const normalized = normalizeMobile(value);
  if (!normalized) return value;
  const national = normalized.slice(3);
  return `+92 ${national.slice(0, 3)} ${national.slice(3)}`;
}

export function isStrongEnoughPassword(value: string): boolean {
  return typeof value === "string" && value.length >= 8 && value.length <= 200;
}

export function isValidOtp(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

export function isBloodGroup(value: string): value is BloodGroup {
  return (BLOOD_GROUPS as readonly string[]).includes(value);
}

export function isBloodComponent(value: string): value is BloodComponent {
  return (BLOOD_COMPONENTS as readonly string[]).includes(value);
}

export function isOrganizationType(value: string): value is OrganizationType {
  return (ORGANIZATION_TYPES as readonly string[]).includes(value);
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

export function isVerificationStatus(value: string): value is VerificationStatus {
  return (VERIFICATION_STATUSES as readonly string[]).includes(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Login form: phone/email + password (G-01 wireframe). */
export function validateLogin(input: {
  identifier?: unknown;
  password?: unknown;
}): ValidationResult {
  const errors: FieldError[] = [];
  const identifier = text(input.identifier);
  const password = typeof input.password === "string" ? input.password : "";

  if (!identifier) {
    fail(errors, "identifier", "required");
  } else if (!isEmail(identifier) && !isMobile(identifier)) {
    fail(errors, "identifier", "invalidIdentifier");
  }
  if (!password) fail(errors, "password", "required");

  return { ok: errors.length === 0, errors, values: { identifier, password } };
}

/** G-02 organization registration form - FR-VER-01. */
export function validateOrganizationRegistration(input: Record<string, unknown>): ValidationResult {
  const errors: FieldError[] = [];
  const values: Record<string, string> = {
    type: text(input.type),
    name: text(input.name),
    address: text(input.address),
    officialPhone: text(input.officialPhone),
    officialEmail: text(input.officialEmail),
    licenceNumber: text(input.licenceNumber),
    representativeName: text(input.representativeName),
    representativeDesignation: text(input.representativeDesignation),
    password: typeof input.password === "string" ? input.password : "",
    confirmPassword: typeof input.confirmPassword === "string" ? input.confirmPassword : "",
  };

  if (!values.type) fail(errors, "type", "required");
  else if (!isOrganizationType(values.type)) fail(errors, "type", "invalid");

  if (!values.name) fail(errors, "name", "required");
  else if (values.name.length < 3 || values.name.length > 160) fail(errors, "name", "invalid");

  if (!values.address) fail(errors, "address", "required");
  else if (values.address.length < 5 || values.address.length > 300) fail(errors, "address", "invalid");

  if (!values.officialPhone) fail(errors, "officialPhone", "required");
  else if (!isMobile(values.officialPhone)) fail(errors, "officialPhone", "invalidMobile");

  if (!values.officialEmail) fail(errors, "officialEmail", "required");
  else if (!isEmail(values.officialEmail)) fail(errors, "officialEmail", "invalidEmail");

  if (!values.licenceNumber) fail(errors, "licenceNumber", "required");
  else if (values.licenceNumber.length < 3 || values.licenceNumber.length > 60) {
    fail(errors, "licenceNumber", "invalid");
  }

  if (!values.representativeName) fail(errors, "representativeName", "required");
  else if (values.representativeName.length > 160) fail(errors, "representativeName", "invalid");

  if (!values.representativeDesignation) fail(errors, "representativeDesignation", "required");
  else if (values.representativeDesignation.length > 120) {
    fail(errors, "representativeDesignation", "invalid");
  }

  // NFR-SEC-01
  if (!values.password) fail(errors, "password", "required");
  else if (!isStrongEnoughPassword(values.password)) fail(errors, "password", "tooShort");

  if (!values.confirmPassword) fail(errors, "confirmPassword", "required");
  else if (values.password !== values.confirmPassword) fail(errors, "confirmPassword", "mismatch");

  return { ok: errors.length === 0, errors, values };
}

/** G-03 donor signup - FR-DON-01 and DR-03 consent. */
export function validateDonorSignup(input: Record<string, unknown>): ValidationResult {
  const errors: FieldError[] = [];
  const values: Record<string, string> = {
    name: text(input.name),
    mobile: text(input.mobile),
    password: typeof input.password === "string" ? input.password : "",
    confirmPassword: typeof input.confirmPassword === "string" ? input.confirmPassword : "",
  };
  const consent = input.consent === true;

  if (!values.name) fail(errors, "name", "required");
  else if (values.name.length < 2 || values.name.length > 160) fail(errors, "name", "invalid");

  const mobile = normalizeMobile(values.mobile);
  if (!values.mobile) fail(errors, "mobile", "required");
  else if (!mobile) fail(errors, "mobile", "invalidMobile");

  if (!values.password) fail(errors, "password", "required");
  else if (!isStrongEnoughPassword(values.password)) fail(errors, "password", "tooShort");

  if (values.confirmPassword && values.password !== values.confirmPassword) {
    fail(errors, "confirmPassword", "mismatch");
  }

  // DR-03: the donor must agree that contact details are shared after Willing.
  if (!consent) fail(errors, "consent", "required");

  return { ok: errors.length === 0, errors, values };
}

/** Password reset: new password + confirmation. */
export function validatePasswordReset(input: Record<string, unknown>): ValidationResult {
  const errors: FieldError[] = [];
  const password = typeof input.password === "string" ? input.password : "";
  const confirmPassword = typeof input.confirmPassword === "string" ? input.confirmPassword : "";
  if (!password) fail(errors, "password", "required");
  else if (!isStrongEnoughPassword(password)) fail(errors, "password", "tooShort");
  if (!confirmPassword) fail(errors, "confirmPassword", "required");
  else if (password !== confirmPassword) fail(errors, "confirmPassword", "mismatch");
  return { ok: errors.length === 0, errors, values: { password } };
}

/** Maps a field error code to a stable i18n key. */
export function errorKey(code: string): string {
  return `validation.${code}`;
}
