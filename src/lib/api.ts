import { NextResponse } from "next/server";
import type { FieldError } from "@/lib/validation";

/** Small helpers shared by the API route handlers. */

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(errors: FieldError[] | { code: string }) {
  return NextResponse.json(
    { ok: false, errors: Array.isArray(errors) ? errors : undefined, error: Array.isArray(errors) ? undefined : errors },
    { status: 400 },
  );
}

export function unauthorized() {
  return NextResponse.json({ ok: false, error: { code: "unauthorized" } }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ ok: false, error: { code: "forbidden" } }, { status: 403 });
}

export function serverError(message = "server_error") {
  return NextResponse.json({ ok: false, error: { code: message } }, { status: 500 });
}

/** Redirect used after plain HTML form submissions (works without JavaScript). */
export function redirectTo(request: Request, path: string, status: 303 = 303) {
  return NextResponse.redirect(new URL(path, request.url), status);
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

/** Only allow same-site relative redirects ("/x"), never "//evil.example". */
export function safeRedirectPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

/** The page that submitted a form, used to return the user to where they were. */
export function refererPath(request: Request, fallback = "/"): string {
  const referer = request.headers.get("referer");
  if (!referer) return fallback;
  try {
    const url = new URL(referer);
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (host && url.host !== host) return fallback;
    return safeRedirectPath(`${url.pathname}${url.search}`, fallback);
  } catch {
    return fallback;
  }
}
