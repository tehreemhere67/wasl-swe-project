import { NextResponse } from "next/server";
import { getSession, savePreferredLanguage } from "@/lib/auth/session";
import { LANGUAGE_COOKIE } from "@/lib/i18n/server";
import { isLocale } from "@/lib/i18n/types";
import { recordAudit } from "@/lib/audit";
import { badRequest, forbidden, refererPath } from "@/lib/api";
import { isSameOrigin } from "@/lib/csrf";

/**
 * POST /api/language - language switch present on every page (IR-03).
 * Saves the choice on the account (NFR-LOC-02), or in a cookie for visitors,
 * then returns the user to the page they were on.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbidden();

  const form = await request.formData().catch(() => null);
  const locale = form ? String(form.get("locale") ?? "") : "";
  if (!isLocale(locale)) return badRequest({ code: "invalid_locale" });

  const response = NextResponse.redirect(new URL(refererPath(request, "/"), request.url), 303);
  response.cookies.set(LANGUAGE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
  });

  const session = await getSession();
  if (session) {
    await savePreferredLanguage(session.user.id, locale);
    await recordAudit({
      actorUserId: session.user.id,
      actorRole: session.user.role,
      action: "language_changed",
      details: { locale },
    });
  }

  return response;
}
