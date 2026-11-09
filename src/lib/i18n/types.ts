/**
 * Localization - SRS section 7 (NFR-LOC-01..07).
 *
 * Every string shown to a user goes through this dictionary. Text is kept
 * separately from program logic (NFR-MAIN-02), so wording can be corrected in
 * one place and both languages always stay complete.
 */

export const LOCALES = ["en", "ur"] as const;
export type Locale = (typeof LOCALES)[number];

export type Dictionary = Record<string, string>;

export interface DictionaryPart {
  en: Dictionary;
  ur: Dictionary;
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ur";
}

export function directionOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ur" ? "rtl" : "ltr";
}

export function isRtl(locale: Locale): boolean {
  return locale === "ur";
}

/** Replaces {placeholders} in a translated string. */
export function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
  );
}
