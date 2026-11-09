import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { isLocale, type Locale } from "./types";

/**
 * Localization on the server - NFR-LOC-01..03.
 *
 * Language resolution order:
 *  1. a registered user's saved profile preference (LOC-02),
 *  2. the visitor's `wasl_lang` cookie (remembered on the device),
 *  3. English.
 */

export const LANGUAGE_COOKIE = "wasl_lang";

export const getLocale = cache(async (): Promise<Locale> => {
  const session = await getSession();
  if (session) return session.user.preferredLanguage;

  const store = await cookies();
  const cookieLocale = store.get(LANGUAGE_COOKIE)?.value;
  return isLocale(cookieLocale) ? cookieLocale : "en";
});
