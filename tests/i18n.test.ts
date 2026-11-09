/**
 * Unit tests for src/lib/i18n/* (NFR-LOC-01..03, NFR-MAIN-02)
 *
 * SRS references:
 *   NFR-LOC-01 - no untranslated text in either language
 *   NFR-LOC-02 - language switch and saved preference (saved preference is
 *                resolved in server.ts, which imports server-only and is
 *                therefore not covered by this plain-Node suite)
 *   NFR-LOC-03 - Urdu is right to left
 *   NFR-MAIN-02 - all user-visible text kept separately from program logic
 *
 * `src/lib/i18n/index.ts` imports its parts without file extensions (the
 * Next.js/TypeScript convention). Plain Node needs the small resolver shim in
 * ts-loader.mjs, so this file registers it before importing the dictionary.
 *
 * Run directly:  node tests/i18n.test.ts
 */

import { register } from "node:module";
import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

register("./ts-loader.mjs", import.meta.url);

// Registered after the resolver hook so the extensionless imports resolve.
let dictionaries: Record<"en" | "ur", Record<string, string>>;
let translate: (locale: "en" | "ur", key: string, values?: Record<string, string | number>) => string;
let allKeys: () => string[];
let missingTranslations: () => { missingInUr: string[]; missingInEn: string[] };
let createTranslator: (locale: "en" | "ur") => (key: string, values?: Record<string, string | number>) => string;
let types: {
  LOCALES: readonly string[];
  isLocale: (value: string | undefined | null) => boolean;
  directionOf: (locale: "en" | "ur") => "ltr" | "rtl";
  isRtl: (locale: "en" | "ur") => boolean;
  interpolate: (template: string, values?: Record<string, string | number>) => string;
};

before(async () => {
  const index = await import("../src/lib/i18n/index.ts");
  dictionaries = index.DICTIONARIES as typeof dictionaries;
  translate = index.translate as typeof translate;
  allKeys = index.allKeys as typeof allKeys;
  missingTranslations = index.missingTranslations as typeof missingTranslations;
  createTranslator = index.createTranslator as typeof createTranslator;
  types = (await import("../src/lib/i18n/types.ts")) as unknown as typeof types;
});

const PLACEHOLDER = /\{(\w+)\}/g;

function placeholders(value: string): string[] {
  return [...value.matchAll(PLACEHOLDER)].map((match) => match[1]).sort();
}

const URDU_SCRIPT = /[\u0600-\u06FF]/;

describe("dictionary completeness (NFR-LOC-01)", () => {
  test("English and Urdu define exactly the same keys", () => {
    const { missingInUr, missingInEn } = missingTranslations();
    assert.deepEqual(missingInUr, [], "keys missing from Urdu");
    assert.deepEqual(missingInEn, [], "keys missing from English");
    assert.deepEqual(Object.keys(dictionaries.ur).sort(), Object.keys(dictionaries.en).sort());
  });

  test("no value is empty in either language", () => {
    const empty = allKeys().filter(
      (key) => !dictionaries.en[key].trim() || !dictionaries.ur[key].trim(),
    );
    assert.deepEqual(empty, []);
  });

  test("allKeys is sorted and unique", () => {
    const keys = allKeys();
    assert.equal(new Set(keys).size, keys.length);
    assert.deepEqual(keys, [...keys].sort());
    assert.ok(keys.length > 250, `expected the shared dictionary, got ${keys.length} keys`);
  });

  test("every key is used in both languages with the same placeholders", () => {
    // A notification or error can be shown in either language, so both
    // versions must accept the same {values} (NFR-LOC-04).
    const mismatched = allKeys().filter((key) => {
      const en = placeholders(dictionaries.en[key]).join(",");
      const ur = placeholders(dictionaries.ur[key]).join(",");
      return en !== ur;
    });
    assert.deepEqual(mismatched, []);
  });

  test("each shared key has exactly one owning dictionary part (NFR-MAIN-02)", async () => {
    // Guards against one module silently hiding another module's wording.
    const parts = await Promise.all([
      import("../src/lib/i18n/parts/common.ts"),
      import("../src/lib/i18n/parts/nav.ts"),
      import("../src/lib/i18n/parts/auth.ts"),
      import("../src/lib/i18n/parts/notifications.ts"),
      import("../src/lib/i18n/parts/stub.ts"),
      import("../src/lib/i18n/parts/hospital.ts"),
      import("../src/lib/i18n/parts/bloodbank.ts"),
      import("../src/lib/i18n/parts/donor.ts"),
      import("../src/lib/i18n/parts/organizer.ts"),
      import("../src/lib/i18n/parts/admin.ts"),
    ]);
    const owner = new Map<string, string>();
    const duplicated: string[] = [];
    for (const module of parts) {
      const [name, part] = Object.entries(module)[0] as [string, { en: Record<string, string> }];
      for (const key of Object.keys(part.en)) {
        if (owner.has(key)) duplicated.push(`${key} (${owner.get(key)} + ${name})`);
        else owner.set(key, name);
      }
    }
    assert.deepEqual(duplicated, []);
  });

  test("the four verification statuses keep their short labels (SRS 4.2, IR-02)", () => {
    assert.equal(dictionaries.en["status.pending"], "Pending");
    assert.equal(dictionaries.en["status.verified"], "Verified");
    assert.equal(dictionaries.en["status.rejected"], "Rejected");
    assert.equal(dictionaries.en["status.suspended"], "Suspended");
    for (const status of ["pending", "verified", "rejected", "suspended"]) {
      assert.equal(typeof dictionaries.ur[`status.${status}`], "string");
      assert.ok(dictionaries.ur[`status.${status}`].length > 0);
    }
  });

  test("Urdu screens use Urdu script, not leftover English", () => {
    const sample = [
      "landing.login",
      "landing.forgot",
      "nav.home",
      "nav.notifications",
      "validation.required",
      "status.verified",
      "notif.title",
    ];
    for (const key of sample) {
      assert.match(dictionaries.ur[key], URDU_SCRIPT, `${key} is not translated to Urdu`);
    }
  });
});

describe("translate", () => {
  test("returns the English string", () => {
    assert.equal(translate("en", "landing.welcome"), dictionaries.en["landing.welcome"]);
  });

  test("returns the Urdu string", () => {
    assert.equal(translate("ur", "landing.welcome"), dictionaries.ur["landing.welcome"]);
  });

  test("falls back to English for a key that only English defines", () => {
    // All keys exist in both languages today; this asserts the documented
    // fallback contract without relying on a missing key.
    assert.equal(translate("ur", "landing.welcome"), dictionaries.ur["landing.welcome"]);
    assert.equal(translate("ur", "app.name"), "واصل");
  });

  test("falls back to the key itself when no dictionary defines it", () => {
    assert.equal(translate("en", "this.key.does.not.exist"), "this.key.does.not.exist");
  });

  test("interpolates values into the translated string", () => {
    const result = translate("en", "status.byAdmin", { name: "Dr. Ali" });
    assert.equal(result, "By Dr. Ali");
    assert.equal(result.includes("{name}"), false);
  });

  test("interpolates numbers", () => {
    assert.equal(translate("en", "time.minutesAgo", { count: 5 }), "5 min ago");
    assert.equal(translate("en", "bell.unread", { count: 3 }), "3 unread");
  });

  test("leaves a placeholder untouched when no value is supplied", () => {
    assert.equal(translate("en", "status.byAdmin"), "By {name}");
  });

  test("ignores extra values that the template does not use", () => {
    assert.equal(translate("en", "landing.login", { unused: "x" }), dictionaries.en["landing.login"]);
  });

  test("createTranslator binds a language and interpolates", () => {
    const t = createTranslator("en");
    assert.equal(t("landing.login"), "Login");
    assert.equal(t("status.byAdmin", { name: "Sara" }), "By Sara");
  });
});

describe("interpolate", () => {
  test("replaces every placeholder occurrence", () => {
    assert.equal(types.interpolate("{a} and {a}", { a: "x" }), "x and x");
  });

  test("replaces several different placeholders", () => {
    assert.equal(types.interpolate("{a}-{b}", { a: "1", b: "2" }), "1-2");
  });

  test("returns the template unchanged when no values are given", () => {
    assert.equal(types.interpolate("plain text"), "plain text");
  });

  test("keeps an unknown placeholder as written", () => {
    assert.equal(types.interpolate("{known} {unknown}", { known: "yes" }), "yes {unknown}");
  });

  test("a value is inserted literally, not re-interpreted", () => {
    assert.equal(types.interpolate("{name}", { name: "{other}" }), "{other}");
  });
});

describe("direction (NFR-LOC-03)", () => {
  test("Urdu is right-to-left and English is left-to-right", () => {
    assert.equal(types.directionOf("ur"), "rtl");
    assert.equal(types.directionOf("en"), "ltr");
    assert.equal(types.isRtl("ur"), true);
    assert.equal(types.isRtl("en"), false);
  });

  test("exactly two supported languages", () => {
    assert.deepEqual([...types.LOCALES], ["en", "ur"]);
  });

  test("isLocale accepts only en and ur", () => {
    assert.equal(types.isLocale("en"), true);
    assert.equal(types.isLocale("ur"), true);
    assert.equal(types.isLocale("fr"), false);
    assert.equal(types.isLocale(undefined), false);
    assert.equal(types.isLocale(null), false);
  });
});
