/**
 * Unit tests for src/lib/validation.ts
 *
 * SRS references:
 *   FR-VER-01 - mandatory organization registration fields
 *   FR-DON-01 - donor name + mobile number, confirmed by one-time passcode
 *   DR-03     - donor consent that contact details are shared after Willing
 *   NFR-SEC-01 - passwords at least 8 characters
 *   NFR-SEC-04 - every input is validated
 *
 * Run directly:  node tests/validation.test.ts
 * Run the suite: node tests/run-all.ts
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  BLOOD_COMPONENTS,
  BLOOD_GROUPS,
  LANGUAGES,
  ORGANIZATION_TYPES,
  ROLES,
  VERIFICATION_STATUSES,
  errorKey,
  formatMobile,
  isBloodComponent,
  isBloodGroup,
  isEmail,
  isLanguage,
  isMobile,
  isOrganizationType,
  isRole,
  isStrongEnoughPassword,
  isValidOtp,
  isVerificationStatus,
  normalizeMobile,
  validateDonorSignup,
  validateLogin,
  validateOrganizationRegistration,
  validatePasswordReset,
  type ValidationResult,
} from "../src/lib/validation.ts";

/** Error codes recorded for one field. */
function codes(result: ValidationResult, field: string): string[] {
  return result.errors.filter((error) => error.field === field).map((error) => error.message);
}

function hasField(result: ValidationResult, field: string): boolean {
  return result.errors.some((error) => error.field === field);
}

// ---------------------------------------------------------------------------
// Mobile numbers - the common Pakistani formats in the G-01/G-02/G-03 forms
// ---------------------------------------------------------------------------
describe("normalizeMobile", () => {
  test("normalises 0300-1234567 to E.164", () => {
    assert.equal(normalizeMobile("0300-1234567"), "+923001234567");
  });

  test("normalises +92 300 1234567 to E.164", () => {
    assert.equal(normalizeMobile("+92 300 1234567"), "+923001234567");
  });

  test("normalises 923001234567 to E.164", () => {
    assert.equal(normalizeMobile("923001234567"), "+923001234567");
  });

  test("normalises the unpunctuated national form 03001234567", () => {
    assert.equal(normalizeMobile("03001234567"), "+923001234567");
  });

  test("normalises a bare 10-digit number", () => {
    assert.equal(normalizeMobile("3001234567"), "+923001234567");
  });

  test("ignores dashes and spaces anywhere in the number", () => {
    assert.equal(normalizeMobile("+92-300-1234567"), "+923001234567");
    assert.equal(normalizeMobile(" 0300 123 4567 "), "+923001234567");
  });

  test("accepts the new 4xx mobile range used from 2026", () => {
    assert.equal(normalizeMobile("0400-1234567"), "+924001234567");
  });

  test("rejects 12345 (too short)", () => {
    assert.equal(normalizeMobile("12345"), null);
  });

  test("rejects a Karachi landline such as 021-1234567", () => {
    assert.equal(normalizeMobile("021-1234567"), null);
  });

  test("rejects a number with the wrong length", () => {
    assert.equal(normalizeMobile("0300-123456"), null);
    assert.equal(normalizeMobile("+92 300 12345678"), null);
  });

  test("rejects a non-Pakistani number", () => {
    assert.equal(normalizeMobile("+1 555 123 4567"), null);
  });

  test("rejects empty and non-numeric input", () => {
    assert.equal(normalizeMobile(""), null);
    assert.equal(normalizeMobile("   "), null);
    assert.equal(normalizeMobile("abc"), null);
  });

  test("isMobile agrees with normalizeMobile", () => {
    assert.equal(isMobile("0300-1234567"), true);
    assert.equal(isMobile("021-1234567"), false);
    assert.equal(isMobile("12345"), false);
  });

  test("formatMobile shows the pretty +92 300 1234567 form", () => {
    assert.equal(formatMobile("0300-1234567"), "+92 300 1234567");
    assert.equal(formatMobile("+923001234567"), "+92 300 1234567");
  });

  test("formatMobile leaves an invalid number unchanged", () => {
    assert.equal(formatMobile("12345"), "12345");
  });
});

// ---------------------------------------------------------------------------
// Email - official contact email (FR-VER-01) and login identifier (G-01)
// ---------------------------------------------------------------------------
describe("isEmail", () => {
  test("accepts ordinary addresses", () => {
    assert.equal(isEmail("name@example.com"), true);
    assert.equal(isEmail("first.last+tag@sub.example.pk"), true);
    assert.equal(isEmail("  admin@hospital.pk  "), true);
  });

  test("rejects addresses without a valid shape", () => {
    assert.equal(isEmail("no-at-sign"), false);
    assert.equal(isEmail("a@b"), false, "a one-character domain is not accepted");
    assert.equal(isEmail("a@b.c"), false, "the TLD must be at least two characters");
    assert.equal(isEmail("a b@example.com"), false);
    assert.equal(isEmail(""), false);
  });

  test("rejects an address longer than 254 characters", () => {
    const long = `${"a".repeat(250)}@example.com`;
    assert.equal(isEmail(long), false);
  });
});

// ---------------------------------------------------------------------------
// NFR-SEC-01: "Passwords shall be at least 8 characters"
// ---------------------------------------------------------------------------
describe("isStrongEnoughPassword", () => {
  test("accepts exactly 8 characters (the SRS minimum)", () => {
    assert.equal(isStrongEnoughPassword("12345678"), true);
    assert.equal(isStrongEnoughPassword("a".repeat(8)), true);
  });

  test("rejects 7 characters", () => {
    assert.equal(isStrongEnoughPassword("1234567"), false);
    assert.equal(isStrongEnoughPassword(""), false);
  });

  test("accepts up to 200 characters and rejects more", () => {
    assert.equal(isStrongEnoughPassword("a".repeat(200)), true);
    assert.equal(isStrongEnoughPassword("a".repeat(201)), false);
  });

  test("counts characters literally, without trimming spaces", () => {
    assert.equal(isStrongEnoughPassword(" ".repeat(8)), true, "8 spaces still satisfy the length rule");
    assert.equal(isStrongEnoughPassword(" ".repeat(7)), false, "7 characters are not enough");
  });
});

// ---------------------------------------------------------------------------
// OTP - six digits, FR-DON-01 / IR-07
// ---------------------------------------------------------------------------
describe("isValidOtp", () => {
  test("accepts exactly six digits", () => {
    assert.equal(isValidOtp("123456"), true);
    assert.equal(isValidOtp("000000"), true);
    assert.equal(isValidOtp(" 123456 "), true, "surrounding spaces are trimmed");
  });

  test("rejects the wrong length", () => {
    assert.equal(isValidOtp("12345"), false);
    assert.equal(isValidOtp("1234567"), false);
  });

  test("rejects non-digits and empty input", () => {
    assert.equal(isValidOtp("12345a"), false);
    assert.equal(isValidOtp("12 345"), false);
    assert.equal(isValidOtp(""), false);
  });
});

// ---------------------------------------------------------------------------
// Controlled values - SRS section 4.2
// ---------------------------------------------------------------------------
describe("controlled values (SRS 4.2)", () => {
  test("there are eight blood groups and O-negative is one of them", () => {
    assert.equal(BLOOD_GROUPS.length, 8);
    assert.ok(BLOOD_GROUPS.includes("O-"));
    assert.equal(isBloodGroup("O-"), true);
    assert.equal(isBloodGroup("o-"), false, "matching is exact");
    assert.equal(isBloodGroup("C+"), false);
  });

  test("there are four blood components", () => {
    assert.deepEqual([...BLOOD_COMPONENTS], ["Whole blood", "Red blood cells", "Platelets", "Plasma"]);
    assert.equal(isBloodComponent("Platelets"), true);
    assert.equal(isBloodComponent("plasma"), false);
  });

  test("there are three organization types", () => {
    assert.deepEqual([...ORGANIZATION_TYPES], ["hospital", "blood_bank", "donation_org"]);
    assert.equal(isOrganizationType("donation_org"), true);
    assert.equal(isOrganizationType("clinic"), false);
  });

  test("there are five user roles", () => {
    assert.equal(ROLES.length, 5);
    assert.equal(isRole("blood_bank"), true);
    assert.equal(isRole("public"), false);
  });

  test("there are exactly two languages", () => {
    assert.deepEqual([...LANGUAGES], ["en", "ur"]);
    assert.equal(isLanguage("ur"), true);
    assert.equal(isLanguage("ar"), false);
  });

  test("there are four verification statuses (A-04)", () => {
    assert.deepEqual([...VERIFICATION_STATUSES], ["pending", "verified", "rejected", "suspended"]);
    assert.equal(isVerificationStatus("suspended"), true);
    assert.equal(isVerificationStatus("approved"), false);
  });
});

// ---------------------------------------------------------------------------
// Login form - G-01
// ---------------------------------------------------------------------------
describe("validateLogin", () => {
  test("accepts an email identifier and a password", () => {
    const result = validateLogin({ identifier: "admin@wasl.pk", password: "WaslAdmin#2026" });
    assert.equal(result.ok, true);
    assert.equal(result.errors.length, 0);
  });

  test("accepts a mobile identifier in any common format", () => {
    for (const identifier of ["0300-1234567", "+92 300 1234567", "923001234567"]) {
      const result = validateLogin({ identifier, password: "WaslAdmin#2026" });
      assert.equal(result.ok, true, identifier);
    }
  });

  test("trims the identifier", () => {
    const result = validateLogin({ identifier: "  admin@wasl.pk ", password: "x" });
    assert.equal(result.values?.identifier, "admin@wasl.pk");
  });

  test("rejects an identifier that is neither an email nor a mobile number", () => {
    const result = validateLogin({ identifier: "not-an-account", password: "secret123" });
    assert.equal(result.ok, false);
    assert.deepEqual(codes(result, "identifier"), ["invalidIdentifier"]);
  });

  test("requires both identifier and password", () => {
    const result = validateLogin({});
    assert.equal(result.ok, false);
    assert.deepEqual(codes(result, "identifier"), ["required"]);
    assert.deepEqual(codes(result, "password"), ["required"]);
  });

  test("treats non-string values as missing (NFR-SEC-04)", () => {
    const result = validateLogin({ identifier: 923001234567, password: 12345678 });
    assert.equal(result.ok, false);
    assert.equal(hasField(result, "identifier"), true);
    assert.equal(hasField(result, "password"), true);
  });

  test("does not trim the password", () => {
    const result = validateLogin({ identifier: "admin@wasl.pk", password: " pass word " });
    assert.equal(result.values?.password, " pass word ");
  });
});

// ---------------------------------------------------------------------------
// FR-VER-01 - every mandatory organization field is rejected with a message
// ---------------------------------------------------------------------------
const validOrganization = {
  type: "hospital",
  name: "Aga Khan University Hospital",
  address: "Stadium Road, Karachi",
  officialPhone: "0300-1234567",
  officialEmail: "admin@akuh.pk",
  licenceNumber: "LIC-2026-001",
  representativeName: "Dr. Fatima Ali",
  representativeDesignation: "Medical Superintendent",
  password: "correct-horse-battery",
  confirmPassword: "correct-horse-battery",
};

describe("validateOrganizationRegistration (FR-VER-01)", () => {
  test("accepts a complete registration", () => {
    const result = validateOrganizationRegistration(validOrganization);
    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);
  });

  test("accepts each organization type", () => {
    for (const type of ORGANIZATION_TYPES) {
      const result = validateOrganizationRegistration({ ...validOrganization, type });
      assert.equal(result.ok, true, type);
    }
  });

  test("trims the submitted text values", () => {
    const result = validateOrganizationRegistration({
      ...validOrganization,
      name: "  Aga Khan University Hospital  ",
    });
    assert.equal(result.values?.name, "Aga Khan University Hospital");
  });

  test("requires the organization type and rejects an unknown one", () => {
    const missing = validateOrganizationRegistration({ ...validOrganization, type: "" });
    assert.deepEqual(codes(missing, "type"), ["required"]);

    const invalid = validateOrganizationRegistration({ ...validOrganization, type: "clinic" });
    assert.deepEqual(codes(invalid, "type"), ["invalid"]);
  });

  test("requires each of the nine SRS fields", () => {
    // FR-VER-01 lists: name, type, Karachi address, official phone, official
    // email, licence number, representative name, representative designation,
    // and (minimum) one supporting document. The document is checked by the
    // registration route, not by this pure module.
    const mandatory = [
      "type",
      "name",
      "address",
      "officialPhone",
      "officialEmail",
      "licenceNumber",
      "representativeName",
      "representativeDesignation",
      "password",
      "confirmPassword",
    ];
    for (const field of mandatory) {
      const result = validateOrganizationRegistration({ ...validOrganization, [field]: "" });
      assert.equal(result.ok, false, `${field} must be mandatory`);
      assert.deepEqual(codes(result, field), ["required"], field);
    }
  });

  test("rejects a too-short or too-long organization name", () => {
    assert.deepEqual(codes(validateOrganizationRegistration({ ...validOrganization, name: "AB" }), "name"), ["invalid"]);
    assert.deepEqual(
      codes(validateOrganizationRegistration({ ...validOrganization, name: "A".repeat(161) }), "name"),
      ["invalid"],
    );
  });

  test("rejects a too-short address (it must be a Karachi address)", () => {
    assert.deepEqual(
      codes(validateOrganizationRegistration({ ...validOrganization, address: "KHI" }), "address"),
      ["invalid"],
    );
    assert.equal(validateOrganizationRegistration({ ...validOrganization, address: " ".repeat(6) }).ok, false);
  });

  test("rejects an invalid official phone number", () => {
    const result = validateOrganizationRegistration({ ...validOrganization, officialPhone: "12345" });
    assert.deepEqual(codes(result, "officialPhone"), ["invalidMobile"]);
  });

  test("rejects an invalid official email address", () => {
    const result = validateOrganizationRegistration({ ...validOrganization, officialEmail: "not-an-email" });
    assert.deepEqual(codes(result, "officialEmail"), ["invalidEmail"]);
  });

  test("rejects a too-short licence number", () => {
    const result = validateOrganizationRegistration({ ...validOrganization, licenceNumber: "12" });
    assert.deepEqual(codes(result, "licenceNumber"), ["invalid"]);
  });

  test("requires the representative name and designation", () => {
    const noName = validateOrganizationRegistration({ ...validOrganization, representativeName: "" });
    assert.deepEqual(codes(noName, "representativeName"), ["required"]);

    const noDesignation = validateOrganizationRegistration({
      ...validOrganization,
      representativeDesignation: "",
    });
    assert.deepEqual(codes(noDesignation, "representativeDesignation"), ["required"]);
  });

  test("rejects a password shorter than 8 characters (NFR-SEC-01)", () => {
    const result = validateOrganizationRegistration({
      ...validOrganization,
      password: "1234567",
      confirmPassword: "1234567",
    });
    assert.deepEqual(codes(result, "password"), ["tooShort"]);
  });

  test("rejects a password confirmation that does not match", () => {
    const result = validateOrganizationRegistration({
      ...validOrganization,
      confirmPassword: "something-else",
    });
    assert.deepEqual(codes(result, "confirmPassword"), ["mismatch"]);
  });
});

// ---------------------------------------------------------------------------
// FR-DON-01 name + mobile, DR-03 consent - G-03
// ---------------------------------------------------------------------------
const validDonor = {
  name: "Ali Khan",
  mobile: "0300-1234567",
  password: "donor-pass-1",
  confirmPassword: "donor-pass-1",
  consent: true,
};

describe("validateDonorSignup (FR-DON-01, DR-03)", () => {
  test("accepts name, mobile, password and consent", () => {
    const result = validateDonorSignup(validDonor);
    assert.equal(result.ok, true, JSON.stringify(result.errors));
  });

  test("requires a name of at least two characters", () => {
    assert.deepEqual(codes(validateDonorSignup({ ...validDonor, name: "" }), "name"), ["required"]);
    assert.deepEqual(codes(validateDonorSignup({ ...validDonor, name: "A" }), "name"), ["invalid"]);
  });

  test("requires a valid mobile number", () => {
    assert.deepEqual(codes(validateDonorSignup({ ...validDonor, mobile: "" }), "mobile"), ["required"]);
    assert.deepEqual(
      codes(validateDonorSignup({ ...validDonor, mobile: "021-1234567" }), "mobile"),
      ["invalidMobile"],
    );
  });

  test("DR-03: registration is refused without explicit consent", () => {
    const missing = validateDonorSignup({ ...validDonor, consent: undefined });
    assert.equal(missing.ok, false);
    assert.deepEqual(codes(missing, "consent"), ["required"]);

    const falseConsent = validateDonorSignup({ ...validDonor, consent: false });
    assert.deepEqual(codes(falseConsent, "consent"), ["required"]);
  });

  test("DR-03: consent must be a real boolean, not the string 'true'", () => {
    const result = validateDonorSignup({ ...validDonor, consent: "true" });
    assert.deepEqual(codes(result, "consent"), ["required"]);
  });

  test("enforces the 8-character password rule (NFR-SEC-01)", () => {
    const result = validateDonorSignup({ ...validDonor, password: "short", confirmPassword: "short" });
    assert.deepEqual(codes(result, "password"), ["tooShort"]);
  });

  test("rejects a confirmation that does not match", () => {
    const result = validateDonorSignup({ ...validDonor, confirmPassword: "different-1" });
    assert.deepEqual(codes(result, "confirmPassword"), ["mismatch"]);
  });

  test("reports every missing field at once", () => {
    const result = validateDonorSignup({});
    assert.deepEqual(codes(result, "name"), ["required"]);
    assert.deepEqual(codes(result, "mobile"), ["required"]);
    assert.deepEqual(codes(result, "password"), ["required"]);
    assert.deepEqual(codes(result, "consent"), ["required"]);
  });
});

// ---------------------------------------------------------------------------
// Password reset - new password + confirmation
// ---------------------------------------------------------------------------
describe("validatePasswordReset", () => {
  test("accepts a matching new password", () => {
    const result = validatePasswordReset({ password: "new-password-1", confirmPassword: "new-password-1" });
    assert.equal(result.ok, true);
  });

  test("rejects a mismatch", () => {
    const result = validatePasswordReset({ password: "new-password-1", confirmPassword: "new-password-2" });
    assert.deepEqual(codes(result, "confirmPassword"), ["mismatch"]);
  });

  test("rejects a short password", () => {
    const result = validatePasswordReset({ password: "short", confirmPassword: "short" });
    assert.deepEqual(codes(result, "password"), ["tooShort"]);
  });

  test("requires both entries", () => {
    const result = validatePasswordReset({});
    assert.deepEqual(codes(result, "password"), ["required"]);
    assert.deepEqual(codes(result, "confirmPassword"), ["required"]);
  });
});

// ---------------------------------------------------------------------------
// Field error codes map to stable i18n keys (NFR-LOC-01 / NFR-USA-04)
// ---------------------------------------------------------------------------
describe("errorKey", () => {
  test("maps a field error code to its dictionary key", () => {
    assert.equal(errorKey("required"), "validation.required");
    assert.equal(errorKey("invalidMobile"), "validation.invalidMobile");
    assert.equal(errorKey("mismatch"), "validation.mismatch");
  });
});
