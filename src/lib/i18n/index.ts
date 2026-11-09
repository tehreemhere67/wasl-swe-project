import type { Dictionary, DictionaryPart, Locale } from "./types";
import { interpolate } from "./types";

import { common } from "./parts/common";
import { nav } from "./parts/nav";
import { auth } from "./parts/auth";
import { notifications } from "./parts/notifications";
import { stub } from "./parts/stub";
import { hospital } from "./parts/hospital";
import { bloodbank } from "./parts/bloodbank";
import { donor } from "./parts/donor";
import { organizer } from "./parts/organizer";
import { admin } from "./parts/admin";

/**
 * Every dictionary part, in merge order. A part is owned by one module, which
 * keeps translation work conflict-free between team members (NFR-MAIN-02).
 */
const PARTS: DictionaryPart[] = [
  common,
  nav,
  auth,
  notifications,
  stub,
  hospital,
  bloodbank,
  donor,
  organizer,
  admin,
];

function merge(locale: "en" | "ur"): Dictionary {
  const merged: Dictionary = {};
  for (const part of PARTS) {
    Object.assign(merged, part[locale]);
  }
  return merged;
}

export const DICTIONARIES: Record<Locale, Dictionary> = {
  en: merge("en"),
  ur: merge("ur"),
};

/**
 * Translates a key. Falls back to English and finally to the key itself, so a
 * missing translation never breaks a screen.
 */
export function translate(
  locale: Locale,
  key: string,
  values?: Record<string, string | number>,
): string {
  const dictionary = DICTIONARIES[locale] ?? DICTIONARIES.en;
  const value = dictionary[key] ?? DICTIONARIES.en[key] ?? key;
  return interpolate(value, values);
}

/** All keys defined in English (the source language). */
export function allKeys(): string[] {
  return Object.keys(DICTIONARIES.en).sort();
}

/** Keys that exist in one language but not the other - used by the test suite. */
export function missingTranslations(): { missingInUr: string[]; missingInEn: string[] } {
  const en = new Set(Object.keys(DICTIONARIES.en));
  const ur = new Set(Object.keys(DICTIONARIES.ur));
  return {
    missingInUr: [...en].filter((key) => !ur.has(key)).sort(),
    missingInEn: [...ur].filter((key) => !en.has(key)).sort(),
  };
}

/** Convenience type for components that receive pre-translated labels. */
export type Translator = (key: string, values?: Record<string, string | number>) => string;

export function createTranslator(locale: Locale): Translator {
  return (key, values) => translate(locale, key, values);
}
